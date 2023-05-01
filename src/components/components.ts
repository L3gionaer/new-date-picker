export interface CustomComponentConfig {
    selector: string;
    templateUrl: string;
    styleUrl?: string;
}

export const Component = (config: CustomComponentConfig) => {
    const getTemplate = new Promise<HTMLTemplateElement>(async (resolve, reject) => {
        const parser = new DOMParser();
        const res = await fetch('/src/' + config.templateUrl);
        const html = await res.text();
    
        let template = parser
            .parseFromString(html, 'text/html')
            .querySelector('template');
    
        if(!template) template = document.createElement('template');

        if(config.styleUrl) {
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', '/src/' + config.styleUrl);

            template.content.append(link);
        }
       
        resolve(template);
    });

    return <T extends { new(...args: any[]): any }>(constructor: T) => {
        const connectedCallback = constructor.prototype.connectedCallback;

        const component = class extends constructor {
            getTemplate: Promise<HTMLTemplateElement> = getTemplate;

            constructor(...args: any[]) {
                super();
            }

            connectedCallback() {
                this.getTemplate.then((template) => {
                    const clone = document.importNode(template.content, true);

                    this.attachShadow({mode: 'open'}).appendChild(clone)

                    connectedCallback.call(this);
                })
            }
        };

        customElements.define(config.selector, component);
    }
}

   
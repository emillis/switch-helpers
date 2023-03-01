export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean
}

function makePropertyManagerOptionsReasonable(options?: propertyManagerOptions): propertyManagerOptions {
    options = options || {
        throwErrorIfTagUndefined: true
    }

    options.throwErrorIfTagUndefined === undefined ? options.throwErrorIfTagUndefined = true : options.throwErrorIfTagUndefined

    return options
}

export class PropertyManager {
    private readonly flowElement: FlowElement;
    private readonly options: propertyManagerOptions;

    private propertyExists(tag: string): boolean {
        if (this.flowElement.hasProperty(tag)) return true;

        if (this.options.throwErrorIfTagUndefined) throw `Property with tag "${tag}" does not exist!`;

        return false;
    }

    async getProperty(tag: string): Promise<string | string[] | undefined> {
        if (!this.propertyExists(tag)) return undefined;
        let propertyName = "";

        try {
            propertyName = this.flowElement.getPropertyDisplayName(tag);
            return await this.flowElement.getPropertyStringValue(tag);
        } catch (e) {
            throw `An error occurred while trying to retrieve value from property with tag: "${tag}"${propertyName ? `, display name "${propertyName}"` : ""}! Original error: "${e}".`
        }
    }
    async getStringProperty(tag: string): Promise<string | undefined> {
        const val = await this.getProperty(tag);

        if (val === undefined) return undefined;
        if (Array.isArray(val)) return val.join();
        return `${val}`
    }
    async getNumberProperty(tag: string): Promise<number | undefined> {
        const val = await this.getProperty(tag);

        if (val === undefined) return undefined;
        if (Array.isArray(val)) return +val.join();
        return +val
    }
    async getBooleanProperty(tag: string): Promise<boolean | undefined> {
        const val = await this.getProperty(tag);

        if (val === undefined) return undefined;
        if (Array.isArray(val)) throw `Got an array supplied while expecting a boolean value!`;
        if (val.toLowerCase() === "yes") return true;
        if (val.toLowerCase() === "no") return false;
        return !!val;
    }

    constructor(flowElement: FlowElement, options?: propertyManagerOptions) {
        this.flowElement = flowElement;
        this.options = makePropertyManagerOptionsReasonable(options);
    }
}
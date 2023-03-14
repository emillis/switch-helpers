export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean
}

export type getPropertyFromListOptions = {
    caseSensitive?: boolean
    partialMatch?: boolean
}

function makeGetPropertyFromListOptionsReasonable(options?: getPropertyFromListOptions): getPropertyFromListOptions {
    options = options || {
        caseSensitive: true,
        partialMatch: false
    }

    options.caseSensitive = options.caseSensitive === undefined ? true : options.caseSensitive;
    options.partialMatch = options.partialMatch === undefined ? false : options.partialMatch;

    return options
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
    async getPropertyFromList<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<T | undefined> {
        options = makeGetPropertyFromListOptionsReasonable(options);
        if (typeof listObject !== "object") throw `Value supplied is not an object!`;
        let tagVal = await this.getStringProperty(tag) || "";
        if (options.caseSensitive !== true) tagVal = tagVal.toLowerCase();

        const myEnum = <{[key: string]: string}><unknown>listObject

        for (const key of Object.keys(myEnum)) {
            const val = options.caseSensitive === true ? `${myEnum[key]}` : `${myEnum[key]}`.toLowerCase();

            if (options.partialMatch === false ? (val !== tagVal) : (val.search(tagVal) === -1)) continue;

            return <T><unknown>myEnum[key]
        }

        return undefined
    }
    async getArrayProperty(tag: string): Promise<string[] | undefined> {
        let val = await this.getProperty(tag);

        if (val === undefined || val === "") return undefined;

        if (!Array.isArray(val)) val = [val]

        return val
    }

    constructor(flowElement: FlowElement, options?: propertyManagerOptions) {
        this.flowElement = flowElement;
        this.options = makePropertyManagerOptionsReasonable(options);
    }
}
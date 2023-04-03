export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean
}

export type getPropertyFromListOptions = {
    caseSensitive?: boolean
    partialMatch?: boolean
}

export type arrayPropertyOptions = {
    separator?: string
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

    propertyExists(tag: string): boolean {
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
    async getPropertyFromList<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<any | undefined> {
        options = makeGetPropertyFromListOptionsReasonable(options);
        if (typeof listObject !== "object") throw `Value supplied is not an object!`;
        let tagVal = await this.getStringProperty(tag);
        if (tagVal === undefined) return undefined;
        if (options.caseSensitive !== true) tagVal = (tagVal || "").toLowerCase();

        //@ts-ignore
        for (let val of Object.values(listObject)) {
            val = options.caseSensitive ? `${val}` : `${val}`.toLowerCase();
            if (!options.partialMatch ? (tagVal === val) : (`${val}`.indexOf(tagVal) === -1)) return val;
        }

        return undefined
    }
    async getArrayProperty(tag: string, options?: arrayPropertyOptions): Promise<string[] | undefined> {
        let values = await this.getProperty(tag);

        if (values === undefined || values === "") return undefined;

        if (!Array.isArray(values)) values = [values]

        if (options && options.separator !== undefined) {
            let results: string[] = [];

            for (const value of values) results.push(...value.split(options.separator))

            values = results
        }

        return values
    }

    constructor(flowElement: FlowElement, options?: propertyManagerOptions) {
        this.flowElement = flowElement;
        this.options = makePropertyManagerOptionsReasonable(options);
    }
}

// const resultTypes = {
//     String: "String",
//     Number: "Number",
//     Boolean: "Boolean",
//     Array: "Array",
//     PropertyFromList: "PropertyFromList"
// } as const;
// type resultTypes = typeof resultTypes[keyof typeof resultTypes];
//
// type propertyDefinitionOptions = {
//     tag: string
//     resultType: resultTypes
//     nullValueHandler?: (...args: any[]) => any
//     customValueHandlers?: {value: any, handler: (arg0: any) => any}[]
//     listOfAllowedProperties?: object
//     getPropertyFromListOptions?: getPropertyFromListOptions
//     throwErrorIfTagDoesntExist?: boolean
// }
//
// class PropertyDefinition {
//     private readonly options: propertyDefinitionOptions;
//     private makePropertyDefinitionOptionsReasonable(o?: propertyDefinitionOptions): propertyDefinitionOptions {
//         if (!o) throw `Property definition options are not defined!`;
//
//         if (o.tag === undefined || o.tag === "") throw `Property tag is not defined!`;
//         const resultTypeValues = Object.values(resultTypes);
//         if (!o.resultType || !resultTypeValues.includes(o.resultType)) throw `Invalid result type "${this.options.resultType}" supplied to property "${this.options.tag}"! Allowed values are: "${resultTypeValues.join(`", "`)}".`;
//         if (o.resultType === resultTypes.PropertyFromList && !this.options.listOfAllowedProperties) throw `Result type "${resultTypes.PropertyFromList}" selected, but list of allowed properties is not provided!`;
//         if (o.throwErrorIfTagDoesntExist === undefined) o.throwErrorIfTagDoesntExist = true;
//
//         return o
//     }
//
//     async getResult(pm: PropertyManager): Promise<any> {
//         switch (this.options.resultType) {
//             case "String":
//                 return await pm.getStringProperty(this.options.tag);
//             case "Number":
//                 return await pm.getNumberProperty(this.options.tag);
//             case "Boolean":
//                 return await pm.getBooleanProperty(this.options.tag);
//             case "Array":
//                 return await pm.getArrayProperty(this.options.tag);
//             case "PropertyFromList":
//                 return await pm.getPropertyFromList(this.options.listOfAllowedProperties, this.options.tag, this.options.getPropertyFromListOptions);
//             default:
//                 throw `Handler for result type "${this.options.resultType}" was not found!`;
//         }
//     }
//
//     async parse(pm: PropertyManager): Promise<any> {
//         if (!pm.propertyExists(this.options.tag) && this.options.throwErrorIfTagDoesntExist) throw `Property with tag "${this.options.tag}" does not exist!`;
//
//         let result = await this.getResult(pm);
//
//         for (const customValueHandler of this.options.customValueHandlers || []) {
//             if (result !== customValueHandler.value) continue;
//             result = await customValueHandler.handler(result);
//         }
//         if (this.options.nullValueHandler !== undefined && !result) result = this.options.nullValueHandler(result)
//
//         return result
//     }
//
//     constructor(options: propertyDefinitionOptions) {
//         this.options = this.makePropertyDefinitionOptionsReasonable(options);
//     }
// }
//
// const propertyTagDefinitions = {
//     one: new PropertyDefinition({tag: "", resultType: resultTypes.String}),
//     two: new PropertyDefinition({tag: "", resultType: resultTypes.String}),
//     three: new PropertyDefinition({tag: "", resultType: resultTypes.String}),
//     four: new PropertyDefinition({tag: "", resultType: resultTypes.String}),
//     five: new PropertyDefinition({tag: "", resultType: resultTypes.String}),
// }
//
// type _testStructure = {
//     one: string
//     two: string
//     three: string
//     four: string
//     five: string
// }
//
// class IntegratedPropertyManager {
//     private readonly pm: PropertyManager;
//     private readonly definitions: {[key:string]: PropertyDefinition};
//
//     constructor(flowElement: FlowElement, definitions: {[key:string]: PropertyDefinition}) {
//         this.pm = new PropertyManager(flowElement, {throwErrorIfTagUndefined: false})
//         this.definitions = definitions;
//     }
// }
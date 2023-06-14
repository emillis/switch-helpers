"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyManager = void 0;
function makeGetPropertyFromListOptionsReasonable(options) {
    options = options || {
        caseSensitive: true,
        partialMatch: false
    };
    options.caseSensitive = options.caseSensitive === undefined ? true : options.caseSensitive;
    options.partialMatch = options.partialMatch === undefined ? false : options.partialMatch;
    return options;
}
function makePropertyManagerOptionsReasonable(options) {
    options = options || {
        throwErrorIfTagUndefined: true
    };
    options.throwErrorIfTagUndefined === undefined ? options.throwErrorIfTagUndefined = true : options.throwErrorIfTagUndefined;
    return options;
}
class PropertyManager {
    flowElement;
    options;
    propertyExists(tag) {
        if (this.flowElement.hasProperty(tag))
            return true;
        if (this.options.throwErrorIfTagUndefined)
            throw `Property with tag "${tag}" does not exist!`;
        return false;
    }
    async getProperty(tag) {
        if (!this.propertyExists(tag))
            return undefined;
        let propertyName = "";
        try {
            propertyName = this.flowElement.getPropertyDisplayName(tag);
            return await this.flowElement.getPropertyStringValue(tag);
        }
        catch (e) {
            throw `An error occurred while trying to retrieve value from property with tag: "${tag}"${propertyName ? `, display name "${propertyName}"` : ""}! Original error: "${e}".`;
        }
    }
    async getStringProperty(tag, options) {
        const val = await this.getProperty(tag);
        if (val === undefined)
            return undefined;
        if (Array.isArray(val))
            return val.join(options?.separatorIfArray);
        return `${val}`;
    }
    async getStringPropertyOrFail(tag) {
        const val = await this.getStringProperty(tag);
        if (val === undefined)
            throw `tag "${tag}" has undefined value!`;
        return val;
    }
    async getNumberProperty(tag) {
        const val = await this.getProperty(tag);
        if (val === undefined)
            return undefined;
        if (Array.isArray(val))
            return +val.join();
        return +val;
    }
    async getNumberPropertyOrFail(tag) {
        const val = await this.getNumberProperty(tag);
        if (val === undefined)
            throw `tag "${tag}" has undefined value!`;
        return val;
    }
    async getBooleanProperty(tag) {
        const val = await this.getProperty(tag);
        if (val === undefined)
            return undefined;
        if (Array.isArray(val))
            throw `Got an array supplied while expecting a boolean value!`;
        if (val.toLowerCase() === "yes")
            return true;
        if (val.toLowerCase() === "no")
            return false;
        return !!val;
    }
    async getBooleanPropertyOrFail(tag) {
        const val = await this.getBooleanProperty(tag);
        if (val === undefined)
            throw `tag "${tag}" has undefined value!`;
        return val;
    }
    async getPropertyFromList(listObject, tag, options) {
        options = makeGetPropertyFromListOptionsReasonable(options);
        if (typeof listObject !== "object")
            throw `Value supplied is not an object!`;
        let tagVal = await this.getStringProperty(tag);
        if (tagVal === undefined)
            return undefined;
        if (options.caseSensitive !== true)
            tagVal = (tagVal || "").toLowerCase();
        //@ts-ignore
        for (let val of Object.values(listObject)) {
            val = options.caseSensitive ? `${val}` : `${val}`.toLowerCase();
            if (!options.partialMatch ? (tagVal === val) : (`${val}`.indexOf(tagVal) === -1))
                return val;
        }
        return undefined;
    }
    async getPropertyFromListOrFail(listObject, tag, options) {
        const val = await this.getPropertyFromList(listObject, tag, options);
        try {
            // @ts-ignore
            if (val === undefined)
                throw `tag "${tag}" value "${val}" is not allowed! Allowed values are: "${Object.values(listObject).join(`", "`)}"`;
        }
        catch {
            throw `tag "${tag}" has invalid value "${val}" defined!`;
        }
        return val;
    }
    async getArrayProperty(tag, options) {
        let values = await this.getProperty(tag);
        if (values === undefined || values === "")
            return undefined;
        if (!Array.isArray(values))
            values = [values];
        if (options && options.separator !== undefined) {
            let results = [];
            for (const value of values)
                results.push(...value.split(options.separator));
            values = results;
        }
        return values;
    }
    async getArrayPropertyOrFail(tag, options) {
        const val = await this.getArrayProperty(tag, options);
        if (val === undefined)
            throw `tag "${tag}" has undefined value!`;
        return val;
    }
    constructor(flowElement, options) {
        this.flowElement = flowElement;
        this.options = makePropertyManagerOptionsReasonable(options);
    }
}
exports.PropertyManager = PropertyManager;

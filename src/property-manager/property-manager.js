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
    async getStringProperty(tag) {
        const val = await this.getProperty(tag);
        if (val === undefined)
            return undefined;
        if (Array.isArray(val))
            return val.join();
        return `${val}`;
    }
    async getNumberProperty(tag) {
        const val = await this.getProperty(tag);
        if (val === undefined)
            return undefined;
        if (Array.isArray(val))
            return +val.join();
        return +val;
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
    async getPropertyFromList(listObject, tag, options) {
        options = makeGetPropertyFromListOptionsReasonable(options);
        if (typeof listObject !== "object")
            throw `Value supplied is not an object!`;
        let tagVal = await this.getStringProperty(tag);
        if (tagVal === undefined)
            return undefined;
        if (options.caseSensitive !== true)
            tagVal = (tagVal || "").toLowerCase();
        for (let val of Object.values(listObject)) {
            val = options.caseSensitive ? `${val}` : `${val}`.toLowerCase();
            if (!options.partialMatch ? (tagVal === val) : (val.search(tagVal) === -1))
                return val;
        }
        return undefined;
    }
    async getArrayProperty(tag, separator) {
        let values = await this.getProperty(tag);
        if (values === undefined || values === "")
            return undefined;
        if (!Array.isArray(values))
            values = [values];
        if (separator !== undefined) {
            let results = [];
            for (const value of values)
                results.push(...value.split(separator));
            values = results;
        }
        return values;
    }
    constructor(flowElement, options) {
        this.flowElement = flowElement;
        this.options = makePropertyManagerOptionsReasonable(options);
    }
}
exports.PropertyManager = PropertyManager;

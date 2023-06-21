/// <reference types="switch-scripting" />
export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean;
};
export type getPropertyFromListOptions = {
    caseSensitive?: boolean;
    partialMatch?: boolean;
};
export type arrayPropertyOptions = {
    separator?: string;
};
export type getStringPropertyOptions = {
    separatorIfArray?: string;
};
export declare class PropertyManager {
    private readonly flowElement;
    private readonly options;
    propertyExists(tag: string): boolean;
    getProperty(tag: string): Promise<string | string[] | undefined>;
    getStringProperty(tag: string, options?: getStringPropertyOptions): Promise<string | undefined>;
    getStringPropertyOrFail(tag: string, options?: getStringPropertyOptions): Promise<string>;
    getNumberProperty(tag: string): Promise<number | undefined>;
    getNumberPropertyOrFail(tag: string): Promise<number>;
    getBooleanProperty(tag: string): Promise<boolean | undefined>;
    getBooleanPropertyOrFail(tag: string): Promise<boolean>;
    getPropertyFromList<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<any | undefined>;
    getPropertyFromListOrFail<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<any | undefined>;
    getArrayProperty(tag: string, options?: arrayPropertyOptions): Promise<string[] | undefined>;
    getArrayPropertyOrFail(tag: string, options?: arrayPropertyOptions): Promise<string[]>;
    constructor(flowElement: FlowElement, options?: propertyManagerOptions);
}

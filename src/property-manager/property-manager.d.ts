/// <reference types="switch-scripting" />
export declare type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean;
};
export declare type getPropertyFromListOptions = {
    caseSensitive?: boolean;
    partialMatch?: boolean;
};
export declare type arrayPropertyOptions = {
    separator?: string;
};
export declare class PropertyManager {
    private readonly flowElement;
    private readonly options;
    propertyExists(tag: string): boolean;
    getProperty(tag: string): Promise<string | string[] | undefined>;
    getStringProperty(tag: string): Promise<string | undefined>;
    getStringPropertyOrFail(tag: string): Promise<string>;
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

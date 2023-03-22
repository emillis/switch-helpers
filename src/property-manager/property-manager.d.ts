/// <reference types="switch-scripting" />
export declare type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean;
};
export declare type getPropertyFromListOptions = {
    caseSensitive?: boolean;
    partialMatch?: boolean;
};
export declare class PropertyManager {
    private readonly flowElement;
    private readonly options;
    private propertyExists;
    getProperty(tag: string): Promise<string | string[] | undefined>;
    getStringProperty(tag: string): Promise<string | undefined>;
    getNumberProperty(tag: string): Promise<number | undefined>;
    getBooleanProperty(tag: string): Promise<boolean | undefined>;
    getPropertyFromList<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<any | undefined>;
    getArrayProperty(tag: string): Promise<string[] | undefined>;
    constructor(flowElement: FlowElement, options?: propertyManagerOptions);
}

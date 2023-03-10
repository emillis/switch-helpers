/// <reference types="switch-scripting" />
export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean;
};
export type getPropertyFromListOptions = {
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
    getPropertyFromList<T>(listObject: T, tag: string, options?: getPropertyFromListOptions): Promise<T | undefined>;
    constructor(flowElement: FlowElement, options?: propertyManagerOptions);
}

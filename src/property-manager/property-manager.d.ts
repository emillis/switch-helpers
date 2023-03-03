/// <reference types="switch-scripting" />
export type propertyManagerOptions = {
    throwErrorIfTagUndefined?: boolean;
};
export declare class PropertyManager {
    private readonly flowElement;
    private readonly options;
    private propertyExists;
    getProperty(tag: string): Promise<string | string[] | undefined>;
    getStringProperty(tag: string): Promise<string | undefined>;
    getNumberProperty(tag: string): Promise<number | undefined>;
    getBooleanProperty(tag: string): Promise<boolean | undefined>;
    constructor(flowElement: FlowElement, options?: propertyManagerOptions);
}

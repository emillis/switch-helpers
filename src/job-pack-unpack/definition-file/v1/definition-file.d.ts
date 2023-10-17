/// <reference types="switch-scripting" />
export declare type externalMetadata = {
    path: string;
    name: string;
    extension: string;
    model: DatasetModel;
};
export declare type internalMetadata = {
    key: string;
    value: string;
};
export declare type metadata = {
    external: externalMetadata[];
    internal: internalMetadata[];
};
export declare type fileDef = {
    path: string;
    originalName: string;
    originalPrefix: string;
};
export declare type privateDataSignature = {
    tag: string;
    value: any;
};
export declare type definitionStructure = {
    privateData: privateDataSignature[];
    metadata: metadata;
    file: fileDef;
};
export declare class DefinitionStructure {
    private readonly struct;
    addPrivateData(job: Job): Promise<void>;
    addExternalMetadata(job: Job): Promise<void>;
    addInternalMetadata(job: Job): Promise<void>;
    addFileInfo(job: Job): Promise<void>;
    get(): Promise<definitionStructure>;
    constructor();
}

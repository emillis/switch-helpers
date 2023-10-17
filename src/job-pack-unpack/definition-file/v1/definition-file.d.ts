/// <reference types="switch-scripting" />
export type externalMetadata = {
    path: string;
    name: string;
    extension: string;
    model: DatasetModel;
};
export type internalMetadata = {
    key: string;
    value: string;
};
export type metadata = {
    external: externalMetadata[];
    internal: internalMetadata[];
};
export type fileDef = {
    path: string;
    originalName: string;
    originalPrefix: string;
};
export type privateDataSignature = {
    tag: string;
    value: any;
};
export type definitionStructure = {
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

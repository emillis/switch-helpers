/// <reference types="switch-scripting" />
export declare const allowedDatasetModels: {
    readonly JSON: "JSON";
    readonly XML: "XML";
    readonly Opaque: "Opaque";
};
export type allowedDatasetModels = typeof allowedDatasetModels[keyof typeof allowedDatasetModels];
export type options = {
    replaceIfExist?: boolean;
};
export declare class DatasetGenerator {
    private readonly job;
    private readonly tmpFileLocation;
    private readonly nameGenerator;
    private tmpFileLocations;
    private checkForAllowedDatasetModels;
    private addJsonDataset;
    private addXmlDataset;
    private addOpaqueDataset;
    addDataset(datasetName: string, model: allowedDatasetModels, data: any, options?: options): Promise<void>;
    removeTmpFiles(): void;
    constructor(job: Job, tmpFileLocation?: string);
}

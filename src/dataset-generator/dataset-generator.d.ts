/// <reference types="switch-scripting" />
export declare const allowedDatasetModels: {
    readonly JSON: "JSON";
    readonly Opaque: "Opaque";
};
export type allowedDatasetModels = typeof allowedDatasetModels[keyof typeof allowedDatasetModels];
export declare class DatasetGenerator {
    private readonly job;
    private readonly tmpFileLocation;
    private readonly nameGenerator;
    private tmpFileLocations;
    private checkForAllowedDatasetModels;
    private addJsonDataset;
    addDataset(datasetName: string, model: allowedDatasetModels, data: any): Promise<void>;
    removeTmpFiles(): void;
    constructor(job: Job, tmpFileLocation?: string);
}

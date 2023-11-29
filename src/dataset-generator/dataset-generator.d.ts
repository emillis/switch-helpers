/// <reference types="switch-scripting" />
export declare type options = {
    replaceIfExist?: boolean;
};
export declare class DatasetGenerator {
    private readonly job;
    private readonly tmpFileLocation;
    private readonly nameGenerator;
    private tmpFileLocations;
    private addJsonDataset;
    private addXmlDataset;
    private addXmpDataset;
    private addJdfDataset;
    private addOpaqueDataset;
    addDataset(datasetName: string, model: DatasetModel, data: any, isDataAFile: boolean, options?: options): Promise<void>;
    removeTmpFiles(): void;
    constructor(job: Job, tmpFileLocation?: string);
}

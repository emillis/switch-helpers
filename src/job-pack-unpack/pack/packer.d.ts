/// <reference types="switch-scripting" />
export declare type jobPackerOptions = {};
export declare class JobPacker {
    private readonly tmpLoc;
    private readonly options;
    private readonly archiver;
    private getDefaultJobPackerOptions;
    private checkOptions;
    private generateRootFolder;
    private packExternalMetadata;
    private packJobFile;
    private saveDefinition;
    private generateArchive;
    pack(job: Job): Promise<string>;
    constructor(tmpLocation: string, options?: jobPackerOptions);
}

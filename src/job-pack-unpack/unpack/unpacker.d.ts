/// <reference types="switch-scripting" />
import { definitions } from "../index";
export declare class JobUnPacker {
    private readonly tmpLoc;
    private packedJobLoc;
    private rootFolderLoc;
    private unArchive;
    private readDefinition;
    private setPrivateData;
    private setExternalMetadata;
    private setInternalMetadata;
    cleanup(): Promise<void>;
    unpack(packedJob: string, tmpJob: Job): Promise<{
        job: Job;
        def: definitions.v1.definitionStructure;
    }>;
    constructor(tmpLocation: string);
}

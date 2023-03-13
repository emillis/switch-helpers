export declare const allowedActions: {
    readonly createUpdate: "createUpdate";
    readonly recall: "recall";
    readonly remove: "remove";
};
export type allowedActions = typeof allowedActions[keyof typeof allowedActions];
export declare const addFileStatus: {
    readonly Ok: "Ok";
    readonly FileAlreadyExists: "FileAlreadyExists";
    readonly Unknown: "Unknown";
    readonly InputFileNotExist: "InputFileNotExist";
};
export type addFileStatus = typeof addFileStatus[keyof typeof addFileStatus];
export declare const removeFileStatus: {
    readonly Ok: "Ok";
    readonly FileDoesntExist: "FileDoesntExist";
    readonly Unknown: "Unknown";
};
export type removeFileStatus = typeof removeFileStatus[keyof typeof removeFileStatus];
export type cacheAddFileOptions = {
    overwrite?: boolean;
};
export type fileList = {
    count: number;
    names: string[];
    moreInfo: {
        [p: string]: {
            pathToFile: string;
            dir: string;
        };
    };
};
export declare class Cache {
    private readonly rootLocation;
    private readonly cacheName;
    private readonly cacheLocation;
    private readonly statsFileLocation;
    private readonly statsFile;
    private statsFileExist;
    private createStatsFile;
    private parseFileManagers;
    addFile(location: string, metadata?: {
        [p: string]: string;
    }, belongsToGroups?: string[], options?: cacheAddFileOptions): addFileStatus;
    addMetadataToFile(fileName: string, metadata: {
        [p: string]: string;
    }): void;
    addFileToGroup(fileName: string, groups: string[]): void;
    removeFile(name: string): removeFileStatus;
    removeMetadata(fileName: string, key: string): void;
    removeGroup(fileName: string, group_name: string): void;
    getFiles(name: string): fileList;
    getFilesInGroup(group_name: string): fileList | undefined;
    getMetadata(fileName: string, metadata_key: string): string | undefined;
    getFilesWithMetadataKey(key: string): fileList | undefined;
    getFilesWhereMetadataValueMatches(key: string, value: string): fileList | undefined;
    constructor(rootLocation: string, name: string);
}
export declare class CacheManager {
    private readonly rootLocation;
    cacheExists(name: string): boolean;
    initiateNewCache(name: string, overwrite?: boolean): Cache;
    getCache(name: string): Cache;
    getOrInitiateCache(name: string): Cache;
    constructor(rootLocation: string);
}

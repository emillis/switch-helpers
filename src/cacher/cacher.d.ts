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
    newName?: string;
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
export type filters = {
    keywords?: string[];
    inGroups?: string[];
    groupsLogic?: "or" | "and";
};
export declare class Cache {
    private readonly rootLocation;
    private readonly cacheName;
    private readonly cacheLocation;
    private readonly statsFileLocation;
    private readonly statsFile;
    private findFiles;
    private statsFileExist;
    private createStatsFile;
    addFile(location: string, belongsToGroups?: string[], options?: cacheAddFileOptions): addFileStatus;
    removeFiles(names: string[], partialMatch?: boolean, caseSensitive?: boolean): void;
    getFiles(keywords: string[], partialMatch?: boolean, caseSensitive?: boolean): fileList;
    getFilesInGroups(group_names: string[], logic: "or" | "and"): string[];
    getFilesWithFilter(filters: filters, partialMatch?: boolean, caseSensitive?: boolean): fileList;
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

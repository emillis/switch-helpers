export declare type groups = {
    ids: string[];
    files: {
        [groupId: string]: string[];
    };
};
export declare class GroupsManager {
    private readonly groups;
    private checkGroupsStructure;
    getAll(): groups;
    getGroup(group_name: string): string[] | undefined;
    removeGroup(group_name: string): void;
    createGroupIfDoesntExist(group_name: string): void;
    addToGroup(group_name: string, fileName: string): void;
    removeFromGroup(group_name: string, fileName: string): void;
    constructor(groupJson: any);
}
export declare type metadata = {
    [p: string]: {
        [p: string]: string;
    };
};
export declare class MetadataManager {
    private readonly metadata;
    private checkMetadataStructure;
    getAll(): metadata;
    add(key: string, value: string, fileName: string): void;
    remove(key: string, fileName: string): void;
    getValue(key: string, fileName: string): string | undefined;
    getFileNamesWithMetadata(key: string): string[] | undefined;
    getFileNamesWhereValueMatches(key: string, value: string): string[] | undefined;
    constructor(metadataJson: any);
}
export declare type file = {
    name: string;
    location: string;
    groups: string[];
    metadata: {
        [p: string]: string;
    };
};
export declare class FileManager {
    private readonly file;
    private checkFileStructure;
    getName(): string;
    setName(name: string): void;
    getGroups(): string[];
    inGroup(group_name: string): boolean;
    addToGroup(group_name: string): void;
    removeFromGroup(group_name: string): void;
    getAllMetadata(): {
        [p: string]: string;
    };
    getMetadata(key: string): string | undefined;
    setMetadata(key: string, values: string): void;
    setMetadataFromObject(metadata: {
        [p: string]: string;
    }): void;
    removeMetadata(key: string): void;
    getLocation(): string;
    constructor(fileJson: file);
}
export declare class FilesManager {
    private readonly files;
    private readonly fileManagers;
    private readonly storageRootLocation;
    getFile(name: string): FileManager | undefined;
    removeFile(name: string): void;
    addFile(name: string, metadata?: {
        [p: string]: string;
    }, belongsToGroups?: string[]): void;
    matchFiles(val: string): string[];
    constructor(filesJson: any, storageLocation: string);
}
export declare type statsFile = {
    files: file[];
    groups: groups;
    metadata: metadata;
};
export declare class StatsFile {
    private readonly statsFile;
    private readonly statsFileLocation;
    private readonly FilesManager;
    private readonly MetadataManager;
    private readonly GroupsManager;
    private checkStatsFile;
    private addToMetadata;
    private addToGroups;
    getFile(name: string): FileManager | undefined;
    getGroup(group_name: string): FileManager[] | undefined;
    getMetadata(fileName: string, metadata_key: string): string | undefined;
    getFilesThatHaveMetadataKey(key: string, value?: string | undefined): FileManager[] | undefined;
    addFile(name: string, metadata?: {
        [p: string]: string;
    }, belongsToGroups?: string[]): void;
    addMetadata(fileName: string, metadata: {
        [p: string]: string;
    }): void;
    addToGroup(fileName: string, groups: string[]): void;
    removeFile(name: string): void;
    removeMetadata(fileName: string, key: string): void;
    removeGroup(fileName: string, group_name: string): void;
    matchFiles(val: string): FileManager[];
    saveFile(): void;
    constructor(statsFileRootLocation: string, statsFileName: string);
}

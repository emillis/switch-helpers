export type groups = {
    groupToFile: {
        [groupId: string]: string[];
    };
    fileToGroup: {
        [fileName: string]: string[];
    };
};
export declare class GroupsManager {
    private readonly groups;
    private checkGroupsStructure;
    private addFilesToGroup;
    private addGroupsToFile;
    private removeFilesFromGroup;
    private removeGroupsFromFile;
    getAll(): groups;
    getAllFilesInGroup(group_name: string): string[] | undefined;
    groupExists(group_name: string): boolean;
    getAllGroupsOfAFile(file_name: string): string[] | undefined;
    removeGroup(file_name: string, group_names: string[]): void;
    addGroup(file_name: string, groups: string[]): void;
    runCleanup(): void;
    constructor(groupJson: any);
}

export type statsFile = {
    groups: groups;
};
export declare class StatsFile {
    private readonly statsFile;
    private readonly statsFileLocation;
    readonly GroupsManager: GroupsManager;
    private checkStatsFile;
    private runCleanup;
    saveFile(): void;
    constructor(statsFileRootLocation: string, statsFileName: string);
}

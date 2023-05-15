import * as fs from "fs-extra";
import * as path from "path";

//======[GROUPS]================================================================================================

export type groups = {
    groupToFile: {[groupId:string]: string[]}
    fileToGroup: {[fileName: string]: string[]}
}

export class GroupsManager {
    private readonly groups: groups;
    private checkGroupsStructure(groups?: groups): groups {
        if (!groups) groups = {groupToFile: {}, fileToGroup: {}};
        if (!groups.groupToFile) groups.groupToFile = {};
        if (!groups.fileToGroup) groups.fileToGroup = {};
        return groups
    }
    private addFilesToGroup(group_name: string, files: string[]) {
        let groupFiles = this.groups.groupToFile[group_name];
        if (!groupFiles) {
            this.groups.groupToFile[group_name] = []
            groupFiles = this.groups.groupToFile[group_name];
        }

        for (const file of files) if (!groupFiles.includes(file)) groupFiles.push(file)
    }
    private addGroupsToFile(file_name: string, groups: string[]) {
        let existingGroups = this.groups.fileToGroup[file_name];
        if (!existingGroups) {
            this.groups.fileToGroup[file_name] = []
            existingGroups = this.groups.fileToGroup[file_name]
        }

        for (const group of groups) if (!existingGroups.includes(group)) existingGroups.push(group)
    }
    private removeFilesFromGroup(group_name: string, files: string[]) {
        const existingFiles = this.groups.groupToFile[group_name];
        if (!existingFiles) return;

        for (const file of files) {
            const i = existingFiles.indexOf(file)
            if (i === -1) continue;
            existingFiles.splice(i, 1)
        }
    }
    private removeGroupsFromFile(file_name: string, groups: string[]) {
        const existingGroups = this.groups.fileToGroup[file_name];
        if (!existingGroups) return;

        for (const group of groups) {
            const i = existingGroups.indexOf(group);
            if (i === -1) continue;
            existingGroups.splice(i, 1)
        }
    }

    getAll(): groups {
        return this.groups
    }

    getAllFilesInGroup(group_name: string): string[] | undefined {
        let files = this.groups.groupToFile[group_name];
        return !files ? undefined : [...files];
    }
    groupExists(group_name: string): boolean {
        return !!this.getAllFilesInGroup(group_name)
    }
    getAllGroupsOfAFile(file_name: string): string[] | undefined {
        const groups = this.groups.fileToGroup[file_name];
        return !groups ? undefined : [...groups]
    }
    removeGroup(file_name: string, group_names: string[]) {
        this.removeGroupsFromFile(file_name, group_names)
        for (const group of group_names) this.removeFilesFromGroup(group, [file_name])
    }
    addGroup(file_name: string, groups: string[]) {
        this.addGroupsToFile(file_name, groups)
        for (const group of groups) this.addFilesToGroup(group, [file_name])
    }

    runCleanup() {
        for (const key of Object.keys(this.groups.groupToFile)) {
            const val = this.groups.groupToFile[key];

            if (val && Array.isArray(val) && val.length) continue;

            delete this.groups.groupToFile[key]
        }

        for (const key of Object.keys(this.groups.fileToGroup)) {
            const val = this.groups.fileToGroup[key];

            if (val && Array.isArray(val) && val.length) continue;

            delete this.groups.fileToGroup[key]
        }
    }

    constructor(groupJson: any) {
        this.groups = this.checkGroupsStructure(groupJson);
    }
}

//======[STATS FILE]================================================================================================

export type statsFile = {
    groups: groups,
}

export class StatsFile {
    private readonly statsFile: statsFile;
    private readonly statsFileLocation: string;
    readonly GroupsManager: GroupsManager;
    private checkStatsFile(f: any): statsFile {
        const defaultStruct: statsFile = {groups: {groupToFile: {}, fileToGroup: {}}}
        if (!f) f = defaultStruct;
        if (!f.groups) f.groups = defaultStruct.groups;

        return f
    }

    //Removes all empty groups
    private runCleanup() {
        this.GroupsManager.runCleanup()
    }

    saveFile() {
        this.runCleanup()
        fs.writeFileSync(this.statsFileLocation, JSON.stringify(this.statsFile), "utf-8")
    }

    constructor(statsFileRootLocation: string, statsFileName: string) {
        this.statsFileLocation = path.join(statsFileRootLocation, statsFileName);
        this.statsFile = this.checkStatsFile(JSON.parse(fs.readFileSync(this.statsFileLocation, "utf-8") || "{}"))
        this.GroupsManager = new GroupsManager(this.statsFile.groups);
    }
}
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsFile = exports.GroupsManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class GroupsManager {
    groups;
    checkGroupsStructure(groups) {
        if (!groups)
            groups = { groupToFile: {}, fileToGroup: {} };
        if (!groups.groupToFile)
            groups.groupToFile = {};
        if (!groups.fileToGroup)
            groups.fileToGroup = {};
        return groups;
    }
    addFilesToGroup(group_name, files) {
        let groupFiles = this.groups.groupToFile[group_name];
        if (!groupFiles) {
            this.groups.groupToFile[group_name] = [];
            groupFiles = this.groups.groupToFile[group_name];
        }
        for (const file of files)
            if (!groupFiles.includes(file))
                groupFiles.push(file);
    }
    addGroupsToFile(file_name, groups) {
        let existingGroups = this.groups.fileToGroup[file_name];
        if (!existingGroups) {
            this.groups.fileToGroup[file_name] = [];
            existingGroups = this.groups.fileToGroup[file_name];
        }
        for (const group of groups)
            if (!existingGroups.includes(group))
                existingGroups.push(group);
    }
    removeFilesFromGroup(group_name, files) {
        const existingFiles = this.groups.groupToFile[group_name];
        if (!existingFiles)
            return;
        for (const file of files) {
            const i = existingFiles.indexOf(file);
            if (i === -1)
                continue;
            existingFiles.splice(i, 1);
        }
    }
    removeGroupsFromFile(file_name, groups) {
        const existingGroups = this.groups.fileToGroup[file_name];
        if (!existingGroups)
            return;
        for (const group of groups) {
            const i = existingGroups.indexOf(group);
            if (i === -1)
                continue;
            existingGroups.splice(i, 1);
        }
    }
    getAll() {
        return this.groups;
    }
    getAllFilesInGroup(group_name) {
        let files = this.groups.groupToFile[group_name];
        return !files ? undefined : [...files];
    }
    groupExists(group_name) {
        return !!this.getAllFilesInGroup(group_name);
    }
    getAllGroupsOfAFile(file_name) {
        const groups = this.groups.fileToGroup[file_name];
        return !groups ? undefined : [...groups];
    }
    removeGroup(file_name, group_names) {
        this.removeGroupsFromFile(file_name, group_names);
        for (const group of group_names)
            this.removeFilesFromGroup(group, [file_name]);
    }
    addGroup(file_name, groups) {
        this.addGroupsToFile(file_name, groups);
        for (const group of groups)
            this.addFilesToGroup(group, [file_name]);
    }
    runCleanup() {
        for (const key of Object.keys(this.groups.groupToFile)) {
            const val = this.groups.groupToFile[key];
            if (val && Array.isArray(val) && val.length)
                continue;
            delete this.groups.groupToFile[key];
        }
        for (const key of Object.keys(this.groups.fileToGroup)) {
            const val = this.groups.fileToGroup[key];
            if (val && Array.isArray(val) && val.length)
                continue;
            delete this.groups.fileToGroup[key];
        }
    }
    constructor(groupJson) {
        this.groups = this.checkGroupsStructure(groupJson);
    }
}
exports.GroupsManager = GroupsManager;
class StatsFile {
    statsFile;
    statsFileLocation;
    GroupsManager;
    checkStatsFile(f) {
        const defaultStruct = { groups: { groupToFile: {}, fileToGroup: {} } };
        if (!f)
            f = defaultStruct;
        if (!f.groups)
            f.groups = defaultStruct.groups;
        return f;
    }
    //Removes all empty groups
    runCleanup() {
        this.GroupsManager.runCleanup();
    }
    saveFile() {
        this.runCleanup();
        fs.writeFileSync(this.statsFileLocation, JSON.stringify(this.statsFile), "utf-8");
    }
    constructor(statsFileRootLocation, statsFileName) {
        this.statsFileLocation = path.join(statsFileRootLocation, statsFileName);
        this.statsFile = this.checkStatsFile(JSON.parse(fs.readFileSync(this.statsFileLocation, "utf-8") || "{}"));
        this.GroupsManager = new GroupsManager(this.statsFile.groups);
    }
}
exports.StatsFile = StatsFile;

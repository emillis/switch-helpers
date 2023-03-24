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
exports.StatsFile = exports.FilesManager = exports.FileManager = exports.MetadataManager = exports.GroupsManager = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class GroupsManager {
    groups;
    checkGroupsStructure(groups) {
        if (!groups)
            groups = { ids: [], files: {} };
        if (!groups.ids)
            groups.ids = [];
        if (!groups.files)
            groups.files = {};
        return groups;
    }
    getAll() {
        return this.groups;
    }
    getGroup(group_name) {
        return this.groups.files[`${group_name}`];
    }
    removeGroup(group_name) {
        group_name = `${group_name}`;
        const i = this.groups.ids.indexOf(group_name);
        if (i >= 0)
            this.groups.ids.splice(i, 1);
        delete this.groups.files[group_name];
    }
    createGroupIfDoesntExist(group_name) {
        if (!this.groups.ids.includes(group_name))
            this.groups.ids.push(group_name);
        if (!this.groups.files[group_name] || !Array.isArray(this.groups.files[group_name]))
            this.groups.files[group_name] = [];
    }
    addToGroup(group_name, fileName) {
        group_name = `${group_name}`;
        fileName = `${fileName}`;
        this.createGroupIfDoesntExist(group_name);
        if (!this.groups.files[group_name].includes(fileName))
            this.groups.files[group_name].push(fileName);
    }
    removeFromGroup(group_name, fileName) {
        group_name = `${group_name}`;
        const grp = this.groups.files[group_name];
        if (!grp || !Array.isArray(grp))
            return;
        let i = grp.indexOf(fileName);
        if (i >= 0)
            grp.splice(i, 1);
        if (!grp.length) {
            let i = this.groups.ids.indexOf(group_name);
            if (i >= 0)
                this.groups.ids.splice(i, 1);
            delete this.groups.files[group_name];
        }
    }
    constructor(groupJson) {
        this.groups = this.checkGroupsStructure(groupJson);
    }
}
exports.GroupsManager = GroupsManager;
class MetadataManager {
    metadata;
    checkMetadataStructure(metadata) {
        if (!metadata)
            metadata = {};
        return metadata;
    }
    getAll() {
        return this.metadata;
    }
    add(key, value, fileName) {
        (this.metadata[key] = this.metadata[key] || {})[fileName] = value;
    }
    remove(key, fileName) {
        delete this.metadata[key]?.[fileName];
        if (!Object.values(this.metadata[key]).length)
            delete this.metadata[key];
    }
    getValue(key, fileName) {
        return (this.metadata[key] || {})[fileName];
    }
    getFileNamesWithMetadata(key) {
        const o = this.metadata[key];
        if (!o || typeof o !== "object")
            return undefined;
        return Object.keys(o);
    }
    getFileNamesWhereValueMatches(key, value) {
        key = `${key}`;
        value = `${value}`;
        const fileNames = this.getFileNamesWithMetadata(key);
        if (!fileNames)
            return undefined;
        let results = [];
        for (const fileName of fileNames) {
            if (this.getValue(key, fileName) === undefined)
                continue;
            results.push(fileName);
        }
        return results;
    }
    constructor(metadataJson) {
        this.metadata = this.checkMetadataStructure(metadataJson);
    }
}
exports.MetadataManager = MetadataManager;
class FileManager {
    file;
    checkFileStructure(file) {
        if (!file)
            throw `Cannot initiate file as it's not provided to the "FileManager"!`;
        if (!file.name)
            throw `Cannot initiate new "FileManager" with file name "${file.name}"!`;
        if (!file.groups || !Array.isArray(file.groups))
            file.groups = [];
        if (!file.metadata || typeof file.metadata !== "object")
            file.metadata = {};
        return file;
    }
    getName() {
        return this.file.name;
    }
    setName(name) {
        this.file.name = `${name}`;
    }
    getGroups() {
        return this.file.groups;
    }
    inGroup(group_name) {
        return this.file.groups.includes(`${group_name}`);
    }
    addToGroup(group_name) {
        if (!group_name)
            return;
        if (this.inGroup(group_name))
            return;
        this.file.groups.push(`${group_name}`);
    }
    removeFromGroup(group_name) {
        const i = this.file.groups.indexOf(`${group_name}`);
        if (i < 0)
            return;
        this.file.groups.splice(i, 1);
    }
    getAllMetadata() {
        return this.file.metadata;
    }
    getMetadata(key) {
        return this.file.metadata[`${key}`];
    }
    setMetadata(key, values) {
        if (!key)
            return;
        this.file.metadata[`${key}`] = `${values}`;
    }
    setMetadataFromObject(metadata) {
        for (const key of Object.keys(metadata || {})) {
            this.setMetadata(key, metadata[key]);
        }
    }
    removeMetadata(key) {
        delete this.file.metadata[`${key}`];
    }
    getLocation() {
        return this.file.location;
    }
    constructor(fileJson) {
        this.file = this.checkFileStructure(fileJson);
    }
}
exports.FileManager = FileManager;
class FilesManager {
    files = [];
    fileManagers = [];
    storageRootLocation;
    //Returns all files present
    getAllFiles() {
        return this.fileManagers;
    }
    //Returns a single FileManger or undefined if the file doesn't exist
    getFile(name) {
        for (const f of this.fileManagers) {
            if (f.getName() !== name)
                continue;
            return f;
        }
        return undefined;
    }
    //Removes a file based on the name provided, if file doesn't exist - does nothing.
    removeFile(name) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].name !== name)
                continue;
            this.files.splice(i, 1);
            break;
        }
        for (let i = 0; i < this.fileManagers.length; i++) {
            if (this.fileManagers[i].getName() !== name)
                continue;
            this.fileManagers.splice(i, 1);
        }
    }
    //Registers a single file to the stats file. If file is already present - does nothing.
    addFile(name, metadata = {}, belongsToGroups = []) {
        const f = this.getFile(name);
        if (f) {
            f.setName(name);
            for (const key of Object.keys(metadata || {})) {
                f.setMetadata(key, metadata[key]);
            }
            for (const g of belongsToGroups || []) {
                f.addToGroup(`${g}`);
            }
            return;
        }
        const fileStruct = { name: name, location: this.storageRootLocation, groups: belongsToGroups, metadata: metadata };
        const fm = new FileManager(fileStruct);
        this.files.push(fileStruct);
        this.fileManagers.push(fm);
    }
    //Returns a list of files whose name matches the value provided.
    matchFiles(val) {
        let results = [];
        for (const fm of this.fileManagers) {
            if (fm.getName().indexOf(val) === -1)
                continue;
            results.push(fm.getName());
        }
        return results;
    }
    constructor(filesJson, storageLocation) {
        this.storageRootLocation = storageLocation;
        this.files = filesJson;
        for (const f of this.files) {
            this.fileManagers.push(new FileManager(f));
        }
    }
}
exports.FilesManager = FilesManager;
class StatsFile {
    statsFile;
    statsFileLocation;
    FilesManager;
    MetadataManager;
    GroupsManager;
    checkStatsFile(f) {
        const defaultStruct = { files: [], groups: { ids: [], files: {} }, metadata: {} };
        if (!f)
            f = defaultStruct;
        if (!f.files)
            f.files = defaultStruct.files;
        if (!f.groups)
            f.groups = defaultStruct.groups;
        if (!f.metadata)
            f.metadata = defaultStruct.metadata;
        return f;
    }
    addToMetadata(fileName, metadata) {
        for (const key of Object.keys(metadata || {}).filter(v => v !== undefined && v !== "")) {
            this.MetadataManager.add(key, metadata[key], fileName);
        }
    }
    addToGroups(fileName, groups) {
        for (const g of (groups || []).filter(v => v !== undefined && v !== "")) {
            this.GroupsManager.addToGroup(`${g}`, fileName);
        }
    }
    getAllFiles() {
        return this.FilesManager.getAllFiles();
    }
    getFile(name) {
        name = `${name}`.toLowerCase();
        return this.FilesManager.getFile(name);
    }
    getGroup(group_name) {
        let results = [];
        const group = this.GroupsManager.getGroup(group_name);
        if (!group)
            return undefined;
        for (const fileName of group) {
            const f = this.getFile(fileName);
            if (!f) {
                this.GroupsManager.removeFromGroup(group_name, fileName);
                continue;
            }
            results.push(f);
        }
        return results;
    }
    getMetadata(fileName, metadata_key) {
        const fm = this.getFile(fileName);
        if (!fm)
            return undefined;
        return fm.getMetadata(metadata_key);
    }
    getFilesThatHaveMetadataKey(key, value) {
        const fileNames = this.MetadataManager.getFileNamesWithMetadata(key);
        if (!fileNames)
            return undefined;
        let results = [];
        for (const name of fileNames) {
            const file = this.getFile(name);
            if (!file) {
                this.MetadataManager.remove(key, name);
                continue;
            }
            if (value) {
                const v = file.getMetadata(key);
                if (v === undefined || value !== v)
                    continue;
            }
            results.push(file);
        }
        return results;
    }
    addFile(name, metadata = {}, belongsToGroups = []) {
        name = `${name}`.toLowerCase();
        this.FilesManager.addFile(name, metadata, belongsToGroups);
        this.addToMetadata(name, metadata);
        this.addToGroups(name, belongsToGroups);
    }
    addMetadata(fileName, metadata) {
        fileName = `${fileName}`.toLowerCase();
        const fm = this.getFile(fileName);
        if (!fm)
            return;
        for (const key of Object.keys(metadata || {})) {
            const value = `${metadata[key]}`;
            fm.setMetadata(key, value);
            this.MetadataManager.add(key, value, fileName);
        }
    }
    addToGroup(fileName, groups) {
        fileName = `${fileName}`.toLowerCase();
        const fm = this.getFile(fileName);
        if (!fm)
            return;
        for (const group of groups || []) {
            fm.addToGroup(group);
            this.GroupsManager.addToGroup(group, fileName);
        }
    }
    removeFile(name) {
        name = `${name}`.toLowerCase();
        const file = this.FilesManager.getFile(name);
        if (!file)
            return;
        for (const groupName of file.getGroups())
            this.GroupsManager.removeFromGroup(groupName, name);
        for (const metadataKey of Object.keys(file.getAllMetadata() || {}))
            this.MetadataManager.remove(metadataKey, name);
        this.FilesManager.removeFile(name);
    }
    removeMetadata(fileName, key) {
        this.MetadataManager.remove(key, fileName);
        const fm = this.getFile(fileName);
        if (!fm)
            return;
        fm.removeMetadata(key);
    }
    removeGroup(fileName, group_name) {
        this.GroupsManager.removeFromGroup(group_name, fileName);
        const fm = this.getFile(fileName);
        if (!fm)
            return;
        fm.removeFromGroup(group_name);
    }
    matchFiles(val) {
        let results = [];
        for (const name of this.FilesManager.matchFiles(`${val}`.toLowerCase())) {
            const f = this.getFile(name);
            if (!f)
                continue;
            results.push(f);
        }
        return results;
    }
    saveFile() {
        fs.writeFileSync(this.statsFileLocation, JSON.stringify(this.statsFile), "utf-8");
    }
    constructor(statsFileRootLocation, statsFileName) {
        this.statsFileLocation = path.join(statsFileRootLocation, statsFileName);
        this.statsFile = this.checkStatsFile(JSON.parse(fs.readFileSync(this.statsFileLocation, "utf-8") || "{}"));
        this.FilesManager = new FilesManager(this.statsFile.files, statsFileRootLocation);
        this.MetadataManager = new MetadataManager(this.statsFile.metadata);
        this.GroupsManager = new GroupsManager(this.statsFile.groups);
    }
}
exports.StatsFile = StatsFile;

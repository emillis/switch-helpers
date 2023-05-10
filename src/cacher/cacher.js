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
exports.CacheManager = exports.Cache = exports.removeFileStatus = exports.addFileStatus = exports.allowedActions = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const statsFile = __importStar(require("./src/stats-file/stats-file"));
exports.allowedActions = { createUpdate: "createUpdate", recall: "recall", remove: "remove" };
exports.addFileStatus = { Ok: "Ok", FileAlreadyExists: "FileAlreadyExists", Unknown: "Unknown", InputFileNotExist: "InputFileNotExist" };
exports.removeFileStatus = { Ok: "Ok", FileDoesntExist: "FileDoesntExist", Unknown: "Unknown" };
function makeFiltersReasonable(filters) {
    const f = filters || {};
    if (f.names === undefined)
        f.names = [];
    if (f.inGroups === undefined)
        f.inGroups = [];
    if (f.hasMetadata === undefined)
        f.hasMetadata = {};
    if (f.metadataLogic === undefined)
        f.metadataLogic = "and";
    f.metadataLogic = `${f.metadataLogic}`.toLowerCase();
    if (f.metadataLogic !== "or" && f.metadataLogic !== "and")
        throw `Invalid metadata logic "${f.metadataLogic}" provided! Allowed values are: "or", "and"`;
    if (f.groupsLogic === undefined)
        f.groupsLogic = "and";
    f.groupsLogic = `${f.groupsLogic}`.toLowerCase();
    if (f.groupsLogic !== "or" && f.groupsLogic !== "and")
        throw `Invalid groups logic "${f.groupsLogic}" provided! Allowed values are: "or", "and"`;
    return f;
}
function makeCacheAddFileOptionsReasonable(options) {
    options = options || {};
    options.overwrite = !!options.overwrite;
    return options;
}
class Cache {
    rootLocation;
    cacheName;
    cacheLocation;
    statsFileLocation;
    statsFile;
    statsFileExist() {
        return fs.existsSync(this.statsFileLocation);
    }
    createStatsFile() {
        fs.createFileSync(this.statsFileLocation);
    }
    parseFileManagers(managers) {
        const files = managers;
        if (!files)
            return undefined;
        let results = { count: 0, names: [], moreInfo: {} };
        for (const file of files) {
            results.count++;
            const name = file.getName();
            const loc = file.getLocation();
            results.names.push(name);
            results.moreInfo[name] = { dir: loc, pathToFile: path.join(loc, name) };
        }
        return results;
    }
    removeFileNoSaving(name) {
        try {
            if (!this.statsFile.getFile(name))
                return exports.removeFileStatus.FileDoesntExist;
            this.statsFile.removeFile(name);
            fs.unlinkSync(path.join(this.cacheLocation, name));
        }
        catch (e) {
            return exports.removeFileStatus.Unknown;
        }
        return exports.removeFileStatus.Ok;
    }
    addFile(location, metadata, belongsToGroups = [], options) {
        options = makeCacheAddFileOptionsReasonable(options);
        let fileName = "";
        try {
            if (!location || !fs.existsSync(location)) {
                return exports.addFileStatus.InputFileNotExist;
            }
            fileName = options.newName || path.parse(location).base;
            if (this.statsFile.getFile(fileName) && !options.overwrite) {
                return exports.addFileStatus.FileAlreadyExists;
            }
            fs.copyFileSync(location, path.join(this.cacheLocation, fileName));
        }
        catch (e) {
            return exports.addFileStatus.Unknown;
        }
        this.statsFile.addFile(fileName, metadata, belongsToGroups);
        this.statsFile.saveFile();
        return exports.addFileStatus.Ok;
    }
    addMetadataToFile(fileName, metadata) {
        this.statsFile.addMetadata(fileName, metadata);
        this.statsFile.saveFile();
    }
    addFileToGroup(fileName, groups) {
        this.statsFile.addToGroup(fileName, groups);
        this.statsFile.saveFile();
    }
    removeFile(name) {
        const status = this.removeFileNoSaving(name);
        this.statsFile.saveFile();
        return status;
    }
    removeFiles(...names) {
        let results = {};
        for (const name of names || [])
            results[name] = this.removeFileNoSaving(name);
        this.statsFile.saveFile();
        return results;
    }
    removeMetadata(fileName, key) {
        try {
            this.statsFile.removeMetadata(fileName, key);
            this.statsFile.saveFile();
        }
        catch { }
    }
    removeGroup(fileName, group_name) {
        try {
            this.statsFile.removeGroup(fileName, group_name);
            this.statsFile.saveFile();
        }
        catch { }
    }
    getFiles(name) {
        let results = { count: 0, names: [], moreInfo: {} };
        for (const fm of this.statsFile.matchFiles(name)) {
            results.count++;
            const name = fm.getName();
            const loc = fm.getLocation();
            results.names.push(name);
            results.moreInfo[name] = { dir: loc, pathToFile: path.join(loc, name) };
        }
        return results;
    }
    getFilesWithFilter(filters) {
        let results = { count: 0, names: [], moreInfo: {} };
        filters = makeFiltersReasonable(filters);
        filters.names?.map(v => `${v}`.toLowerCase());
        for (const f of this.statsFile.getAllFiles()) {
            //Checking if names match
            if (filters.names?.length) {
                let matches = false;
                for (const name of filters.names) {
                    if (f.getName().indexOf(name) === -1)
                        continue;
                    matches = true;
                    break;
                }
                if (!matches)
                    continue;
            }
            //Checking if file is in group
            if (filters.inGroups?.length) {
                let matches = true;
                for (const groupName of filters.inGroups) {
                    const inGroup = f.inGroup(groupName);
                    if (filters.groupsLogic === "or") {
                        if (!inGroup) {
                            matches = false;
                            continue;
                        }
                        matches = true;
                        break;
                    }
                    else {
                        if (inGroup)
                            continue;
                    }
                    matches = false;
                    break;
                }
                if (!matches)
                    continue;
            }
            //Checking if file has metadata
            const mKeys = Object.keys(filters.hasMetadata || {});
            if (filters.hasMetadata && mKeys.length) {
                let matches = true;
                for (const key of mKeys) {
                    const savedMetadataValue = f.getMetadata(key);
                    if (filters.metadataLogic === "or") {
                        if (savedMetadataValue !== undefined && savedMetadataValue === filters.hasMetadata[key]) {
                            matches = true;
                            break;
                        }
                        continue;
                    }
                    else {
                        if (savedMetadataValue !== undefined && savedMetadataValue === filters.hasMetadata[key])
                            continue;
                    }
                    matches = false;
                    break;
                }
                if (!matches)
                    continue;
            }
            results.count++;
            results.names.push(f.getName());
            results.moreInfo[f.getName()] = { dir: f.getLocation(), pathToFile: path.join(f.getLocation(), f.getName()) };
        }
        return results;
    }
    getFilesInGroup(group_name) {
        const files = this.statsFile.getGroup(group_name);
        if (!files)
            return undefined;
        let results = { count: 0, names: [], moreInfo: {} };
        for (const fm of files) {
            results.count++;
            const name = fm.getName();
            const loc = fm.getLocation();
            results.names.push(name);
            results.moreInfo[name] = { dir: loc, pathToFile: path.join(loc, name) };
        }
        return results;
    }
    getMetadata(fileName, metadata_key) {
        return this.statsFile.getMetadata(fileName, metadata_key);
    }
    getFilesWithMetadataKey(key) {
        return this.parseFileManagers(this.statsFile.getFilesThatHaveMetadataKey(key));
    }
    getFilesWhereMetadataValueMatches(key, value) {
        return this.parseFileManagers(this.statsFile.getFilesThatHaveMetadataKey(key, value));
    }
    constructor(rootLocation, name) {
        const cacheLocation = path.join(`${rootLocation}`, `${name}`);
        if (!fs.existsSync(cacheLocation)) {
            throw `Cache named "${name}" does not exist!`;
        }
        this.rootLocation = rootLocation;
        this.cacheName = name;
        this.cacheLocation = cacheLocation;
        this.statsFileLocation = path.join(this.cacheLocation, `${this.cacheName}.json`);
        if (!this.statsFileExist()) {
            this.createStatsFile();
        }
        this.statsFile = new statsFile.StatsFile(this.cacheLocation, `${this.cacheName}.json`);
    }
}
exports.Cache = Cache;
//======[CACHES MANAGER]================================================================================================
class CacheManager {
    rootLocation;
    cacheExists(name) {
        return fs.pathExistsSync(path.join(this.rootLocation, name));
    }
    initiateNewCache(name, overwrite = false) {
        name = (name || "").replace(/([^A-Za-z0-9_-]+)/gi, "");
        const loc = path.join(this.rootLocation, name);
        if (this.cacheExists(name) && !overwrite) {
            throw `Cache "${name}" already exist! Overwriting is not allowed!`;
        }
        fs.mkdirsSync(loc);
        fs.createFileSync(path.join(loc, `${name}.json`));
        return new Cache(this.rootLocation, name);
    }
    getCache(name) {
        if (!this.cacheExists(name)) {
            throw `Cache "${name}" does not exist!`;
        }
        return new Cache(this.rootLocation, name);
    }
    getOrInitiateCache(name) {
        if (!this.cacheExists(name)) {
            this.initiateNewCache(name);
        }
        return this.getCache(name);
    }
    constructor(rootLocation) {
        if (!rootLocation) {
            throw `Invalid root location supplied, expected a system location ,got "${rootLocation}"`;
        }
        this.rootLocation = `${rootLocation}`;
        if (!fs.pathExistsSync(this.rootLocation)) {
            throw `Cache root location "${this.rootLocation}" does not exist!`;
        }
    }
}
exports.CacheManager = CacheManager;
//======[TESTING]================================================================================================
// const Manager = new CacheManager("D:\\Test\\Cache Root Location");
// const cache = Manager.getOrInitiateCache("meow3");
// for (let i =1; i <= 6; i++) {
//     console.log(cache.addFile(
//         `C:\\Users\\service_switch\\Desktop\\Sample Artworks\\working-sample (${i}).pdf`,
//         {"index": `index-${i}`, "test": "hello"},
//         ["group-x", `group-${i}`],
//         {overwrite: true}
//     ));
// }
// cache.addMetadataToFile(`hellox.pdf`, {"bla1": "alb1"})
// cache.addFileToGroup("binder1.pdf", ["qwe", "rty"])
// console.log(cache.addFile("C:\\Users\\service_switch\\Desktop\\Binder1.pdf"));
// console.log(cache.removeFile(".pdf"));
// console.log(cache.getFiles(".pdf"));
// console.log(cache.getFilesInGroup("rty"));
// console.log(cache.getMetadata("hellox.pdf", "holla"));
// console.log(cache.getFilesWhereMetadataValueMatches("bla1", "alb1"));
// cache.removeMetadata("hellox.pdf", "holla2");
// console.log(cache.getFilesWithFilter(".pdf", {inGroups: [], hasMetadata: {}}));
// console.log(cache.getFilesWithFilter({names: [], inGroups: ["group-3", "group-5"], hasMetadata: {}, groupsLogic: "or"}));
// console.log(cache.removeFiles(...cache.getFilesWithFilter(".pdf", {inGroups: [], hasMetadata: {}}).names));

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
    if (f.inGroups === undefined)
        f.inGroups = [];
    if (f.hasMetadata === undefined)
        f.hasMetadata = {};
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
            const file = this.statsFile.getFile(name);
            if (!file)
                return exports.removeFileStatus.FileDoesntExist;
            const fullPath = path.join(this.cacheLocation, name);
            for (const groupName of file.getGroups()) {
                this.statsFile.removeGroup(name, groupName);
            }
            for (const key of Object.keys(file.getAllMetadata() || {})) {
                this.statsFile.removeMetadata(name, key);
            }
            this.statsFile.removeFile(name);
            fs.unlinkSync(fullPath);
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
            fileName = path.parse(location).base;
            if (this.statsFile.getFile(fileName) && !options.overwrite) {
                return exports.addFileStatus.FileAlreadyExists;
            }
            fs.copyFileSync(location, path.join(this.cacheLocation, fileName));
        }
        catch (e) {
            console.log(`${e}`);
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
        for (const name of names || []) {
            results[name] = this.removeFileNoSaving(name);
        }
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
    getFilesWithFilter(name, filters) {
        filters = makeFiltersReasonable(filters);
        let results = { count: 0, names: [], moreInfo: {} };
        for (const fm of this.statsFile.matchFiles(name)) {
            let inGroups = true;
            for (const g of (filters.inGroups || [])) {
                if (fm.inGroup(g))
                    continue;
                inGroups = false;
                break;
            }
            if (!inGroups)
                continue;
            let hasMetadata = true;
            for (const key of Object.keys(filters.hasMetadata || {})) {
                const val = (filters.hasMetadata || {})[key];
                const mVal = `${fm.getMetadata(key)}`;
                if (mVal === undefined) {
                    hasMetadata = false;
                    break;
                }
                if (mVal === val)
                    continue;
                hasMetadata = false;
                break;
            }
            if (!hasMetadata)
                continue;
            results.count++;
            const name = fm.getName();
            const loc = fm.getLocation();
            results.names.push(name);
            results.moreInfo[name] = { dir: loc, pathToFile: path.join(loc, name) };
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
// console.log(cache.addFile(
//     "C:\\Users\\service_switch\\Desktop\\hellox.pdf",
//     {"holla2": "asd1"},
//     ["aaa", "bbb"],
//     {overwrite: true}
// ));
// cache.addMetadataToFile(`hellox.pdf`, {"bla1": "alb1"})
// cache.addFileToGroup("binder1.pdf", ["qwe", "rty"])
// console.log(cache.addFile("C:\\Users\\service_switch\\Desktop\\Binder1.pdf"));
// console.log(cache.removeFile("hellox.pdf"));
// console.log(cache.getFiles(".pdf"));
// console.log(cache.getFilesInGroup("rty"));
// console.log(cache.getMetadata("hellox.pdf", "holla"));
// console.log(cache.getFilesWhereMetadataValueMatches("bla1", "alb1"));
// cache.removeMetadata("hellox.pdf", "holla2");
// console.log(cache.getFilesWithFilter(".pdf", {inGroups: ["123", "aaa"], hasMetadata: {"holla2": "asd1"}}));

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
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const statsFile = __importStar(require("./src/stats-file/stats-file"));
const allowedActions = { createUpdate: "createUpdate", recall: "recall", remove: "remove" };
const addFileStatus = { Ok: "Ok", FileAlreadyExists: "FileAlreadyExists", Unknown: "Unknown", InputFileNotExist: "InputFileNotExist" };
const removeFileStatus = { Ok: "Ok", FileDoesntExist: "FileDoesntExist", Unknown: "Unknown" };
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
    addFile(location, metadata, belongsToGroups = [], options) {
        options = makeCacheAddFileOptionsReasonable(options);
        let fileName = "";
        try {
            if (!location || !fs.existsSync(location)) {
                return addFileStatus.InputFileNotExist;
            }
            fileName = path.parse(location).base;
            if (this.statsFile.getFile(fileName) && !options.overwrite) {
                return addFileStatus.FileAlreadyExists;
            }
            fs.copyFileSync(location, path.join(this.cacheLocation, fileName));
        }
        catch (e) {
            console.log(`${e}`);
            return addFileStatus.Unknown;
        }
        this.statsFile.addFile(fileName, metadata, belongsToGroups);
        this.statsFile.saveFile();
        return addFileStatus.Ok;
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
        try {
            const fullPath = path.join(this.cacheLocation, name);
            if (!this.statsFile.getFile(name))
                return removeFileStatus.FileDoesntExist;
            fs.unlinkSync(fullPath);
        }
        catch (e) {
            return removeFileStatus.Unknown;
        }
        this.statsFile.removeFile(name);
        this.statsFile.saveFile();
        return removeFileStatus.Ok;
    }
    removeMetadata(fileName, key) {
        this.statsFile.removeMetadata(fileName, key);
        this.statsFile.saveFile();
    }
    removeGroup(fileName, group_name) {
        this.statsFile.removeGroup(fileName, group_name);
        this.statsFile.saveFile();
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
//======[TESTING]================================================================================================
// const Manager = new CacheManager("D:\\Test\\Cache Root Location");
// const cache = Manager.getOrInitiateCache("meow3");
// console.log(cache.addFile(
//     "C:\\Users\\service_switch\\Desktop\\hellox.pdf",
//     {"holla2": "asd1"},
//     ["123", "321"],
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

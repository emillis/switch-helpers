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
    if (f.keywords === undefined)
        f.keywords = [];
    if (f.inGroups === undefined)
        f.inGroups = [];
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
function newFileList() {
    return { count: 0, names: [], moreInfo: {} };
}
class Cache {
    rootLocation;
    cacheName;
    cacheLocation;
    statsFileLocation;
    statsFile;
    //Finds files matching keywords withing the directory
    findFiles(keywords, partialMatch = true, caseSensitive = false) {
        const results = newFileList();
        if (!caseSensitive)
            keywords = keywords.map(keyword => keyword.toLowerCase());
        const files = fs.readdirSync(this.cacheLocation, { withFileTypes: true })
            .filter(item => !item.isDirectory());
        for (const file of files) {
            let add = false;
            const fileName = caseSensitive ? file.name : file.name.toLowerCase();
            for (const keyword of keywords) {
                if (partialMatch ? !fileName.includes(keyword) : fileName !== keyword)
                    continue;
                add = true;
                break;
            }
            if (!add)
                continue;
            results.count = results.count + 1;
            results.names.push(file.name);
            results.moreInfo[file.name] = { dir: this.cacheLocation, pathToFile: path.join(this.cacheLocation, file.name) };
        }
        return results;
    }
    statsFileExist() {
        return fs.existsSync(this.statsFileLocation);
    }
    createStatsFile() {
        fs.createFileSync(this.statsFileLocation);
    }
    addFile(location, belongsToGroups = [], options) {
        const name = options?.newName || path.parse(location).base;
        if (!fs.existsSync(location))
            return exports.addFileStatus.InputFileNotExist;
        if (fs.existsSync(path.join(this.cacheLocation, name)) && !options?.overwrite)
            return exports.addFileStatus.FileAlreadyExists;
        try {
            fs.copyFileSync(location, path.join(this.cacheLocation, name));
        }
        catch (e) {
            return exports.addFileStatus.Unknown;
        }
        this.statsFile.GroupsManager.addGroup(name, belongsToGroups);
        this.statsFile.saveFile();
        return exports.addFileStatus.Ok;
    }
    removeFiles(names, partialMatch = true, caseSensitive = false) {
        const foundFiles = this.findFiles(names, partialMatch, caseSensitive);
        for (const name of foundFiles.names) {
            const fInfo = foundFiles.moreInfo[name];
            if (!fInfo)
                continue;
            fs.unlinkSync(fInfo.pathToFile);
            this.statsFile.GroupsManager.removeGroup(name, this.statsFile.GroupsManager.getAllGroupsOfAFile(name) || []);
        }
        this.statsFile.saveFile();
    }
    getFiles(keywords, partialMatch = true, caseSensitive = false) {
        return this.findFiles(keywords, partialMatch, caseSensitive);
    }
    getFilesInGroups(group_names, logic) {
        const files = [];
        for (const group_name of group_names) {
            const fileNames = this.statsFile.GroupsManager.getAllFilesInGroup(group_name) || [];
            for (const fileName of fileNames)
                if (!files.includes(fileName))
                    files.push(fileName);
        }
        if (logic === "and") {
            for (const file of files) {
                const fileGroups = this.statsFile.GroupsManager.getAllGroupsOfAFile(file) || [];
                let keep = true;
                for (const group_name of group_names) {
                    if (fileGroups.includes(group_name))
                        continue;
                    keep = false;
                    break;
                }
                if (!keep) {
                    const i = files.indexOf(file);
                    if (i === -1)
                        continue;
                    files.splice(i, 1);
                }
            }
        }
        return files;
    }
    getFilesWithFilter(filters, partialMatch = true, caseSensitive = false) {
        const result = newFileList();
        filters = makeFiltersReasonable(filters);
        const filesMatchingKeywords = this.findFiles(filters.keywords || [], partialMatch, caseSensitive);
        const filesMatchingInGroups = this.getFilesInGroups(filters.inGroups || [], filters.groupsLogic || "and");
        for (const key of filesMatchingKeywords.names) {
            if (filters.inGroups && filters.inGroups.length && !filesMatchingInGroups.includes(key))
                continue;
            result.count++;
            result.names.push(key);
            result.moreInfo[key] = filesMatchingKeywords.moreInfo[key];
        }
        return result;
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
        if (!this.statsFileExist())
            this.createStatsFile();
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
//         ["group-1", "group-2"],
//         {overwrite: true}
//     ));
// }
// console.log(cache.addFile("C:\\Users\\service_switch\\Desktop\\Binder1.pdf"));
// console.log(cache.removeFiles(["1"]));
// console.log(cache.getFiles([".pdf"]));
// console.log(cache.getFilesInGroup("rty"));
// console.log(cache.getFilesInGroups(["group-1", "group-2"], "and"));
// console.log(cache.getFilesWithFilter({keywords: ["(4)"], inGroups: [], groupsLogic: "and"}));

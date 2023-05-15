import * as fs from "fs-extra";
import * as path from "path";
import * as statsFile from "./src/stats-file/stats-file";

export const allowedActions = {createUpdate: "createUpdate", recall: "recall", remove: "remove"} as const;
export type allowedActions = typeof allowedActions[keyof typeof allowedActions];

export const addFileStatus = {Ok: "Ok", FileAlreadyExists: "FileAlreadyExists", Unknown: "Unknown", InputFileNotExist: "InputFileNotExist"} as const;
export type addFileStatus = typeof addFileStatus[keyof typeof addFileStatus];

export const removeFileStatus = {Ok: "Ok", FileDoesntExist: "FileDoesntExist", Unknown: "Unknown"} as const;
export type removeFileStatus = typeof removeFileStatus[keyof typeof removeFileStatus];

//======[CACHE MANAGER]================================================================================================

export type cacheAddFileOptions = {
    overwrite?: boolean
    newName?: string
}

export type fileList = {
    count: number
    names: string[],
    moreInfo: {[p: string]: {pathToFile: string, dir: string}}
}

export type filters = {
    keywords?: string[]
    inGroups?: string[],
    groupsLogic?: "or" | "and"
}

function makeFiltersReasonable(filters?: filters): filters {
    const f: filters = filters || {}

    if (f.keywords === undefined) f.keywords = [];
    if (f.inGroups === undefined) f.inGroups = [];
    if (f.groupsLogic === undefined) f.groupsLogic = "and"
    f.groupsLogic = <"or" | "and">`${f.groupsLogic}`.toLowerCase()
    if (f.groupsLogic !== "or" && f.groupsLogic !== "and") throw `Invalid groups logic "${f.groupsLogic}" provided! Allowed values are: "or", "and"`;

    return f
}
function makeCacheAddFileOptionsReasonable(options?: cacheAddFileOptions): cacheAddFileOptions {
    options = options || {}

    options.overwrite = !!options.overwrite;

    return options
}

function newFileList(): fileList {
    return {count: 0, names: [], moreInfo: {}}
}

export class Cache {
    private readonly rootLocation: string;
    private readonly cacheName: string;
    private readonly cacheLocation: string;
    private readonly statsFileLocation: string;
    private readonly statsFile: statsFile.StatsFile;

    //Finds files matching keywords withing the directory
    private findFiles(keywords: string[], partialMatch: boolean = true, caseSensitive: boolean = false): fileList {
        const results: fileList = newFileList()
        if (!caseSensitive) keywords = keywords.map(kw=>kw.toLowerCase())

        const files = fs.readdirSync(this.cacheLocation, {withFileTypes: true})
            .filter(item=>!item.isDirectory())

        for (const file of files) {
            let add: boolean = true
            const fileName = caseSensitive ? file.name : file.name.toLowerCase();
            for (const keyword of keywords) {
                if (partialMatch ? fileName.includes(keyword) : fileName === keyword) continue;
                add = false;
                break
            }
            if (!add) continue;

            results.count = results.count + 1
            results.names.push(file.name)
            results.moreInfo[file.name] = {dir: this.cacheLocation, pathToFile: path.join(this.cacheLocation, file.name)}
        }

        return results
    }

    private statsFileExist(): boolean {
        return fs.existsSync(this.statsFileLocation)
    }
    private createStatsFile() {
        fs.createFileSync(this.statsFileLocation)
    }

    addFile(location: string, belongsToGroups: string[] = [], options?: cacheAddFileOptions): addFileStatus{
        const name: string = options?.newName || path.parse(location).base;

        if (!fs.existsSync(location)) return addFileStatus.InputFileNotExist
        if (fs.existsSync(path.join(this.cacheLocation, name)) && !options?.overwrite) return addFileStatus.FileAlreadyExists

        try {
            fs.copyFileSync(location, path.join(this.cacheLocation, name))
        } catch (e) {
            return addFileStatus.Unknown
        }

        this.statsFile.GroupsManager.addGroup(name, belongsToGroups);
        this.statsFile.saveFile();
        return addFileStatus.Ok
    }
    removeFiles(names: string[], partialMatch: boolean = true, caseSensitive: boolean = false) {
        const foundFiles = this.findFiles(names, partialMatch, caseSensitive);

        for (const name of foundFiles.names) {
            const fInfo = foundFiles.moreInfo[name];
            if (!fInfo) continue;

            fs.unlinkSync(fInfo.pathToFile);
            this.statsFile.GroupsManager.removeGroup(name, this.statsFile.GroupsManager.getAllGroupsOfAFile(name) || [])
        }

        this.statsFile.saveFile()
    }
    getFiles(keywords: string[], partialMatch: boolean = true, caseSensitive: boolean = false): fileList {
        return this.findFiles(keywords, partialMatch, caseSensitive)
    }
    getFilesInGroups(group_names: string[], logic: "or" | "and") {
        const files: string[] = [];

        for (const group_name of group_names) {
            const fileNames = this.statsFile.GroupsManager.getAllFilesInGroup(group_name) || [];
            for (const fileName of fileNames) if (!files.includes(fileName)) files.push(fileName)
        }

        if (logic === "and") {
            for (const file of files) {
                const fileGroups = this.statsFile.GroupsManager.getAllGroupsOfAFile(file) || []

                let keep: boolean = true;
                for (const group_name of group_names) {
                    if (fileGroups.includes(group_name)) continue;
                    keep = false;
                    break;
                }
                if (!keep) {
                    const i = files.indexOf(file);
                    if (i === -1) continue
                    files.splice(i, 1)
                }
            }
        }

        return files
    }
    getFilesWithFilter(filters: filters, partialMatch: boolean = true, caseSensitive: boolean = false): fileList {
        const result = newFileList()
        filters = makeFiltersReasonable(filters)

        const filesMatchingKeywords = this.findFiles(filters.keywords || [], partialMatch, caseSensitive)
        const filesMatchingInGroups = this.getFilesInGroups(filters.inGroups || [], filters.groupsLogic || "and")

        for (const key of filesMatchingKeywords.names) {
            if (!filesMatchingInGroups.includes(key)) continue;
            result.count++
            result.names.push(key)
            result.moreInfo[key] = filesMatchingKeywords.moreInfo[key]
        }

        return result
    }

    constructor(rootLocation: string, name: string) {
        const cacheLocation = path.join(`${rootLocation}`, `${name}`)
        if (!fs.existsSync(cacheLocation)) {throw `Cache named "${name}" does not exist!`}

        this.rootLocation = rootLocation;
        this.cacheName = name;
        this.cacheLocation = cacheLocation;
        this.statsFileLocation = path.join(this.cacheLocation, `${this.cacheName}.json`);

        if (!this.statsFileExist()) this.createStatsFile()
        this.statsFile = new statsFile.StatsFile(this.cacheLocation, `${this.cacheName}.json`);
    }
}

//======[CACHES MANAGER]================================================================================================

export class CacheManager {
    private readonly rootLocation: string;

    cacheExists(name: string): boolean {
        return fs.pathExistsSync(path.join(this.rootLocation, name))
    }

    initiateNewCache(name: string, overwrite: boolean = false): Cache {
        name = (name || "").replace(/([^A-Za-z0-9_-]+)/gi, "");
        const loc = path.join(this.rootLocation, name);

        if (this.cacheExists(name) && !overwrite) {throw `Cache "${name}" already exist! Overwriting is not allowed!`}

        fs.mkdirsSync(loc);
        fs.createFileSync(path.join(loc, `${name}.json`))

        return new Cache(this.rootLocation, name);
    }

    getCache(name: string): Cache {
        if(!this.cacheExists(name)) {throw `Cache "${name}" does not exist!`!}
        return new Cache(this.rootLocation, name)
    }

    getOrInitiateCache(name: string): Cache {
        if (!this.cacheExists(name)) {this.initiateNewCache(name)}
        return this.getCache(name);
    }

    constructor(rootLocation: string) {
        if (!rootLocation) {throw `Invalid root location supplied, expected a system location ,got "${rootLocation}"`}

        this.rootLocation = `${rootLocation}`;

        if (!fs.pathExistsSync(this.rootLocation)) {throw `Cache root location "${this.rootLocation}" does not exist!`}
    }
}

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
// console.log(cache.removeFiles(["(1)"]));
// console.log(cache.getFiles([".pdf"]));
// console.log(cache.getFilesInGroup("rty"));
// console.log(cache.getFilesInGroups(["group-1", "group-2"], "and"));
// console.log(cache.getFilesWithFilter({keywords: ["(4)", ".pdf"], inGroups: ["group-2"], groupsLogic: "and"}));



















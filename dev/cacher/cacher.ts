import * as fs from "fs-extra";
import * as path from "path";
import * as statsFile from "./src/stats-file/stats-file";

const allowedActions = {createUpdate: "createUpdate", recall: "recall", remove: "remove"} as const;
type allowedActions = typeof allowedActions[keyof typeof allowedActions];

const addFileStatus = {Ok: "Ok", FileAlreadyExists: "FileAlreadyExists", Unknown: "Unknown", InputFileNotExist: "InputFileNotExist"} as const;
type addFileStatus = typeof addFileStatus[keyof typeof addFileStatus];

const removeFileStatus = {Ok: "Ok", FileDoesntExist: "FileDoesntExist", Unknown: "Unknown"} as const;
type removeFileStatus = typeof removeFileStatus[keyof typeof removeFileStatus];

//======[CACHE MANAGER]================================================================================================

type cacheAddFileOptions = {
    overwrite?: boolean
}

type fileList = {
    count: number
    names: string[],
    moreInfo: {[p: string]: {pathToFile: string, dir: string}}
}

function makeCacheAddFileOptionsReasonable(options?: cacheAddFileOptions): cacheAddFileOptions {
    options = options || {}

    options.overwrite = !!options.overwrite;

    return options
}

class Cache {
    private readonly rootLocation: string;
    private readonly cacheName: string;
    private readonly cacheLocation: string;
    private readonly statsFileLocation: string;
    private readonly statsFile: statsFile.StatsFile;

    private statsFileExist(): boolean {
        return fs.existsSync(this.statsFileLocation)
    }
    private createStatsFile() {
        fs.createFileSync(this.statsFileLocation)
    }
    private parseFileManagers(managers: statsFile.FileManager[] | undefined): fileList | undefined {
        const files = managers;
        if (!files) return undefined;

        let results: fileList = {count: 0, names: [], moreInfo: {}}
        for (const file of files) {
            results.count++;

            const name = file.getName();
            const loc = file.getLocation();

            results.names.push(name);
            results.moreInfo[name] = {dir: loc, pathToFile: path.join(loc, name)}
        }
        return results
    }

    addFile(location: string, metadata?: {[p:string]: string}, belongsToGroups: string[] = [], options?: cacheAddFileOptions): addFileStatus{
        options = makeCacheAddFileOptionsReasonable(options);
        let fileName = "";

        try {
            if (!location || !fs.existsSync(location)) {return addFileStatus.InputFileNotExist}

            fileName = path.parse(location).base;

            if (this.statsFile.getFile(fileName) && !options.overwrite) {return addFileStatus.FileAlreadyExists}

            fs.copyFileSync(location, path.join(this.cacheLocation, fileName))
        } catch (e) {
            console.log(`${e}`);
            return addFileStatus.Unknown
        }

        this.statsFile.addFile(fileName, metadata, belongsToGroups);
        this.statsFile.saveFile();
        return addFileStatus.Ok
    }
    addMetadataToFile(fileName: string, metadata: {[p: string]: string}) {
        this.statsFile.addMetadata(fileName, metadata);
        this.statsFile.saveFile();
    }
    addFileToGroup(fileName: string, groups: string[]) {
        this.statsFile.addToGroup(fileName, groups);
        this.statsFile.saveFile();
    }

    removeFile(name: string): removeFileStatus {
        try {
            const fullPath = path.join(this.cacheLocation, name);

            if (!this.statsFile.getFile(name)) return removeFileStatus.FileDoesntExist

            fs.unlinkSync(fullPath)
        } catch (e) {
            return removeFileStatus.Unknown
        }

        this.statsFile.removeFile(name);
        this.statsFile.saveFile();
        return removeFileStatus.Ok
    }
    removeMetadata(fileName: string, key: string) {
        this.statsFile.removeMetadata(fileName, key);
        this.statsFile.saveFile();
    }
    removeGroup(fileName: string, group_name: string) {
        this.statsFile.removeGroup(fileName, group_name);
        this.statsFile.saveFile();
    }

    getFiles(name: string): fileList {
        let results: fileList = {count: 0, names: [], moreInfo: {}}

        for (const fm of this.statsFile.matchFiles(name)) {
            results.count++;

            const name = fm.getName();
            const loc = fm.getLocation();

            results.names.push(name);
            results.moreInfo[name] = {dir: loc, pathToFile: path.join(loc, name)}
        }

        return results
    }
    getFilesInGroup(group_name: string): fileList | undefined {
        const files = this.statsFile.getGroup(group_name);
        if (!files) return undefined
        let results: fileList = {count: 0, names: [], moreInfo: {}};

        for (const fm of files) {
            results.count++;

            const name = fm.getName();
            const loc = fm.getLocation();

            results.names.push(name)
            results.moreInfo[name] = {dir: loc, pathToFile: path.join(loc, name)}
        }

        return results
    }
    getMetadata(fileName: string, metadata_key: string): string | undefined {
        return this.statsFile.getMetadata(fileName, metadata_key);
    }
    getFilesWithMetadataKey(key: string): fileList | undefined {
        return this.parseFileManagers(this.statsFile.getFilesThatHaveMetadataKey(key));
    }
    getFilesWhereMetadataValueMatches(key: string, value: string) {
        return this.parseFileManagers(this.statsFile.getFilesThatHaveMetadataKey(key, value));
    }

    constructor(rootLocation: string, name: string) {
        const cacheLocation = path.join(`${rootLocation}`, `${name}`)
        if (!fs.existsSync(cacheLocation)) {throw `Cache named "${name}" does not exist!`}

        this.rootLocation = rootLocation;
        this.cacheName = name;
        this.cacheLocation = cacheLocation;
        this.statsFileLocation = path.join(this.cacheLocation, `${this.cacheName}.json`);

        if (!this.statsFileExist()) {this.createStatsFile()}
        this.statsFile = new statsFile.StatsFile(this.cacheLocation, `${this.cacheName}.json`);
    }
}

//======[CACHES MANAGER]================================================================================================

class CacheManager {
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



















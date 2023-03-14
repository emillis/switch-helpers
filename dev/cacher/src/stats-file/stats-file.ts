import * as fs from "fs-extra";
import * as path from "path";

//======[GROUPS]================================================================================================

export type groups = {
    ids: string[]
    files: {
        [p:string]: string[]
    }
}

export class GroupsManager {
    private readonly groups: groups;
    private checkGroupsStructure(groups?: groups): groups {
        if (!groups) groups = {ids: [], files: {}};
        if (!groups.ids) groups.ids = [];
        if (!groups.files) groups.files = {};
        return groups
    }

    getAll(): groups {
        return this.groups
    }

    getGroup(group_name: string): string[] | undefined {
        return this.groups.files[`${group_name}`]
    }
    removeGroup(group_name: string) {
        group_name = `${group_name}`

        const i = this.groups.ids.indexOf(group_name);
        if (i >= 0) this.groups.ids.splice(i, 1);
        delete this.groups.files[group_name];
    }
    createGroupIfDoesntExist(group_name: string) {
        if (!this.groups.ids.includes(group_name)) this.groups.ids.push(group_name);

        if (!this.groups.files[group_name] || !Array.isArray(this.groups.files[group_name])) this.groups.files[group_name] = [];
    }
    addToGroup(group_name: string, fileName: string) {
        group_name = `${group_name}`;
        fileName = `${fileName}`;

        this.createGroupIfDoesntExist(group_name);
        if (!this.groups.files[group_name].includes(fileName)) this.groups.files[group_name].push(fileName);
    }
    removeFromGroup(group_name: string, fileName: string) {
        group_name = `${group_name}`;

        let i = this.groups.ids.indexOf(group_name);
        if (i < 0) return

        this.groups.ids.splice(i, 1);

        const grp = this.groups.files[group_name];
        if (!grp || !Array.isArray(grp)) return

        i = grp.indexOf(fileName)

        if (i < 0) return;

        grp.splice(i, 1)
    }

    constructor(groupJson: any) {
        this.groups = this.checkGroupsStructure(groupJson);
    }
}

//======[METADATA]================================================================================================

//Metadata has the following structure:
//{"metadata_key": {"file_name": "metadata_value"}}
export type metadata = {
    [p:string]: {[p:string]: string}
}

export class MetadataManager {
    private readonly metadata: metadata;
    private checkMetadataStructure(metadata?: metadata): metadata{
        if (!metadata) metadata = {}

        return metadata
    }

    getAll(): metadata {
        return this.metadata;
    }

    add(key: string, value: string, fileName: string) {
        (this.metadata[key] = this.metadata[key] || {})[fileName] = value;
    }
    remove(key: string, fileName: string) {
        delete (this.metadata[key] || {})[fileName]
    }
    getValue(key: string, fileName: string): string | undefined {
        return (this.metadata[key] || {})[fileName]
    }
    getFileNamesWithMetadata(key: string): string[] | undefined {
        const o = this.metadata[key];

        if (!o || typeof o !== "object") return undefined

        return Object.keys(o);
    }
    getFileNamesWhereValueMatches(key: string, value: string): string[] | undefined {
        key = `${key}`
        value = `${value}`

        const fileNames = this.getFileNamesWithMetadata(key);
        if (!fileNames) return undefined

        let results: string[] = [];

        for (const fileName of fileNames) {
            if (this.getValue(key, fileName) === undefined) continue;

            results.push(fileName)
        }

        return results
    }

    constructor(metadataJson: any) {
        this.metadata = this.checkMetadataStructure(metadataJson);
    }
}

//======[FILE]================================================================================================

//Base file setup
export type file = {
    name: string
    location: string,
    groups: string[]
    metadata: {[p:string]: string}
}

export class FileManager {
    private readonly file: file;

    private checkFileStructure(file?: file): file {
        if (!file) throw `Cannot initiate file as it's not provided to the "FileManager"!`
        if (!file.name) throw `Cannot initiate new "FileManager" with file name "${file.name}"!`

        if (!file.groups || !Array.isArray(file.groups)) file.groups = [];

        if (!file.metadata || typeof file.metadata !== "object") file.metadata = {};

        return file
    }

    getName(): string {
        return this.file.name
    }
    setName(name: string) {
        this.file.name = `${name}`;
    }

    getGroups(): string[] {
        return this.file.groups
    }
    inGroup(group_name: string): boolean {
        return this.file.groups.includes(`${group_name}`)
    }
    addToGroup(group_name: string) {
        if (this.inGroup(group_name)) return;
        this.file.groups.push(`${group_name}`)
    }
    removeFromGroup(group_name: string) {
        const i = this.file.groups.indexOf(`${group_name}`)

        if (i < 0) return

        this.file.groups.splice(i, 1);
    }

    getAllMetadata(): {[p:string]: string} {
        return this.file.metadata
    }
    getMetadata(key: string): string | undefined {
        return this.file.metadata[`${key}`]
    }
    setMetadata(key: string, values: string) {
        this.file.metadata[`${key}`] = `${values}`
    }
    setMetadataFromObject(metadata: {[p: string]: string}) {
        for (const key of Object.keys(metadata || {})) {this.setMetadata(key, metadata[key]);}
    }
    removeMetadata(key: string) {
        delete this.file.metadata[`${key}`]
    }

    getLocation(): string {
        return this.file.location
    }

    constructor(fileJson: file) {
        this.file = this.checkFileStructure(fileJson);
    }
}

export class FilesManager {
    private readonly files: file[] = [];
    private readonly fileManagers: FileManager[] = [];
    private readonly storageRootLocation: string;

    //Returns a single FileManger or undefined if the file doesn't exist
    getFile(name: string): FileManager | undefined {
        for (const f of this.fileManagers) {
            if (f.getName() !== name) continue;

            return f
        }

        return undefined
    }

    //Removes a file based on the name provided, if file doesn't exist - does nothing.
    removeFile(name: string) {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].name !== name) continue;

            this.files.splice(i, 1);

            break
        }
        for (let i = 0; i < this.fileManagers.length; i++) {
            if (this.fileManagers[i].getName() !== name) continue;

            this.fileManagers.splice(i, 1);
        }
    }

    //Registers a single file to the stats file. If file is already present - does nothing.
    addFile(name: string, metadata: {[p:string]: string} = {}, belongsToGroups: string[] = []) {
        const f = this.getFile(name);
        if (f) {
            f.setName(name)
            for (const key of Object.keys(metadata || {})) {f.setMetadata(key, metadata[key])}
            for (const g of belongsToGroups || []) {f.addToGroup(`${g}`)}
            return
        }

        const fileStruct = {name: name, location: this.storageRootLocation, groups: belongsToGroups, metadata: metadata};
        const fm = new FileManager(fileStruct)

        this.files.push(fileStruct);
        this.fileManagers.push(fm);
    }

    //Returns a list of files whose name matches the value provided.
    matchFiles(val: string): string[] {
        let results: string[] = [];

        for (const fm of this.fileManagers) {
            if (fm.getName().search(val) === -1) continue;

            results.push(fm.getName())
        }

        return results
    }

    constructor(filesJson: any, storageLocation: string) {
        this.storageRootLocation = storageLocation;
        this.files = filesJson;

        for (const f of this.files) {
            this.fileManagers.push(new FileManager(f));
        }
    }
}

//======[STATS FILE]================================================================================================

export type statsFile = {
    files: file[],
    groups: groups,
    metadata: metadata,
}

export class StatsFile {
    private readonly statsFile: statsFile;
    private readonly statsFileLocation: string;
    private readonly FilesManager: FilesManager;
    private readonly MetadataManager: MetadataManager;
    private readonly GroupsManager: GroupsManager;
    private checkStatsFile(f: any): statsFile {
        const defaultStruct: statsFile = {files: [], groups: {ids: [], files: {}}, metadata: {}}
        if (!f) f = defaultStruct;

        if (!f.files) f.files = defaultStruct.files;
        if (!f.groups) f.groups = defaultStruct.groups;
        if (!f.metadata) f.metadata = defaultStruct.metadata;

        return f
    }
    private addToMetadata(fileName: string, metadata: {[p: string]: string}) {
        for (const key of Object.keys(metadata || {})) {this.MetadataManager.add(key, metadata[key], fileName)}
    }
    private addToGroups(fileName: string, groups: string[]) {
        for (const g of groups || []) {this.GroupsManager.addToGroup(`${g}`, fileName)}
    }

    getFile(name: string): FileManager | undefined {
        name = `${name}`.toLowerCase()
        return this.FilesManager.getFile(name);
    }
    getGroup(group_name: string): FileManager[] | undefined {
        let results: FileManager[] = [];

        const group = this.GroupsManager.getGroup(group_name);
        if (!group) return undefined;

        for (const fileName of group) {
            const f = this.getFile(fileName);

            if (!f) {
                this.GroupsManager.removeFromGroup(group_name, fileName);
                continue
            }

            results.push(f);
        }

        return results
    }
    getMetadata(fileName: string, metadata_key: string): string | undefined {
        const fm = this.getFile(fileName);
        if (!fm) return undefined;
        return fm.getMetadata(metadata_key)
    }
    getFilesThatHaveMetadataKey(key: string, value?: string | undefined): FileManager[] | undefined {
        const fileNames = this.MetadataManager.getFileNamesWithMetadata(key);
        if (!fileNames) return undefined;

        let results: FileManager[] = [];

        for (const name of fileNames) {
            const file = this.getFile(name);

            if (!file) {
                this.MetadataManager.remove(key, name);
                continue;
            }

            if (value) {
                const v = file.getMetadata(key)
                if (v === undefined || value !== v) continue;
            }

            results.push(file);
        }

        return results
    }

    addFile(name: string, metadata: {[p:string]: string} = {}, belongsToGroups: string[] = []) {
        name = `${name}`.toLowerCase()
        this.FilesManager.addFile(name, metadata, belongsToGroups);
        this.addToMetadata(name, metadata);
        this.addToGroups(name, belongsToGroups);
    }
    addMetadata(fileName: string, metadata: {[p: string]: string}) {
        fileName = `${fileName}`.toLowerCase();
        const fm = this.getFile(fileName);

        if (!fm) return;

        for (const key of Object.keys(metadata || {})) {
            const value = `${metadata[key]}`;
            fm.setMetadata(key, value);
            this.MetadataManager.add(key, value, fileName)
        }
    }
    addToGroup(fileName: string, groups: string[]) {
        fileName = `${fileName}`.toLowerCase();
        const fm = this.getFile(fileName)

        if (!fm) return;

        for (const group of groups || []) {
            fm.addToGroup(group)
            this.GroupsManager.addToGroup(group, fileName);
        }
    }

    removeFile(name: string) {
        this.FilesManager.removeFile(`${name}`.toLowerCase())
    }
    removeMetadata(fileName: string, key: string) {
        this.MetadataManager.remove(key, fileName);

        const fm = this.getFile(fileName);
        if (!fm) return
        fm.removeMetadata(key);
    }
    removeGroup(fileName: string, group_name: string) {
        this.GroupsManager.removeFromGroup(group_name, fileName);

        const fm = this.getFile(fileName);
        if (!fm) return;
        fm.removeFromGroup(group_name);
    }

    matchFiles(val: string): FileManager[] {
        let results: FileManager[] = [];

        for (const name of this.FilesManager.matchFiles(`${val}`.toLowerCase())) {
            const f = this.getFile(name);

            if (!f) continue;

            results.push(f)
        }

        return results
    }

    saveFile() {
        fs.writeFileSync(this.statsFileLocation, JSON.stringify(this.statsFile), "utf-8")
    }

    constructor(statsFileRootLocation: string, statsFileName: string) {
        this.statsFileLocation = path.join(statsFileRootLocation, statsFileName);
        this.statsFile = this.checkStatsFile(JSON.parse(fs.readFileSync(this.statsFileLocation, "utf-8") || "{}"))
        this.FilesManager = new FilesManager(this.statsFile.files, statsFileRootLocation);
        this.MetadataManager = new MetadataManager(this.statsFile.metadata);
        this.GroupsManager = new GroupsManager(this.statsFile.groups);
    }
}
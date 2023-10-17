"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPacker = void 0;
const index_1 = require("../index");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const archiver_1 = __importDefault(require("archiver"));
class JobPacker {
    tmpLoc;
    options;
    archiver;
    getDefaultJobPackerOptions() {
        return {};
    }
    checkOptions(options) {
        return this.getDefaultJobPackerOptions();
    }
    generateRootFolder(name) {
        const p = path_1.default.join(this.tmpLoc, name);
        fs_extra_1.default.mkdirSync(path_1.default.join(p, `metadata/external`), { recursive: true });
        fs_extra_1.default.mkdirSync(path_1.default.join(p, `metadata/internal`), { recursive: true });
        fs_extra_1.default.mkdirSync(path_1.default.join(p, `file`), { recursive: true });
        return p;
    }
    async packExternalMetadata(loc, def, job) {
        for (const m of def.metadata.external)
            fs_extra_1.default.copyFileSync(await job.getDataset(m.name, AccessLevel.ReadOnly), path_1.default.join(loc, `${m.name}.${m.extension}`));
    }
    async packJobFile(loc, def, job) {
        fs_extra_1.default.copyFileSync(await job.get(AccessLevel.ReadOnly), path_1.default.join(loc, def.file.originalName));
    }
    async saveDefinition(loc, def) {
        fs_extra_1.default.writeFileSync(path_1.default.join(loc, `definitions.json`), JSON.stringify(def), { encoding: "utf-8" });
    }
    async generateArchive(src, dest, archiver) {
        return new Promise(resolve => {
            const output = fs_extra_1.default.createWriteStream(dest, { encoding: "utf-8", autoClose: true });
            archiver.pipe(output);
            archiver.directory(src, false);
            archiver.finalize().then(() => { resolve(dest); });
        });
    }
    async pack(job) {
        const defGen = new index_1.definitions.v1.DefinitionStructure();
        await defGen.addPrivateData(job);
        await defGen.addExternalMetadata(job);
        await defGen.addInternalMetadata(job);
        await defGen.addFileInfo(job);
        const def = await defGen.get();
        const rootFolderName = `_${job.getId()}_${job.getName(false)}`;
        const rootFolderLoc = this.generateRootFolder(rootFolderName);
        await this.packExternalMetadata(path_1.default.join(rootFolderLoc, `metadata/external`), def, job);
        await this.packJobFile(path_1.default.join(rootFolderLoc, `file`), def, job);
        await this.saveDefinition(rootFolderLoc, def);
        const archiveLocation = await this.generateArchive(rootFolderLoc, path_1.default.join(this.tmpLoc, `${rootFolderName}.zip`), this.archiver);
        fs_extra_1.default.rmdirSync(rootFolderLoc, { recursive: true, maxRetries: 6, retryDelay: 1000 });
        return archiveLocation;
    }
    constructor(tmpLocation, options) {
        if (!path_1.default.isAbsolute(tmpLocation))
            throw `Tmp location "${tmpLocation}" provided must be an absolute path!`;
        this.tmpLoc = tmpLocation;
        this.archiver = archiver_1.default.create("zip", { zlib: { level: 0 } });
        this.archiver.on("error", err => { throw `${err}`; });
        this.archiver.on("warning", err => { if (err.code !== 'ENOENT')
            throw `${err}`; });
        this.options = this.checkOptions(options);
    }
}
exports.JobPacker = JobPacker;

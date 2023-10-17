"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobUnPacker = void 0;
const decompress_1 = __importDefault(require("decompress"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class JobUnPacker {
    tmpLoc;
    packedJobLoc = ``;
    rootFolderLoc = ``;
    async unArchive(archiveLoc) {
        const parsedLoc = path_1.default.parse(archiveLoc);
        if (parsedLoc.ext !== `.zip`)
            throw `Expected to receive '.zip' archive, got '${parsedLoc.ext}'!`;
        const decompressTo = path_1.default.join(parsedLoc.dir, parsedLoc.name);
        await (0, decompress_1.default)(archiveLoc, decompressTo);
        return decompressTo;
    }
    async readDefinition(rootLoc) {
        const defLoc = path_1.default.join(rootLoc, `definitions.json`);
        if (!fs_extra_1.default.existsSync(defLoc))
            throw `Packed job definition file 'definitions.json' has not been found in the location '${defLoc}'!`;
        return JSON.parse(fs_extra_1.default.readFileSync(defLoc, { encoding: "utf-8" }));
    }
    async setPrivateData(job, data) {
        await job.setPrivateData(data);
    }
    async setExternalMetadata(job, rootLoc, data) {
        for (const d of data) {
            const mLoc = path_1.default.join(rootLoc, d.path);
            if (!fs_extra_1.default.existsSync(mLoc))
                throw `Could not find backing metadata file in the location '${mLoc}' fro dataset '${d.name}'!`;
            await job.createDataset(d.name, mLoc, d.model);
        }
    }
    async setInternalMetadata(job) {
    }
    async cleanup() {
        try {
            fs_extra_1.default.rmdirSync(this.rootFolderLoc, { recursive: true, maxRetries: 6, retryDelay: 1000 });
            fs_extra_1.default.unlinkSync(this.packedJobLoc);
        }
        catch { }
    }
    //Unpacks a given job that was packed using `JobPacker` class and returns a child job
    async unpack(packedJob, tmpJob) {
        if (!fs_extra_1.default.existsSync(packedJob))
            throw `Archive in location '${packedJob}' was not found!`;
        this.packedJobLoc = packedJob;
        this.rootFolderLoc = await this.unArchive(packedJob);
        const def = await this.readDefinition(this.rootFolderLoc);
        const pathToMainFile = path_1.default.join(this.rootFolderLoc, def.file.path);
        if (!fs_extra_1.default.existsSync(pathToMainFile))
            throw `Original packed file does nto exist in the location '${pathToMainFile}'!`;
        tmpJob = await tmpJob.createChild(pathToMainFile);
        await this.setPrivateData(tmpJob, def.privateData);
        await this.setExternalMetadata(tmpJob, this.rootFolderLoc, def.metadata.external);
        await this.setInternalMetadata(tmpJob);
        return { job: tmpJob, def: def };
    }
    constructor(tmpLocation) {
        this.tmpLoc = tmpLocation;
    }
}
exports.JobUnPacker = JobUnPacker;

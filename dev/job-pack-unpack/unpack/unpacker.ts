import {definitions} from "../index";
import decompress from "decompress"
import path from "path";
import fs from "fs-extra"

export class JobUnPacker {
    private readonly tmpLoc: string;
    private packedJobLoc: string = ``;
    private rootFolderLoc: string = ``;

    private async unArchive(archiveLoc: string): Promise<string> {
        const parsedLoc = path.parse(archiveLoc);

        if (parsedLoc.ext !== `.zip`) throw `Expected to receive '.zip' archive, got '${parsedLoc.ext}'!`;

        const decompressTo = path.join(parsedLoc.dir, parsedLoc.name);

        await decompress(archiveLoc, decompressTo)

        return decompressTo
    }

    private async readDefinition(rootLoc: string): Promise<definitions.v1.definitionStructure> {
        const defLoc = path.join(rootLoc, `definitions.json`)

        if (!fs.existsSync(defLoc)) throw `Packed job definition file 'definitions.json' has not been found in the location '${defLoc}'!`;

        return JSON.parse(fs.readFileSync(defLoc, {encoding: "utf-8"}))
    }

    private async setPrivateData(job: Job, data: definitions.v1.privateDataSignature[]) {
        await job.setPrivateData(data)
    }

    private async setExternalMetadata(job: Job, rootLoc: string, data: definitions.v1.externalMetadata[]) {
        for (const d of data) {
            const mLoc = path.join(rootLoc, d.path);

            if (!fs.existsSync(mLoc)) throw `Could not find backing metadata file in the location '${mLoc}' fro dataset '${d.name}'!`;

            await job.createDataset(d.name, mLoc, d.model)
        }
    }

    private async setInternalMetadata(job: Job) {

    }

    async cleanup() {
        try {
            fs.rmdirSync(this.rootFolderLoc, {recursive: true, maxRetries: 6, retryDelay: 1000})
            fs.unlinkSync(this.packedJobLoc)
        } catch {}
    }

    //Unpacks a given job that was packed using `JobPacker` class and returns a child job
    async unpack(packedJob: string, tmpJob: Job): Promise<{job: Job, def: definitions.v1.definitionStructure}> {
        if (!fs.existsSync(packedJob)) throw `Archive in location '${packedJob}' was not found!`;

        this.packedJobLoc =         packedJob
        this.rootFolderLoc =        await this.unArchive(packedJob)
        const def =                 await this.readDefinition(this.rootFolderLoc)
        const pathToMainFile =      path.join(this.rootFolderLoc, def.file.path)

        if (!fs.existsSync(pathToMainFile)) throw `Original packed file does nto exist in the location '${pathToMainFile}'!`;
        tmpJob = await tmpJob.createChild(pathToMainFile)

        await this.setPrivateData(tmpJob, def.privateData)
        await this.setExternalMetadata(tmpJob, this.rootFolderLoc, def.metadata.external)
        await this.setInternalMetadata(tmpJob)

        return {job: tmpJob, def: def}
    }

    constructor(tmpLocation: string) {
        this.tmpLoc = tmpLocation
    }
}
import {definitions} from "../index";
import path from "path";
import fs from "fs-extra";
import a from "archiver";

export type jobPackerOptions = {}

export class JobPacker {
    private readonly tmpLoc: string
    private readonly options: jobPackerOptions
    private readonly archiver: a.Archiver;

    private getDefaultJobPackerOptions(): jobPackerOptions {
        return {}
    }

    private checkOptions(options?: jobPackerOptions): jobPackerOptions {
        return this.getDefaultJobPackerOptions()
    }

    private generateRootFolder(name: string): string {
        const p = path.join(this.tmpLoc, name);

        fs.mkdirSync(path.join(p, `metadata/external`), {recursive: true})
        fs.mkdirSync(path.join(p, `metadata/internal`), {recursive: true})
        fs.mkdirSync(path.join(p, `file`), {recursive: true})

        return p
    }

    private async packExternalMetadata(loc: string, def: definitions.v1.definitionStructure, job: Job) {
        for (const m of def.metadata.external) fs.copyFileSync(await job.getDataset(m.name, AccessLevel.ReadOnly), path.join(loc, `${m.name}.${m.extension}`))
    }

    private async packJobFile(loc: string, def: definitions.v1.definitionStructure, job: Job) {
        fs.copyFileSync(await job.get(AccessLevel.ReadOnly), path.join(loc, def.file.originalName))
    }

    private async saveDefinition(loc: string, def: definitions.v1.definitionStructure) {
        fs.writeFileSync(path.join(loc, `definitions.json`), JSON.stringify(def), {encoding: "utf-8"})
    }

    private async generateArchive(src: string, dest: string, archiver: a.Archiver): Promise<string> {
        return new Promise<string>(resolve => {
            const output = fs.createWriteStream(dest, {encoding: "utf-8", autoClose: true});

            archiver.pipe(output)
            archiver.directory(src, false)
            archiver.finalize().then(()=>{resolve(dest)})
        })
    }

    async pack(job: Job): Promise<string> {
        const defGen = new definitions.v1.DefinitionStructure();

        await defGen.addPrivateData(job)
        await defGen.addExternalMetadata(job)
        await defGen.addInternalMetadata(job)
        await defGen.addFileInfo(job)

        const def = await defGen.get()
        const rootFolderName = `_${job.getId()}_${job.getName(false)}`;
        const rootFolderLoc = this.generateRootFolder(rootFolderName)

        await this.packExternalMetadata(path.join(rootFolderLoc, `metadata/external`), def, job)
        await this.packJobFile(path.join(rootFolderLoc, `file`), def, job)
        await this.saveDefinition(rootFolderLoc, def)

        const archiveLocation = await this.generateArchive(rootFolderLoc, path.join(this.tmpLoc, `${rootFolderName}.zip`), this.archiver)

        fs.rmdirSync(rootFolderLoc, {recursive: true, maxRetries: 6, retryDelay: 1000})

        return archiveLocation
    }

    constructor(tmpLocation: string, options?: jobPackerOptions) {
        if (!path.isAbsolute(tmpLocation)) throw `Tmp location "${tmpLocation}" provided must be an absolute path!`;
        this.tmpLoc = tmpLocation

        this.archiver = a.create("zip", {zlib: {level: 0}});
        this.archiver.on("error", err=>{throw `${err}`})
        this.archiver.on("warning", err=>{if (err.code !== 'ENOENT') throw `${err}`})

        this.options = this.checkOptions(options)
    }
}
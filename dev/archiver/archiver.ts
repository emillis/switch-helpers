import * as archiver from "archiver";
import * as fs from "fs-extra";
import * as path from "path";
import {GlobalSwitchConfig, NameGenerator} from "../main";

export type zipperOptions = {
    archiveName?: string,
    tmpLocation?: string
    compressionLevel?: number
}
function makeZipperOptionsReasonable(nameGenerator: NameGenerator.AdvancedStringGenerator, options?: zipperOptions): zipperOptions {
    const o: zipperOptions = options || {}

    if (!o.archiveName) o.archiveName = `ZIP-${nameGenerator.generate()}-ARCHIVE`
    if (o.tmpLocation === undefined) o.tmpLocation = (new GlobalSwitchConfig.Fetcher()).getValueOrFail(`TempMetadataFileLocation`);
    if (typeof o.compressionLevel !== "number") o.compressionLevel = 0;
    if (o.compressionLevel === undefined) o.compressionLevel = 0;
    if (o.compressionLevel < 0) o.compressionLevel = 0;
    if (o.compressionLevel > 9) o.compressionLevel = 9;

    return o
}

export type compressionOptions = {
    failIfFileMissing?: boolean
    randomizeNamesInArchive?: boolean
}
function makeCompressionOptionsReasonable(options?: compressionOptions): compressionOptions {
    let o = options || {}

    if (o.failIfFileMissing === undefined) o.failIfFileMissing = false;
    if (o.randomizeNamesInArchive === undefined) o.randomizeNamesInArchive = false;

    return o
}

export type addFileOptions = {
    newName?: string
}

export class Zip {
    private readonly name: string;
    private readonly options: zipperOptions;
    private readonly zipLocation: string;
    private readonly nameGenerator: NameGenerator.AdvancedStringGenerator;
    private wasInitiated: boolean = false;
    private archiveCreated: boolean = false;
    private archive: archiver.Archiver | undefined;
    private filesToArchive: {loc: string, newName: string | undefined}[] = [];

    //This method throws an error if Zipper hasn't been initiated just yet
    private initiated() {
        if (!this.wasInitiated) throw `Zipper has not yet been initiated! Please run .init() in order to initiate the zipper.`;
    }

    //Returns number of bytes of all the files combined that have been added to zipper
    getPotentialArchiveSizeInBytes(): number {
        this.initiated()
        let size: number = 0;

        for (const fileLoc of this.filesToArchive) {
            if (!fs.existsSync(fileLoc.loc)) continue;
            size += fs.statSync(fileLoc.loc).size
        }

        return size;
    }

    //This method generates the archive with all the files that were added.
    async createArchive(options?: compressionOptions): Promise<string> {
        this.initiated();
        const o = makeCompressionOptionsReasonable(options);
        let namesAlreadyWritten: {[name: string]: boolean} = {}

        //Following logic checks for existing files and adds them to the two arrays accordingly
        let existingFiles: {loc: string, newName: string | undefined}[] = [];
        let missingFiles: {loc: string, newName: string | undefined}[] = [];
        for (const fileInfo of this.filesToArchive) {
            if (fs.existsSync(fileInfo.loc)) {
                existingFiles.push(fileInfo)
                continue
            }
            missingFiles.push(fileInfo)
        }
        if (o.failIfFileMissing && missingFiles.length) throw `Some of the files requested to be zipped (archived) do not exist! Those are: "${missingFiles.join(`", "`)}"!`;

        for (const fileInfo of existingFiles) {
            const parsed = path.parse(fileInfo.loc)
            let name: string = fileInfo.newName || parsed.base;

            if (o.randomizeNamesInArchive) name = `${this.nameGenerator.generate()}-${this.nameGenerator.generate()}`;

            //The following logic makes sure that there are no duplicate file names present
            let tmpName = name;
            for (let i = 1; namesAlreadyWritten[tmpName]; i++) {
                tmpName = name
                tmpName = `${path.parse(name).name}_copy(${i})${parsed.ext}`
            }
            name = tmpName

            this.archive?.file(fileInfo.loc, {name: `${name}`})
            namesAlreadyWritten[name] = true;
        }

        await this.archive?.finalize()
        this.archiveCreated = true;
        return this.zipLocation
    }

    //Returns archive location if it has been created and undefined if it hasn't
    getArchiveLocation(): string | undefined {
        this.initiated()
        if (!this.archiveCreated) return undefined
        return this.zipLocation
    }

    addFile(loc: string, options?: addFileOptions) {
        this.initiated()
        this.filesToArchive.push({loc: loc, newName: options?.newName})
    }

    //files must contain full paths to each file
    addFiles(...files: string[]) {
        this.initiated()
        for (const file of files) {
            this.filesToArchive.push({loc: file, newName: undefined})
        }
    }

    constructor(options?: zipperOptions) {
        this.nameGenerator = new NameGenerator.AdvancedStringGenerator({type: "random", charCase: "upperOnly", composition: "alphaNumericOnly", minLen: 30, maxLen: 30});
        this.options = makeZipperOptionsReasonable(this.nameGenerator, options);

        if (!fs.pathExistsSync(this.options.tmpLocation || "")) throw `Temporary location "${this.options.tmpLocation}" does not exist!`;
        if (!this.options.archiveName) throw `Zip archive name is not defined. Expected a string, got "${this.options.archiveName}"!`;

        this.name = `${this.options.archiveName}.zip`
        this.zipLocation = path.join(`${this.options.tmpLocation}`, this.name)
    }
    //Init method creates all pre-requisites for generating the archive.
    private init() {
        if (this.wasInitiated) throw `Method .init(...) has already been called for class "Zip"`;
        this.wasInitiated = true
        const w = fs.createWriteStream(this.zipLocation, {encoding: "utf-8"});
        this.archive = archiver.create(`zip`, {zlib: {level: this.options.compressionLevel}})

        this.archive.on('warning', function(err) {
            if (err.code !== 'ENOENT') throw err;
        });
        this.archive.on('error', err=>{throw err});

        this.archive.pipe(w)
    }
}

// const z = new Zip({compressionLevel: 0, tmpLocation: "D:\\Switch Scripts\\_tmp_auto_removal_72h"})
//
// z.addFiles(`D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-DGMGQBBXCPBJZYUQXVKOOXRE97XGT6-3JOYNE0G4JCXQLDQVICJBXSYJYPCGY.html`)
// z.addFiles(
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-PFIBIC9JJYQQUCWW5FMBKYYQ6IWNW1-BVVC7PB8YA0KKJWRJY4G86OTEWF2Y8.html`,
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-PFIBIC9JJYQQUCWW5FMBKYYQ6IWNW1-BVVC7PB8YA0KKJWRJY4G86OTEWF2Y8.tag`,
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-PFIBIC9JJYQQUCWW5FMBKYYQ6IWNW1-BVVC7PB8YA0KKJWRJY4G86OTEWF2Y8.html`
// )
//
// z.createArchive({randomizeNamesInArchive: false, failIfFileMissing: true}).then(r=>{
//     console.log(`New zip archive created at: "${r}"`);
// })
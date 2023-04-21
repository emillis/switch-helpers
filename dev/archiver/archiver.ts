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

export class Zip {
    private readonly name: string;
    private readonly options: zipperOptions;
    private readonly zipLocation: string;
    private readonly nameGenerator: NameGenerator.AdvancedStringGenerator;
    private initiated: boolean = false;
    private archiveCreated: boolean = false;
    private archive: archiver.Archiver | undefined;
    private filesToArchive: string[] = [];

    //This method throws an error if Zipper hasn't been initiated just yet
    private checkIfInitiated () {
        if (!this.initiated) throw `Zipper has not yet been initiated! Please run .init() in order to initiate the zipper.`;
    }

    //Init method creates all pre-requisites for generating the archive.
    private init() {
        const w = fs.createWriteStream(this.zipLocation, {encoding: "utf-8"});
        this.archive = archiver.create(`zip`, {zlib: {level: this.options.compressionLevel}})

        this.archive.on('warning', function(err) {
            if (err.code !== 'ENOENT') throw err;
        });
        this.archive.on('error', err=>{throw err});

        this.archive.pipe(w)

        this.initiated = true
    }

    //Returns number of bytes of all the files combined that have been added to zipper
    getPotentialArchiveSizeInBytes(): number {
        let size: number = 0;

        for (const fileLoc of this.filesToArchive) {
            if (!fs.existsSync(fileLoc)) continue;
            size += fs.statSync(fileLoc).size
        }

        return size;
    }

    //This method generates the archive with all the files that were added.
    async createArchive(options?: compressionOptions): Promise<string> {
        if (!this.initiated) this.init();
        this.checkIfInitiated();
        const o = makeCompressionOptionsReasonable(options);
        let namesAlreadyWritten: {[name: string]: boolean} = {}

        //Following logic checks for existing files and adds them to the two arrays accordingly
        let existingFiles: string[] = [];
        let missingFiles: string[] = [];
        for (const filePath of this.filesToArchive) {
            if (fs.existsSync(filePath)) {
                existingFiles.push(filePath)
                continue
            }
            missingFiles.push(filePath)
        }
        if (o.failIfFileMissing && missingFiles.length) throw `Some of the files requested to be zipped (archived) do not exist! Those are: "${missingFiles.join(`", "`)}"!`;

        for (const fileLoc of existingFiles) {
            const parsed = path.parse(fileLoc)
            let name: string = "";

            if (o.randomizeNamesInArchive) {
                name = `${this.nameGenerator.generate()}-${this.nameGenerator.generate()}`;
            } else {
                name = `${parsed.name}`
            }

            //The following logic makes sure that there are no duplicate file names present
            let tmpName = name;
            for (let i = 2; namesAlreadyWritten[tmpName]; i++) {
                tmpName = name
                // tmpName = `${tmpName}_copy(${i})`
            }
            name = tmpName

            // console.log(`Writing: "${name}"`);

            this.archive?.file(fileLoc, {name: `${name}${parsed.ext}`})
            namesAlreadyWritten[name] = true;
        }

        await this.archive?.finalize()
        this.archiveCreated = true;
        return this.zipLocation
    }

    //Returns archive location if it has been created and undefined if it hasn't
    getArchiveLocation(): string | undefined {
        if (!this.archiveCreated) return undefined
        return this.zipLocation
    }

    //files must contain full paths to each file
    addFiles(...files: string[]) {
        this.filesToArchive.push(...files)
    }

    constructor(options?: zipperOptions) {
        this.nameGenerator = new NameGenerator.AdvancedStringGenerator({type: "random", charCase: "upperOnly", composition: "alphaNumericOnly", minLen: 30, maxLen: 30});
        this.options = makeZipperOptionsReasonable(this.nameGenerator, options);

        if (!fs.pathExistsSync(this.options.tmpLocation || "")) throw `Temporary location "${this.options.tmpLocation}" does not exist!`;
        if (!this.options.archiveName) throw `Zip archive name is not defined. Expected a string, got "${this.options.archiveName}"!`;

        this.name = `${this.options.archiveName}.zip`
        this.zipLocation = path.join(`${this.options.tmpLocation}`, this.name)
    }
}

// const z = new Zip({compressionLevel: 0, tmpLocation: "D:\\Switch Scripts\\_tmp_auto_removal_72h"})

// z.addFiles(`D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-4GLMMLO4QC43Z0ADV9Y9YFF0IAFTIH-GKR7HBDFRZGO1RLGADJ8MU8FAML4AQ.html`)
// z.addFiles(
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-326GHYCP6YHZI4UJK17ZQRQGMAEMT2-VPJ3LA6UAN5IYQVBQFWWFPQ0YHJCFU.html`,
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-326GHYCP6YHZI4UJK17ZQRQGMAEMT2-VPJ3LA6UAN5IYQVBQFWWFPQ0YHJCFU.html`,
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-326GHYCP6YHZI4UJK17ZQRQGMAEMT2-VPJ3LA6UAN5IYQVBQFWWFPQ0YHJCFU.html`,
//     `D:\\Switch Scripts\\_tmp_auto_removal_72h\\report-DFJKMZBHWQRXRLWEHVFJZP7JOFAJXC-UXACAI7RDCU1V8V1Y2VCXMQKXAQJQM.html`
// )
//
// z.createArchive({randomizeNamesInArchive: false, failIfFileMissing: true}).then(r=>{
//     console.log(`New zip archive created at: "${r}"`);
// })
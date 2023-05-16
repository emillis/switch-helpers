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
exports.Zip = void 0;
const archiver = __importStar(require("archiver"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const main_1 = require("../main");
function makeZipperOptionsReasonable(nameGenerator, options) {
    const o = options || {};
    if (!o.archiveName)
        o.archiveName = `ZIP-${nameGenerator.generate()}-ARCHIVE`;
    if (o.tmpLocation === undefined)
        o.tmpLocation = (new main_1.GlobalSwitchConfig.Fetcher()).getValueOrFail(`TempMetadataFileLocation`);
    if (typeof o.compressionLevel !== "number")
        o.compressionLevel = 0;
    if (o.compressionLevel === undefined)
        o.compressionLevel = 0;
    if (o.compressionLevel < 0)
        o.compressionLevel = 0;
    if (o.compressionLevel > 9)
        o.compressionLevel = 9;
    return o;
}
function makeCompressionOptionsReasonable(options) {
    let o = options || {};
    if (o.failIfFileMissing === undefined)
        o.failIfFileMissing = false;
    if (o.randomizeNamesInArchive === undefined)
        o.randomizeNamesInArchive = false;
    return o;
}
class Zip {
    name;
    options;
    zipLocation;
    nameGenerator;
    wasInitiated = false;
    archiveCreated = false;
    archive;
    filesToArchive = [];
    //This method throws an error if Zipper hasn't been initiated just yet
    initiated() {
        if (!this.wasInitiated)
            throw `Zipper has not yet been initiated! Please run .init() in order to initiate the zipper.`;
    }
    //Returns number of bytes of all the files combined that have been added to zipper
    getPotentialArchiveSizeInBytes() {
        this.initiated();
        let size = 0;
        for (const fileLoc of this.filesToArchive) {
            if (!fs.existsSync(fileLoc.loc))
                continue;
            size += fs.statSync(fileLoc.loc).size;
        }
        return size;
    }
    //This method generates the archive with all the files that were added.
    async createArchive(options) {
        this.initiated();
        const o = makeCompressionOptionsReasonable(options);
        let namesAlreadyWritten = {};
        //Following logic checks for existing files and adds them to the two arrays accordingly
        let existingFiles = [];
        let missingFiles = [];
        for (const fileInfo of this.filesToArchive) {
            if (fs.existsSync(fileInfo.loc)) {
                existingFiles.push(fileInfo);
                continue;
            }
            missingFiles.push(fileInfo);
        }
        if (o.failIfFileMissing && missingFiles.length)
            throw `Some of the files requested to be zipped (archived) do not exist! Those are: "${missingFiles.join(`", "`)}"!`;
        for (const fileInfo of existingFiles) {
            const parsed = path.parse(fileInfo.loc);
            let name = fileInfo.newName || parsed.base;
            if (o.randomizeNamesInArchive)
                name = `${this.nameGenerator.generate()}-${this.nameGenerator.generate()}`;
            //The following logic makes sure that there are no duplicate file names present
            let tmpName = name;
            for (let i = 1; namesAlreadyWritten[tmpName]; i++) {
                tmpName = name;
                tmpName = `${path.parse(name).name}_copy(${i})${parsed.ext}`;
            }
            name = tmpName;
            this.archive?.file(fileInfo.loc, { name: `${name}` });
            namesAlreadyWritten[name] = true;
        }
        await this.archive?.finalize();
        this.archiveCreated = true;
        return this.zipLocation;
    }
    //Returns archive location if it has been created and undefined if it hasn't
    getArchiveLocation() {
        this.initiated();
        if (!this.archiveCreated)
            return undefined;
        return this.zipLocation;
    }
    addFile(loc, options) {
        this.initiated();
        this.filesToArchive.push({ loc: loc, newName: options?.newName });
    }
    //files must contain full paths to each file
    addFiles(...files) {
        this.initiated();
        for (const file of files) {
            this.filesToArchive.push({ loc: file, newName: undefined });
        }
    }
    constructor(options) {
        this.nameGenerator = new main_1.NameGenerator.AdvancedStringGenerator({ type: "random", charCase: "upperOnly", composition: "alphaNumericOnly", minLen: 30, maxLen: 30 });
        this.options = makeZipperOptionsReasonable(this.nameGenerator, options);
        if (!fs.pathExistsSync(this.options.tmpLocation || ""))
            throw `Temporary location "${this.options.tmpLocation}" does not exist!`;
        if (!this.options.archiveName)
            throw `Zip archive name is not defined. Expected a string, got "${this.options.archiveName}"!`;
        this.name = `${this.options.archiveName}.zip`;
        this.zipLocation = path.join(`${this.options.tmpLocation}`, this.name);
    }
    //Init method creates all pre-requisites for generating the archive.
    async init() {
        if (this.wasInitiated)
            throw `Method .init(...) has already been called for class "Zip"`;
        this.wasInitiated = true;
        const w = fs.createWriteStream(this.zipLocation, { encoding: "utf-8" });
        this.archive = archiver.create(`zip`, { zlib: { level: this.options.compressionLevel } });
        this.archive.on('warning', function (err) {
            if (err.code !== 'ENOENT')
                throw err;
        });
        this.archive.on('error', err => { throw err; });
        this.archive.pipe(w);
        return this;
    }
}
exports.Zip = Zip;
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

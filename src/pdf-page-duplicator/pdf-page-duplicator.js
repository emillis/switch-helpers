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
exports.Duplicator = void 0;
const pdfLib = __importStar(require("pdf-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Duplicator {
    initialized = false;
    pdfLocation;
    document;
    wasInitialized() {
        if (!this.initialized)
            throw `Duplicator needs to be initialized using "init()" before using this method!`;
    }
    //Checks whether supplied pages are in a right format. This is mainly because you are allowed to use ranges, e.g. (5-9).
    prettifyPageArray(pages) {
        let results = [];
        function splitRange(range) {
            const result = [];
            const errMsg = `Invalid value "${range}" provided!`;
            const splitRange = range.split(`-`);
            if (splitRange.length !== 2)
                throw errMsg;
            const n1 = +splitRange[0];
            const n2 = +splitRange[1];
            if (isNaN(n1) || isNaN(n2))
                throw errMsg;
            if (n2 <= n1)
                throw errMsg;
            if (n1 < 1)
                throw errMsg;
            for (let i = n1; i <= n2; i++) {
                result.push(i);
            }
            return result;
        }
        for (const page of pages) {
            let n = +page;
            if (isNaN(n)) {
                results.push(...splitRange(page));
                continue;
            }
            results.push(n);
        }
        return results;
    }
    //This method will duplicate array supplied number of times defined in `copies` argument
    duplicateArray(arr, copies) {
        const result = [];
        for (let i = 0; i < copies; i++)
            result.push(...arr);
        return result;
    }
    //Duplicate the whole document for a number of times. This method will duplicate in a pattern of "123, 123, 123..."
    async duplicateWholeDocument(copies) {
        this.wasInitialized();
        if (!this.document)
            throw `Document is not assigned!`;
        const newDoc = await pdfLib.PDFDocument.create({ updateMetadata: true });
        for (const page of await newDoc.copyPages(this.document, this.duplicateArray(this.document.getPageIndices(), copies)))
            newDoc.addPage(page);
        this.document = newDoc;
    }
    //This method allows to duplicate specific pages, but in a pattern of "111, 222, 333...". If the `duplicatePages`
    //array is left empty, every page gets duplicated. You can also specify a range of pages to be duplicated, e.g.: "5-9".
    //So a full example of `duplicatePages` might look like this: [`1`, `16`, `18-20`, `22`, `35-40`]
    async duplicateIndividualPages(duplicatePages, copies) {
        this.wasInitialized();
        if (!this.document)
            throw `Document is not assigned!`;
        const newDoc = await pdfLib.PDFDocument.create({ updateMetadata: true });
        for (const page of await newDoc.copyPages(this.document, this.duplicateArray(this.prettifyPageArray(duplicatePages), copies).map(v => { return v - 1; }))) {
            newDoc.addPage(page);
        }
        this.document = newDoc;
    }
    //This method saves the files in the location specified
    async save(location) {
        this.wasInitialized();
        if (!this.document)
            throw `Document is not assigned`;
        if (!location || !path.isAbsolute(location))
            throw `Invalid location "${location}" provided as PDF saving location!`;
        if (path.parse(location).ext !== ".pdf")
            location = path.join(location, path.parse(this.pdfLocation).base);
        fs.writeFileSync(location, await this.document.save({}));
    }
    constructor(pdfLocation) {
        this.pdfLocation = pdfLocation;
        const ext = path.parse(this.pdfLocation).ext;
        if (ext !== `.pdf`)
            throw `Only PDF files are allowed to Pdf Page Duplicator! Got "${ext}" file!`;
    }
    async init() {
        if (this.initialized)
            throw `Duplicator was already initialized!`;
        this.initialized = true;
        if (!fs.existsSync(this.pdfLocation))
            throw `Pdf file does not exist in location "${this.pdfLocation}"!`;
        this.document = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLocation), { updateMetadata: true });
        return this;
    }
}
exports.Duplicator = Duplicator;
// const dup = new Duplicator(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Page duplicator testing\\one.pdf`)
// dup.init().then(r=>{
//     r.duplicateWholeDocument(5).then(()=>{
//         r.save(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Page duplicator testing\\outcome.pdf`).then(()=>{
//             console.log(`Saved!`);
//         })
//     })
// })

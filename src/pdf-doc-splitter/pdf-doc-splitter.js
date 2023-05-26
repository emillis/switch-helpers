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
exports.Splitter = void 0;
const pdfLib = __importStar(require("pdf-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class Splitter {
    initialized = false;
    pdfLocation;
    docToSplit;
    docsToSave = [];
    wasInitialized() {
        if (!this.initialized)
            throw `Duplicator needs to be initialized using "init()" before using this method!`;
    }
    //Checks whether supplied pages are in a right format. This is mainly because you are allowed to use ranges, e.g. (5-9).
    prettifySplitValue(val) {
        if (!isNaN(+val)) {
            if (+val < 1)
                throw `Value "${val}" supplied cannot be less than 1!`;
            return [+val];
        }
        const results = [];
        const splitRange = `${val}`.split(`-`);
        if (splitRange.length !== 2)
            throw `Invalid range syntax "${val}" provided!`;
        const n1 = +splitRange[0];
        const n2 = +splitRange[1];
        if (isNaN(n1) || isNaN(n2))
            throw `Both, "${n1}" and "${n2}" needs to be numbers!`;
        if (n2 <= n1)
            throw `In range "${val}", last number ${n2}" cannot be less or equal to the first number "${n1}"!`;
        if (n1 < 1)
            throw `In rage "${val}", first number "${n1}" cannot be less than 1!`;
        for (let i = n1; i <= n2; i++)
            results.push(i);
        return results;
    }
    //Using this method you can split PDF into multiple different PDF files. If the `split` parameter
    //is left empty, every page gets split. You can also specify a range of pages to be split, e.g.: "5-9".
    //So a full example of `split` parameter might look like this: [`1`, `16`, `18-20`, `22`, `35-40`]
    async split(split) {
        this.wasInitialized();
        if (!this.docToSplit)
            throw `Document is not assigned!`;
        if (!split.length)
            split = this.docToSplit.getPageIndices().map(v => { return v + 1; });
        const pageCount = this.docToSplit.getPageCount();
        for (const splitPages of split) {
            const pages = this.prettifySplitValue(`${splitPages}`).filter(v => v <= pageCount);
            if (!pages.length)
                continue;
            const newDoc = await pdfLib.PDFDocument.create();
            const pagesArray = await newDoc.copyPages(this.docToSplit, this.docToSplit.getPageIndices());
            for (const page of pages)
                newDoc.addPage(pagesArray[page - 1]);
            this.docsToSave.push({ range: pages.length > 1 ? `${pages[0]}-${pages[pages.length - 1]}` : `${pages[0]}`, pdf: newDoc });
        }
    }
    //This method saves the files in the location specified
    async save(location, options) {
        this.wasInitialized();
        if (!this.docToSplit)
            throw `Document is not assigned`;
        if (!location || !path.isAbsolute(location))
            throw `Invalid location "${location}" provided as PDF saving location!`;
        const parsedLocation = path.parse(location);
        if (parsedLocation.ext !== ".pdf") {
            location = path.join(location, path.parse(this.pdfLocation).name);
        }
        else {
            location = path.join(parsedLocation.dir, parsedLocation.name);
        }
        for (const docToSave of this.docsToSave) {
            fs.writeFileSync(`${location}${options?.separator || `_`}${docToSave.range}.pdf`, await docToSave.pdf.save());
        }
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
        this.docToSplit = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLocation));
        return this;
    }
}
exports.Splitter = Splitter;
// (new Splitter(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing/one.pdf`)).init().then(splitter=>{
//     splitter.split([]).then(()=>{
//         splitter.save(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing`, {separator: `_`}).then(()=>{
//             console.log(`Saved!`);
//         })
//     })
// })

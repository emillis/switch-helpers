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
exports.BannerSheet = exports.bannerPageLocation = void 0;
const pdfLib = __importStar(require("pdf-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
exports.bannerPageLocation = { start: "start", end: "end" };
class DataEntry {
    entry;
    pdfLib;
    writeValue() {
        this.pdfLib.drawText(this.entry.value, {
            x: this.entry.posX,
            y: this.entry.posY,
            size: this.entry.fontSize,
        });
    }
    constructor(entry, pdfLib) {
        this.entry = entry;
        this.pdfLib = pdfLib;
    }
}
class BannerSheet {
    wasInitiated = false;
    pdfLoc;
    doc;
    checkInitiated() {
        if (!this.wasInitiated)
            throw `Banner sheet class has not been initiated. Please run .init() to initiate the class first!`;
    }
    getFirstPageSize() {
        this.checkInitiated();
        if (!this.doc)
            throw `Document was not loaded!`;
        return this.doc.getPage(0).getSize();
    }
    verifyAddSheetOptions(options) {
        if (options.width && options.width < 0)
            throw `Banner sheet width cannot be "${options.width}"!`;
        if (options.height && options.height < 0)
            throw `Banner sheet height cannot be "${options.height}"!`;
        return options;
    }
    addPage(options) {
        this.checkInitiated();
        if (!this.doc)
            throw `Document was not loaded!`;
        options = this.verifyAddSheetOptions(options);
        const firstPageSize = options.width && options.height ? { width: options.width, height: options.height } : this.getFirstPageSize();
        const page = this.doc.insertPage(options.location === exports.bannerPageLocation.end ? this.doc.getPageCount() : 0, [firstPageSize.width, firstPageSize.height]);
        for (const d of options.dataEntries) {
            d.posY = firstPageSize.height - d.posY - d.fontSize;
            new DataEntry(d, page).writeValue();
        }
    }
    async save(location) {
        this.checkInitiated();
        if (!this.doc)
            throw `Document is not assigned!`;
        if (!location || !path.isAbsolute(location))
            throw `Invalid location "${location}" provided as PDF saving location!`;
        if (path.parse(location).ext !== ".pdf")
            location = path.join(location, path.parse(this.pdfLoc).base);
        fs.writeFileSync(location, await this.doc.save({}));
    }
    constructor(pdfLoc) {
        if (!fs.existsSync(pdfLoc))
            throw `File does not exist in the location "${pdfLoc}"!`;
        if (path.parse(pdfLoc).ext !== `.pdf`)
            throw `Banner sheet can only be added to .pdf file!`;
        this.pdfLoc = pdfLoc;
    }
    async init() {
        if (this.wasInitiated)
            throw `Class "BannerSheet" has already been initiated!`;
        this.wasInitiated = true;
        this.doc = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLoc), { updateMetadata: true });
        return this;
    }
}
exports.BannerSheet = BannerSheet;
// (new BannerSheet(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Banner sheet generator testing\\one.pdf`)).init().then(bannerSheet=>{
//     bannerSheet.addPage({location: `end`, dataEntries: []})
//
//     bannerSheet.addPage({location: `end`, dataEntries: [
//             {value: "hello world", posX: 0, posY: 50, fontSize: 11}
//         ]})
//
//     bannerSheet.save(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Banner sheet generator testing\\result.pdf`).then(()=>{
//         console.log(`Done!`);
//     })
// })

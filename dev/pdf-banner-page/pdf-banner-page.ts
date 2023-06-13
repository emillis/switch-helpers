import * as pdfLib from "pdf-lib";
import * as fs from "fs-extra";
import * as path from "path";

const bannerPageLocation = {start: "start", end: "end"} as const;
type bannerPageLocation = typeof bannerPageLocation[keyof typeof bannerPageLocation];

export type dataEntry = {
    value:              string //Data value that will be displayed
    posX:               number //X position of the value starting from top left corner of the page
    posY:               number //Y position of the value starting from the top left corner of the page
    fontSize:           number //Font size of the value in pt
}

class DataEntry {
    private readonly entry: dataEntry;
    private readonly pdfLib: pdfLib.PDFPage;

    writeValue() {
        this.pdfLib.drawText(this.entry.value, {
            x:          this.entry.posX,
            y:          this.entry.posY,
            size:       this.entry.fontSize,
        })
    }

    constructor(entry: dataEntry, pdfLib: pdfLib.PDFPage) {
        this.entry = entry;
        this.pdfLib = pdfLib;
    }
}

export type addSheetOptions = {
    dataEntries:        dataEntry[]
    width?:             number
    height?:            number
    location?:          bannerPageLocation
}

export class BannerSheet {
    private wasInitiated:           boolean = false;
    private readonly pdfLoc:        string;
    private doc:                    pdfLib.PDFDocument | undefined;

    private checkInitiated() {
        if (!this.wasInitiated) throw `Banner sheet class has not been initiated. Please run .init() to initiate the class first!`;
    }

    private getFirstPageSize(): {width: number, height: number} {
        this.checkInitiated()
        if (!this.doc) throw `Document was not loaded!`;
        return this.doc.getPage(0).getSize()
    }

    private verifyAddSheetOptions(options: addSheetOptions): addSheetOptions {
        if (options.width && options.width < 0) throw `Banner sheet width cannot be "${options.width}"!`;
        if (options.height && options.height < 0) throw `Banner sheet height cannot be "${options.height}"!`;
        return options
    }

    addPage(options: addSheetOptions) {
        this.checkInitiated()
        if (!this.doc) throw `Document was not loaded!`;
        options = this.verifyAddSheetOptions(options);

        const firstPageSize = options.width && options.height ? {width: options.width, height: options.height} : this.getFirstPageSize()

        const page = this.doc.insertPage(options.location === bannerPageLocation.end ? this.doc.getPageCount() : 0, [firstPageSize.width, firstPageSize.height])

        for (const d of options.dataEntries) {
            d.posY = firstPageSize.height - d.posY - d.fontSize
            new DataEntry(d, page).writeValue()
        }
    }

    async save(location: string) {
        this.checkInitiated()
        if (!this.doc) throw `Document is not assigned!`;

        if (!location || !path.isAbsolute(location)) throw `Invalid location "${location}" provided as PDF saving location!`;
        if (path.parse(location).ext !== ".pdf") location = path.join(location, path.parse(this.pdfLoc).base)

        fs.writeFileSync(location, await this.doc.save({}));
    }

    constructor(pdfLoc: string) {
        if (!fs.existsSync(pdfLoc)) throw `File does not exist in the location "${pdfLoc}"!`;
        if (path.parse(pdfLoc).ext !== `.pdf`) throw `Banner sheet can only be added to .pdf file!`;
        this.pdfLoc = pdfLoc
    }
    async init(): Promise<BannerSheet> {
        if (this.wasInitiated) throw `Class "BannerSheet" has already been initiated!`;
        this.wasInitiated = true
        this.doc = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLoc), {updateMetadata: true})

        return this
    }
}

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
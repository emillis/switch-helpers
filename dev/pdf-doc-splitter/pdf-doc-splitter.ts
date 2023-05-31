import * as pdfLib from "pdf-lib";
import * as fs from "fs-extra";
import * as path from "path";

type docsToSave = {range: string, pdf: pdfLib.PDFDocument}

export class Splitter {
    private initialized: boolean = false;
    private readonly pdfLocation: string;
    private docToSplit: pdfLib.PDFDocument | undefined;
    private docsToSave: docsToSave[] = [];

    private wasInitialized() {
        if (!this.initialized) throw `Duplicator needs to be initialized using "init()" before using this method!`;
    }

    //Checks whether supplied pages are in a right format. This is mainly because you are allowed to use ranges, e.g. (5-9).
    private prettifySplitValue(val: string): number[] {
        if (!isNaN(+val)) {
            if (+val < 1) throw `Value "${val}" supplied cannot be less than 1!`;
            return [+val]
        }
        const results: number[] = [];

        const splitRange = `${val}`.split(`-`)
        if (splitRange.length !== 2) throw `Invalid range syntax "${val}" provided!`;
        const n1 = +splitRange[0];
        const n2 = +splitRange[1];
        if (isNaN(n1) || isNaN(n2)) throw `Both, "${n1}" and "${n2}" needs to be numbers!`;
        if (n2 <= n1) throw `In range "${val}", last number ${n2}" cannot be less or equal to the first number "${n1}"!`;
        if (n1 < 1) throw `In rage "${val}", first number "${n1}" cannot be less than 1!`;

        for (let i=n1; i<=n2; i++) results.push(i)

        return results
    }

    //This method splits PDF into documents with even number of sheets defined in `batchSize` parameter
    //options.batchNumberingType -  "range" defines the range that's been split. E.g. "1-20", "1001-2000", etc..
    //                              "sequential" adds sequence number to the batch split. E.g. "1", "2", "3", etc..
    //options.sequentialMinlength - Only needed if using `batchNumberingType`="sequential". This is the min width of the sequence number
    async splitToEqualBatches(batchSize: number, options?: {batchNumberingType?: "range" | "sequential", sequentialMinlength?: number}) {
        this.wasInitialized()
        if (!this.docToSplit) throw `Document is not assigned!`;

        options = options || {}
        if (options.batchNumberingType !== "range" && options.batchNumberingType !== "sequential") options.batchNumberingType = "range"
        if (!options.sequentialMinlength || typeof options.sequentialMinlength !== "number" || options.sequentialMinlength < 1) options.sequentialMinlength = 4

        const pageCount = this.docToSplit.getPageCount()

        const lengths: string[] = [];
        for (let i=1; i<=pageCount; i=i+batchSize) lengths.push(`${i}-${i+batchSize-1}`)

        const docsToSave = await this.split(lengths);
        for (let i=0; i<docsToSave.length; i++) {
            const docToSave = docsToSave[i];
            if (options.batchNumberingType === "sequential") {
                let seq: string = `${i+1}`;
                for (let j=0; seq.length<options.sequentialMinlength; j++) seq = `0${seq}`
                docToSave.range = seq
            }
            this.docsToSave.push(docToSave)
        }
    }

    //Using this method you can split PDF into multiple different PDF files. If the `split` parameter
    //is left empty, every page gets split. You can also specify a range of pages to be split, e.g.: "5-9".
    //So a full example of `split` parameter might look like this: [`1`, `16`, `18-20`, `22`, `35-40`]
    async splitToDefinedLengths(lengths: (string | number)[]) {
        this.wasInitialized()
        if (!this.docToSplit) throw `Document is not assigned!`;
        for (const entry of await this.split(lengths)) this.docsToSave.push(entry)
    }

    private async split(groups: (string | number)[]): Promise<docsToSave[]> {
        this.wasInitialized()
        if (!this.docToSplit) throw `Document is not assigned!`;

        const result: docsToSave[] = [];
        if (!groups.length) groups = this.docToSplit.getPageIndices().map(v=>{return v+1})
        const pageCount: number = this.docToSplit.getPageCount();
        for (const splitPages of groups) {
            const pages = this.prettifySplitValue(`${splitPages}`).filter(v=>v<=pageCount)
            if (!pages.length) continue;

            const newDoc = await pdfLib.PDFDocument.create();
            const pagesArray = await newDoc.copyPages(this.docToSplit, this.docToSplit.getPageIndices());
            for (const page of pages) newDoc.addPage(pagesArray[page-1])
            result.push({range: pages.length > 1 ? `${pages[0]}-${pages[pages.length-1]}` : `${pages[0]}`, pdf: newDoc})
        }
        return result
    }

    //This method saves the files in the location specified.
    //options.separator is the separator between file name and the page number/range that's been split
    async save(location: string, options?: {separator?: string}): Promise<string[]> {
        this.wasInitialized()
        if (!this.docToSplit) throw `Document is not assigned`;

        if (!location || !path.isAbsolute(location)) throw `Invalid location "${location}" provided as PDF saving location!`;
        const parsedLocation = path.parse(location);
        if (parsedLocation.ext !== ".pdf") {
            location = path.join(location, path.parse(this.pdfLocation).name)
        } else {
            location = path.join(parsedLocation.dir, parsedLocation.name)
        }

        const result: string[] = [];
        for (const docToSave of this.docsToSave) {
            const filePath: string = `${location}${options?.separator || `_`}${docToSave.range}.pdf`;
            fs.writeFileSync(filePath, await docToSave.pdf.save());
            result.push(filePath)
        }
        return result
    }

    constructor(pdfLocation: string) {
        this.pdfLocation = pdfLocation
        const ext = path.parse(this.pdfLocation).ext
        if (ext !== `.pdf`) throw `Only PDF files are allowed to Pdf Page Duplicator! Got "${ext}" file!`;
    }
    async init(): Promise<Splitter> {
        if (this.initialized) throw `Duplicator was already initialized!`;
        this.initialized = true;

        if (!fs.existsSync(this.pdfLocation)) throw `Pdf file does not exist in location "${this.pdfLocation}"!`;
        this.docToSplit = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLocation));

        return this
    }
}

// (new Splitter(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing/one.pdf`)).init().then(splitter=>{
//     //@ts-ignore
//     splitter.splitToEqualBatches(3, {batchNumberingType: `sequential`, sequentialMinlength: -5}).then(()=>{
//         splitter.save(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing`, {separator: `_`}).then(()=>{
//             console.log(`Saved!`);
//         })
//     })
// })

// (new Splitter(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing/one.pdf`)).init().then(splitter=>{
//     splitter.splitToDefinedLengths([1, 5, `7-10`]).then(()=>{
//         splitter.save(`C:/Users/service_switch/Desktop/Sample Artworks/Page Splitter Testing`, {separator: `_`}).then(()=>{
//             console.log(`Saved!`);
//         })
//     })
// })
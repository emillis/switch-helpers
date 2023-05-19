import * as pdfLib from "pdf-lib";
import * as fs from "fs-extra";
import * as path from "path";

export class Duplicator {
    private initialized: boolean = false;
    private readonly pdfLocation: string;
    private document: pdfLib.PDFDocument | undefined;

    private wasInitialized() {
        if (!this.initialized) throw `Duplicator needs to be initialized using "init()" before using this method!`;
    }

    //Checks whether supplied pages are in a right format. This is mainly because you are allowed to use ranges, e.g. (5-9).
    private prettifyPageArray(pages: string[]): number[] {
        let results: number[] = [];

        function splitRange(range: string): number[] {
            const result: number[] = [];
            const errMsg: string = `Invalid value "${range}" provided!`;
            const splitRange = range.split(`-`)
            if (splitRange.length !== 2) throw errMsg;
            const n1 = +splitRange[0];
            const n2 = +splitRange[1];
            if (isNaN(n1) || isNaN(n2)) throw errMsg;
            if (n2 <= n1) throw errMsg;
            if (n1 < 1) throw errMsg;

            for (let i=n1; i<=n2; i++) {
                result.push(i)
            }

            return result
        }

        for (const page of pages) {
            let n = +page;

            if (isNaN(n)) {
                results.push(...splitRange(page))
                continue
            }

            results.push(n)
        }

        return results
    }

    //Duplicate the whole document for a number of times. This method will duplicate in a pattern of "123, 123, 123..."
    async duplicateWholeDocument(copies: number) {
        this.wasInitialized()
        if (!this.document) throw `Document is not assigned!`;
        const pagesArray = await this.document.copyPages(this.document, this.document.getPageIndices());
        for (let i=1; i<copies; i++) for (const page of pagesArray) this.document.addPage(page)
    }

    //This method allows to duplicate specific pages, but in a pattern of "111, 222, 333...". If the `duplicatePages`
    //array is left empty, every page gets duplicated. You can also specify a range of pages to be duplicated, e.g.: "5-9".
    //So a full example of `duplicatePages` might look like this: [`1`, `16`, `18-20`, `22`, `35-40`]
    async duplicateIndividualPages(duplicatePages: string[], copies: number) {
        this.wasInitialized()
        if (!this.document) throw `Document is not assigned!`;
        const pages = this.prettifyPageArray(duplicatePages);

        const newDocument: pdfLib.PDFPage[][] = [];

        //Copying all available pages from original PDF and saving them in the memory
        for (const page of await this.document.copyPages(this.document, this.document.getPageIndices())) newDocument.push([page])

        //This line check whether the pages to duplicate were supplied and if not, it assigns every page to be duplicated
        if (!pages.length) for (let i=1; i<=newDocument.length; i++) pages.push(i)

        //This is what actually duplicates the pages. It makes each page's array with the right amount of copies
        for (let i=1; i<copies; i++) for (let pageIndex of pages) {
            const pageArray = newDocument[pageIndex - 1];
            if (!pageArray || !pageArray.length) continue;
            pageArray.push(pageArray[0])
        }

        //Removing all pages from original PDF
        for (let i=(this.document.getPageCount() - 1); i>=0; i--) this.document.removePage(i)

        //Adding all pages back into the original PDF
        for (const documentPages of newDocument) for (const documentPage of documentPages) this.document.addPage(documentPage)
    }

    //This method saves the files in the location specified
    async save(location: string) {
        this.wasInitialized()
        if (!this.document) throw `Document is not assigned`;

        if (!location || !path.isAbsolute(location)) throw `Invalid location "${location}" provided as PDF saving location!`;
        if (path.parse(location).ext !== ".pdf") location = path.join(location, path.parse(this.pdfLocation).base)

        fs.writeFileSync(location, await this.document.save());
    }

    constructor(pdfLocation: string) {
        this.pdfLocation = pdfLocation
    }
    async init(): Promise<Duplicator> {
        if (this.initialized) throw `Duplicator was already initialized!`;
        this.initialized = true;

        if (!fs.existsSync(this.pdfLocation)) throw `Pdf file does not exist in location "${this.pdfLocation}"!`;
        this.document = await pdfLib.PDFDocument.load(fs.readFileSync(this.pdfLocation));

        return this
    }
}
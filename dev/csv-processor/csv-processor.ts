import * as fs from "fs-extra";
import {default as csvReadableStream, Options as readingOptions} from "csv-reader";
import * as path from "path";

function makeOptionsReasonable(opt?: readingOptions): readingOptions {
    if (!opt) opt = {};

    if (opt.parseNumbers === undefined) opt.parseNumbers = true;
    if (opt.parseBooleans === undefined) opt.parseBooleans = true;
    if (opt.trim === undefined) opt.trim = true;

    return opt
}

export class CsvProcessor {
    private readonly csvFileLocation: string;
    private readonly options: readingOptions;
    private originalCsvFile: string[][] = [];
    private initiated: boolean = false;

    //Throws an error if class has not been initiated
    private wasInitiated() {
        if (!this.initiated) throw `Class "CsvProcessor" needs to be initiated using .init() before using any method!`;
    }

    private async readCsvFile(location: string, options: readingOptions): Promise<string[][]> {
        return new Promise(resolve=>{
            const inputStream = fs.createReadStream(location, "utf-8")

            const result: string[][] = [];

            inputStream
                .pipe(new csvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
                .on('data', function (row) {
                    result.push(<string[]>row);
                })
                .on('error', function (e) {
                    throw e
                })
                .on('end', function () {
                    resolve(result)
                });
        })
    }

    //Returns the entire `originalCsvFile`
    getOriginalCsvFile(): string[][] {
        this.wasInitiated()
        return this.originalCsvFile
    }

    //Returns first array (row) within `originalCsvFile`
    getHeaders(): string[] {
        this.wasInitiated()
        return this.originalCsvFile[0] || []
    }

    //Returns the `originalCsvFile` as Object. For this to work, the csv file needs to have headers
    toObject(): {[header: string]: string | number}[] {
        this.wasInitiated()

        const result: {[header: string]: string | number}[] = []

        const headers = this.originalCsvFile[0];

        for (let i=1; i<this.originalCsvFile.length; i++) {
            const row = this.originalCsvFile[i];
            const resultEntry: {[header: string]: string | number} = {};

            for (let j=0; j<row.length; j++) {
                resultEntry[headers[j]] = row[j]
            }

            result.push(resultEntry)
        }

        return result
    }

    constructor(csvFileLoc: string, readingOptions?: readingOptions) {
        if (path.parse(csvFileLoc).ext !== ".csv") throw `File supplied "${csvFileLoc}" is not a ".csv" file!`;

        this.csvFileLocation = csvFileLoc;
        this.options = makeOptionsReasonable(readingOptions);
    }
    async init(this: CsvProcessor): Promise<CsvProcessor> {
        if (this.initiated) throw `Class "CsvProcessor" has already been initiated!`;

        this.originalCsvFile = await this.readCsvFile(this.csvFileLocation, this.options)
        this.initiated = true
        return this
    }
}

// (new CsvProcessor("C:/Users/service_switch/Desktop/csv-processor-test.csv", { parseNumbers: true, parseBooleans: true, trim: true })).init().then(cp=>{
//     // console.log(cp.getOriginalCsvFile());
//     console.log(cp.toObject());
// });
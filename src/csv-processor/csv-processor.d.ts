import { Options as readingOptions } from "csv-reader";
export declare class CsvProcessor {
    private readonly csvFileLocation;
    private readonly options;
    private originalCsvFile;
    private initiated;
    private wasInitiated;
    private readCsvFile;
    getOriginalCsvFile(): string[][];
    getHeaders(): string[];
    toObject(): {
        [header: string]: string | number;
    }[];
    constructor(csvFileLoc: string, readingOptions?: readingOptions);
    init(this: CsvProcessor): Promise<CsvProcessor>;
}

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs-extra"));
const csv_reader_1 = __importDefault(require("csv-reader"));
const path = __importStar(require("path"));
function makeOptionsReasonable(opt) {
    if (!opt)
        opt = {};
    if (opt.parseNumbers === undefined)
        opt.parseNumbers = true;
    if (opt.parseBooleans === undefined)
        opt.parseBooleans = true;
    if (opt.trim === undefined)
        opt.trim = true;
    return opt;
}
class CsvProcessor {
    csvFileLocation;
    options;
    originalCsvFile = [];
    initiated = false;
    //Throws an error if class has not been initiated
    wasInitiated() {
        if (!this.initiated)
            throw `Class "CsvProcessor" needs to be initiated using .init() before using any method!`;
    }
    async readCsvFile(location, options) {
        return new Promise(resolve => {
            const inputStream = fs.createReadStream(location, "utf-8");
            const result = [];
            inputStream
                .pipe(new csv_reader_1.default({ parseNumbers: true, parseBooleans: true, trim: true }))
                .on('data', function (row) {
                result.push(row);
            })
                .on('error', function (e) {
                throw e;
            })
                .on('end', function () {
                resolve(result);
            });
        });
    }
    //Returns the entire `originalCsvFile`
    getOriginalCsvFile() {
        this.wasInitiated();
        return this.originalCsvFile;
    }
    //Returns first array (row) within `originalCsvFile`
    getHeaders() {
        this.wasInitiated();
        return this.originalCsvFile[0] || [];
    }
    //Returns the `originalCsvFile` as Object. For this to work, the csv file needs to have headers
    toObject() {
        this.wasInitiated();
        const result = [];
        const headers = this.originalCsvFile[0];
        for (let i = 1; i < this.originalCsvFile.length; i++) {
            const row = this.originalCsvFile[i];
            const resultEntry = {};
            for (let j = 0; j < row.length; j++) {
                resultEntry[headers[j]] = row[j];
            }
            result.push(resultEntry);
        }
        return result;
    }
    constructor(csvFileLoc, readingOptions) {
        if (path.parse(csvFileLoc).ext !== ".csv")
            throw `File supplied "${csvFileLoc}" is not a ".csv" file!`;
        this.csvFileLocation = csvFileLoc;
        this.options = makeOptionsReasonable(readingOptions);
    }
    async init() {
        if (this.initiated)
            throw `Class "CsvProcessor" has already been initiated!`;
        this.originalCsvFile = await this.readCsvFile(this.csvFileLocation, this.options);
        this.initiated = true;
        return this;
    }
}
// (new CsvProcessor("C:/Users/service_switch/Desktop/csv-processor-test.csv", { parseNumbers: true, parseBooleans: true, trim: true })).init().then(cp=>{
//     // console.log(cp.getOriginalCsvFile());
//     console.log(cp.toObject());
// });

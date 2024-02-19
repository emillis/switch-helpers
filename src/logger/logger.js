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
exports.Logger = exports.allowedLogTypes = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
exports.allowedLogTypes = { JSON: "json" };
class JSONWriter {
    uriEncode;
    //Writes data to the stream as a string and returns a number of bytes written
    write(stream, data) {
        const newObj = {};
        for (const key of Object.keys(data))
            newObj[this.uriEncode ? encodeURI(`${key}`) : `${key}`] = this.uriEncode ? encodeURI(`${data[key]}`) : `${data[key]}`;
        let str = `${JSON.stringify(newObj)},\r\n`;
        stream.write(str, "utf-8");
        return str.length;
    }
    constructor(uriEncodeValues) {
        this.uriEncode = uriEncodeValues;
    }
}
class Logger {
    rootLoc;
    logID;
    logExt;
    options;
    isInitiated = false;
    writer;
    writeStream;
    openLogFileStats;
    wasInitiated() {
        if (!this.isInitiated)
            throw `You must initiate Logger using its method .init() before using any other functionality!`;
    }
    //Composes the actual file name
    composeName(index) {
        return `${this.logID}-${index}${this.logExt}`;
    }
    logFileMatchesConditions(fileStats) {
        if (fileStats.size > this.options.maxLogSize)
            return false;
        return true;
    }
    //Gets the very latest log file generated
    getLatestLogFile() {
        const potentialMatches = [];
        const dirent = fs.readdirSync(this.rootLoc, { withFileTypes: true, encoding: "utf-8" });
        for (const d of dirent)
            if (d.isFile() && d.name && d.name.includes(this.logID))
                potentialMatches.push(d.name);
        let name = this.composeName(1);
        for (let i = 2; true; i++) {
            if (potentialMatches.includes(this.composeName(i))) {
                name = this.composeName(i);
                continue;
            }
            break;
        }
        const fullLoc = path.join(this.rootLoc, name);
        if (!fs.existsSync(fullLoc))
            fs.createFileSync(fullLoc);
        return fullLoc;
    }
    //Checks for existing files withing the root location and changes new log file name accordingly
    generateNewLogName() {
        const existingFiles = [];
        const dirent = fs.readdirSync(this.rootLoc, { withFileTypes: true, encoding: "utf-8" });
        for (const d of dirent)
            if (d.isFile() && d.name)
                existingFiles.push(d.name);
        let fileIndex = 1;
        let fileName = this.composeName(fileIndex);
        for (; true;) {
            if (!existingFiles.includes(fileName))
                break;
            fileIndex = fileIndex + 1;
            fileName = this.composeName(fileIndex);
        }
        const fullLoc = path.join(this.rootLoc, fileName);
        if (!fs.existsSync(fullLoc))
            fs.createFileSync(fullLoc);
        return fullLoc;
    }
    processLoggerOptions(options) {
        const result = {
            maxLogSize: options?.maxLogSize || 100000000000,
            writer: options?.writer,
            uriEncodeWrittenValues: !!options?.uriEncodeWrittenValues,
            logType: options?.logType || exports.allowedLogTypes.JSON,
            omitAutoTimeStamp: options?.omitAutoTimeStamp === undefined ? false : options.omitAutoTimeStamp,
            autoTimeStampKey: options?.autoTimeStampKey || `created`
        };
        return result;
    }
    async openLogFile(logFileLoc) {
        if (!this.logFileMatchesConditions({ size: this.openLogFileStats?.size || 0 })) {
            logFileLoc = this.generateNewLogName();
            this.openLogFileStats = fs.lstatSync(logFileLoc);
        }
        return fs.createWriteStream(logFileLoc, {
            encoding: "utf-8",
            flags: 'as',
            mode: 0o777
        });
    }
    getWriteStream() {
        return this.writeStream;
    }
    async write(data) {
        if (!this.writer || !this.writeStream || !this.openLogFileStats)
            throw `Some resources have not been initialized! Could be "writer", "writeStream", or "openLogFileStats"`;
        if (!this.options.omitAutoTimeStamp)
            data[this.options.autoTimeStampKey] = new Date(Date.now() + 3600000).toISOString();
        const bytesWritten = this.writer.write(this.writeStream, data);
        this.openLogFileStats.size += bytesWritten;
        if (!this.logFileMatchesConditions({ size: this.openLogFileStats.size })) {
            const loc = this.generateNewLogName();
            this.openLogFileStats = fs.lstatSync(loc);
            this.writeStream = await this.openLogFile(loc);
        }
        try {
            this.writeStream.close();
        }
        catch { }
    }
    constructor(rootLocation, id, options) {
        if (!fs.pathExistsSync(rootLocation))
            throw `Root location "${rootLocation}" for logs does not exist!`;
        if (!fs.lstatSync(rootLocation).isDirectory())
            throw `Expected a directory to be provided as root location, got "${rootLocation}"!`;
        if (!path.isAbsolute(rootLocation))
            throw `Root location provided to Logger "${rootLocation}" must be an absolute path!`;
        this.rootLoc = rootLocation;
        if (!id)
            throw `Log ID "${id}" is invalid!`;
        this.logID = `${id}`;
        this.logExt = `.txt`;
        this.options = this.processLoggerOptions(options);
    }
    async init() {
        if (this.isInitiated)
            throw `The logger has already been initiated!`;
        this.isInitiated = true;
        let latestLogFile = this.getLatestLogFile();
        this.openLogFileStats = fs.lstatSync(latestLogFile);
        this.writeStream = await this.openLogFile(latestLogFile);
        this.writer = this.options?.writer || new JSONWriter(this.options.uriEncodeWrittenValues);
        return this;
    }
}
exports.Logger = Logger;
// const linesToAdd: number = 100000;
// new Logger(`C:\\Users\\service_switch\\Desktop\\Sample Artworks\\Logger testing`, `test`, {maxLogSize: 1500000}).init().then(logger=>{
//     const startedTime = Date.now();
//     let i=0;
//
//     function iterate(l: Logger) {
//         i++
//         if (i>linesToAdd) {
//             const finishedTime = Date.now();
//             console.log(`Added "${linesToAdd}" lines to the log file and it took "${finishedTime-startedTime}ms" to perform this action.`);
//             return
//         }
//         l.write({
//             key1: `value-${i}`,
//             key2: `value-${i}`,
//             key3: `value-${i}`,
//             key4: `value-${i}`,
//             key5: `value-${i}`
//         }).then(()=>{
//             iterate(l)
//         })
//     }
//
//     iterate(logger)
// })

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
exports.Logger = exports.logFormat = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const main_1 = require("../main");
exports.logFormat = { Json: "Json", Txt: "Txt" };
function makeLoggerOptionsReasonable(options) {
    options = options || {};
    const allowedLogFormats = Object.values(exports.logFormat);
    options.logFormat = options.logFormat === undefined ? exports.logFormat.Json : options.logFormat;
    if (!allowedLogFormats.includes(options.logFormat)) {
        throw `Invalid log format "${options.logFormat}" selected! Allowed values are: "${allowedLogFormats.join(`", "`)}"`;
    }
    options.createLocationIfDoesntExist = options.createLocationIfDoesntExist === undefined ? false : options.createLocationIfDoesntExist;
    options.logExt = options.logExt === undefined ? (options.logFormat === exports.logFormat.Json ? ".json" : options.logFormat === exports.logFormat.Txt ? ".txt" : ".tag") : `${options.logExt}`;
    if (options.logExt.substring(0, 1) !== ".") {
        options.logExt = `.${options.logExt}`;
    }
    options.logNaming = options.logNaming === undefined ? "logs" : `${options.logNaming}`;
    options.maxSingleLogFileSize = options.maxSingleLogFileSize === undefined ? 10000000 : +options.maxSingleLogFileSize;
    return options;
}
class JsonEntry {
    entries = [];
    //Adds an entry to the log file and returns number of bytes added
    add(entry) {
        const le = {
            msg: entry,
            datetime: main_1.NameGenerator.newDate({ format: "YYYY-MM-DD hh:mm:ss.SSS" })
        };
        this.entries.push(le);
    }
    save(location) {
        const currentFile = [...JSON.parse(fs.readFileSync(location, "utf-8") || "[]"), ...this.entries];
        fs.writeFileSync(location, JSON.stringify(currentFile), "utf-8");
    }
}
class TxtEntry {
    entries = [];
    //Adds an entry to the log file and returns number of bytes added
    add(entry) {
        this.entries.push(`Datetime: "${main_1.NameGenerator.newDate({ format: "YYYY-MM-DD hh:mm:ss.SSS" }).replaceAll(";", "\;")}"; Msg: "${`${entry}`.replaceAll(";", "\\;")}"\n`);
    }
    save(location) {
        fs.appendFileSync(location, this.entries.join(""), "utf-8");
    }
}
class Logger {
    options;
    logDirectory;
    logFileName;
    logExt;
    fullLogFilePath;
    logFile;
    adder;
    saver;
    logFileMatchesConditions(location) {
        let result = true;
        if (!fs.existsSync(location))
            throw `Log file "${location}" does not exist!`;
        const stats = fs.statSync(location);
        if (!stats.isFile())
            throw `Log file expected, got folder "${location}"!`;
        if (stats.size > (this.options.maxSingleLogFileSize || 10000000))
            result = false;
        return result;
    }
    getCurrentLogFileLocation() {
        let index = 0;
        const fileName = this.options.logNaming || "";
        let logName = "";
        let fullPath = "";
        while (true) {
            index++;
            logName = `${fileName}-${index}${this.logExt}`;
            const tmpFullPath = path.join(this.logDirectory, logName);
            if (fs.existsSync(tmpFullPath)) {
                fullPath = tmpFullPath;
                continue;
            }
            //This will run only if there are no log files present
            if (!fullPath) {
                fullPath = tmpFullPath;
                fs.createFileSync(fullPath);
            }
            if (!this.logFileMatchesConditions(fullPath)) {
                fullPath = tmpFullPath;
                fs.createFileSync(fullPath);
                continue;
            }
            break;
        }
        if (!fileName || !logName || !fullPath) {
            throw `Either wrong file name, generated name or full path provided! File name: "${fileName}", generated name: "${logName}", full path: "${fullPath}"`;
        }
        return fullPath;
    }
    add(entry) {
        this.adder.add(entry);
    }
    saveFile() {
        this.saver.save(this.fullLogFilePath, this.logFile);
    }
    constructor(logLocation, options) {
        this.options = makeLoggerOptionsReasonable(options);
        this.logExt = this.options.logExt || ".tag";
        this.logFileName = this.options.logNaming || "logs";
        this.logDirectory = logLocation;
        if (!this.logDirectory) {
            throw `Invalid log file location "${this.logDirectory}" provided!`;
        }
        //Creating directory or throwing an error if the dir doesn't exist
        if (!fs.existsSync(this.logDirectory)) {
            if (!this.options.createLocationIfDoesntExist)
                throw `Log directory "${this.logDirectory}" does not exist!`;
            fs.mkdirsSync(this.logDirectory);
        }
        this.fullLogFilePath = this.getCurrentLogFileLocation();
        if (this.options.logFormat === exports.logFormat.Json) {
            const jsonHandler = new JsonEntry();
            this.adder = jsonHandler;
            this.saver = jsonHandler;
        }
        else if (this.options.logFormat === exports.logFormat.Txt) {
            const txtHandler = new TxtEntry();
            this.adder = txtHandler;
            this.saver = txtHandler;
        }
        else {
            throw `Log format "${this.options.logFormat}" is not allowed! Allowed log formats are: "${Object.values(exports.logFormat).join(`", "`)}"`;
        }
    }
}
exports.Logger = Logger;

import * as path from "path";
import * as fs from "fs-extra";
import {NameGenerator} from "../main"

export const logFormat = {Json: "Json", Txt: "Txt"} as const;
export type logFormat = typeof logFormat[keyof typeof logFormat];

type loggerOptions = {
    logFormat?: logFormat,
    createLocationIfDoesntExist?: boolean
    logExt?: string
    logNaming?: string
    maxSingleLogFileSize?: number
}
function makeLoggerOptionsReasonable(options?: loggerOptions): loggerOptions {
    options = options || {}

    const allowedLogFormats = Object.values(logFormat);

    options.logFormat = options.logFormat === undefined ? logFormat.Json : options.logFormat
    if (!allowedLogFormats.includes(options.logFormat)) {throw `Invalid log format "${options.logFormat}" selected! Allowed values are: "${allowedLogFormats.join(`", "`)}"`}
    options.createLocationIfDoesntExist = options.createLocationIfDoesntExist === undefined ? false : options.createLocationIfDoesntExist
    options.logExt = options.logExt === undefined ? (options.logFormat === logFormat.Json ? ".json" : options.logFormat === logFormat.Txt ? ".txt" : ".tag") : `${options.logExt}`
    if (options.logExt.substring(0, 1) !== ".") {options.logExt = `.${options.logExt}`}
    options.logNaming = options.logNaming === undefined ? "logs" : `${options.logNaming}`
    options.maxSingleLogFileSize = options.maxSingleLogFileSize === undefined ? 10000000 : +options.maxSingleLogFileSize

    return options
}

type logEntry = {
    datetime: string
    msg: string
    customFields?: {any: any}
}
type logFile = any[]

interface Adder {
    add(entry: string): void
}
interface Saver {
    save(location: string, logFile: logFile): void
}

class JsonEntry implements Adder, Saver{
    private entries: logEntry[] = [];

    //Adds an entry to the log file and returns number of bytes added
    add (entry: string) {
        const le: logEntry = {
            msg: entry,
            datetime: NameGenerator.newDate({format: "YYYY-MM-DD hh:mm:ss.SSS"})
        }

        this.entries.push(le);
    }

    save(location: string) {
        const currentFile: logEntry[] = [...JSON.parse(fs.readFileSync(location, "utf-8") || "[]"), ...this.entries];

        fs.writeFileSync(location, JSON.stringify(currentFile), "utf-8")
    }
}
class TxtEntry implements Adder, Saver{
    private entries: string[] = [];

    //Adds an entry to the log file and returns number of bytes added
    add (entry: string) {
        this.entries.push(`Datetime: "${NameGenerator.newDate({format: "YYYY-MM-DD hh:mm:ss.SSS"}).replaceAll(";", "\;")}"; Msg: "${`${entry}`.replaceAll(";", "\\;")}"\n`);
    }

    save(location: string) {
        fs.appendFileSync(location, this.entries.join(""), "utf-8")
    }
}

export class Logger {
    private readonly options: loggerOptions;
    private readonly logDirectory: string;
    private readonly logFileName: string;
    private readonly logExt: string;
    private readonly fullLogFilePath: string;
    private readonly logFile: any;
    private readonly adder: Adder;
    private readonly saver: Saver;

    private logFileMatchesConditions(location: string): boolean {
        let result = true;

        if (!fs.existsSync(location)) throw `Log file "${location}" does not exist!`
        const stats = fs.statSync(location);
        if (!stats.isFile()) throw `Log file expected, got folder "${location}"!`
        if (stats.size > (this.options.maxSingleLogFileSize || 10000000)) result = false

        return result;
    }

    private getCurrentLogFileLocation(): string {
        let index = 0;
        const fileName = this.options.logNaming || "";
        let logName = "";
        let fullPath = "";

        while (true) {
            index++;
            logName = `${fileName}-${index}${this.logExt}`;
            const tmpFullPath = path.join(this.logDirectory, logName);

            if (fs.existsSync(tmpFullPath)) {
                fullPath = tmpFullPath
                continue
            }

            //This will run only if there are no log files present
            if (!fullPath) {
                fullPath = tmpFullPath;
                fs.createFileSync(fullPath);
            }

            if (!this.logFileMatchesConditions(fullPath)) {
                fullPath = tmpFullPath;
                fs.createFileSync(fullPath);
                continue
            }

            break
        }

        if (!fileName || !logName || !fullPath) {throw `Either wrong file name, generated name or full path provided! File name: "${fileName}", generated name: "${logName}", full path: "${fullPath}"`}

        return fullPath
    }

    add(entry: string) {
        this.adder.add(entry)
    }

    saveFile() {
        this.saver.save(this.fullLogFilePath, this.logFile);
    }

    constructor(logLocation: string, options?: loggerOptions) {
        this.options = makeLoggerOptionsReasonable(options);

        this.logExt = this.options.logExt || ".tag";
        this.logFileName = this.options.logNaming || "logs";
        this.logDirectory = logLocation;

        if (!this.logDirectory) {throw `Invalid log file location "${this.logDirectory}" provided!`}

        //Creating directory or throwing an error if the dir doesn't exist
        if (!fs.existsSync(this.logDirectory)) {
            if (!this.options.createLocationIfDoesntExist) throw `Log directory "${this.logDirectory}" does not exist!`

            fs.mkdirsSync(this.logDirectory);
        }

        this.fullLogFilePath = this.getCurrentLogFileLocation();

        if (this.options.logFormat === logFormat.Json) {
            const jsonHandler = new JsonEntry();
            this.adder = jsonHandler;
            this.saver = jsonHandler;
        } else if (this.options.logFormat === logFormat.Txt) {
            const txtHandler = new TxtEntry();
            this.adder = txtHandler;
            this.saver = txtHandler;
        } else {
            throw `Log format "${this.options.logFormat}" is not allowed! Allowed log formats are: "${Object.values(logFormat).join(`", "`)}"`
        }
    }
}
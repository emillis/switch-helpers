import * as fs from "fs-extra"
import * as path from "path"

export const allowedLogTypes = {JSON: "json"} as const;
export type allowedLogTypes = typeof allowedLogTypes[keyof typeof allowedLogTypes];

type writeData = { [key: string]: string }
type fileStats = { size: number }

export interface Writer {
    write(stream: fs.WriteStream, data: { [k: string]: string }): number
}

class JSONWriter implements Writer {
    private readonly uriEncode: boolean;

    //Writes data to the stream as a string and returns a number of bytes written
    write(stream: fs.WriteStream, data: writeData): number {
        const newObj: writeData = {}

        for (const key of Object.keys(data)) newObj[this.uriEncode ? encodeURI(`${key}`) : `${key}`] = this.uriEncode ? encodeURI(`${data[key]}`) : `${data[key]}`

        let str = `${JSON.stringify(newObj)},\r\n`

        stream.write(str, "utf-8")
        return str.length
    }

    constructor(uriEncodeValues: boolean) {
        this.uriEncode = uriEncodeValues
    }
}

export type loggerOptions = {
    maxLogSize?: number              //Max log file size in bytes, default is 10000000 (10MB)
    writer?: Writer              //This allows client to define their own custom writer and thus control how you'll see the logs
    uriEncodeWrittenValues?: boolean             //If set to true, key and value that's being written into the file get uri encoded
    logType?: allowedLogTypes     //Defines the type of the log - json, txt, xml, etc..
    omitAutoTimeStamp?: boolean             //If set to true, generates a time stamp automatically. Default is `true`
    autoTimeStampKey?: string              //Key of the auto time stamp. Default is `created`
}
type loggerOptionsInternal = {
    maxLogSize: number
    writer?: Writer
    uriEncodeWrittenValues: boolean
    logType: allowedLogTypes
    omitAutoTimeStamp: boolean
    autoTimeStampKey: string
}

export class Logger {
    private readonly rootLoc: string;
    private readonly logID: string;
    private readonly logExt: string;
    private readonly options: loggerOptionsInternal;
    private isInitiated: boolean = false;
    private writer: Writer | undefined;
    private writeStream: fs.WriteStream | undefined;
    private openLogFileStats: fs.Stats | undefined;

    private wasInitiated() {
        if (!this.isInitiated) throw `You must initiate Logger using its method .init() before using any other functionality!`;
    }

    //Composes the actual file name
    private composeName(index?: number): string {
        return `${this.logID}-${index}${this.logExt}`
    }

    private logFileMatchesConditions(fileStats: fileStats): boolean {
        if (fileStats.size > this.options.maxLogSize) return false

        return true
    }

    //Gets the very latest log file generated
    private getLatestLogFile(): string {
        const potentialMatches: string[] = [];
        const dirent = fs.readdirSync(this.rootLoc, {withFileTypes: true, encoding: "utf-8"})
        for (const d of dirent) if (d.isFile() && d.name && d.name.includes(this.logID)) potentialMatches.push(d.name)

        let name: string = this.composeName(1);
        for (let i = 2; true; i++) {
            if (potentialMatches.includes(this.composeName(i))) {
                name = this.composeName(i)
                continue
            }
            break
        }

        const fullLoc = path.join(this.rootLoc, name);

        if (!fs.existsSync(fullLoc)) fs.createFileSync(fullLoc)

        return fullLoc
    }

    //Checks for existing files withing the root location and changes new log file name accordingly
    private generateNewLogName(): string {
        const existingFiles: string[] = [];
        const dirent = fs.readdirSync(this.rootLoc, {withFileTypes: true, encoding: "utf-8"})

        for (const d of dirent) if (d.isFile() && d.name) existingFiles.push(d.name)

        let fileIndex: number = 1;
        let fileName: string = this.composeName(fileIndex);
        for (; true;) {
            if (!existingFiles.includes(fileName)) break

            fileIndex = fileIndex + 1
            fileName = this.composeName(fileIndex)
        }

        const fullLoc = path.join(this.rootLoc, fileName);

        if (!fs.existsSync(fullLoc)) fs.createFileSync(fullLoc)

        return fullLoc
    }

    private processLoggerOptions(options?: loggerOptions): loggerOptionsInternal {
        const result: loggerOptionsInternal = {
            maxLogSize: options?.maxLogSize || 100000000000, //100GB by default
            writer: options?.writer,
            uriEncodeWrittenValues: !!options?.uriEncodeWrittenValues,
            logType: options?.logType || allowedLogTypes.JSON,
            omitAutoTimeStamp: options?.omitAutoTimeStamp === undefined ? false : options.omitAutoTimeStamp,
            autoTimeStampKey: options?.autoTimeStampKey || `created`
        };

        return result
    }

    private async openLogFile(logFileLoc: string): Promise<fs.WriteStream> {
        if (!this.logFileMatchesConditions({size: this.openLogFileStats?.size || 0})) {
            logFileLoc = this.generateNewLogName();
            this.openLogFileStats = fs.lstatSync(logFileLoc)
        }

        return fs.createWriteStream(logFileLoc, {
            encoding: "utf-8",
            autoClose: true,
            flags: 'as'
        })
    }

    getWriteStream(): fs.WriteStream | undefined {
        return this.writeStream
    }

    async write(data: writeData) {
        if (!this.writer || !this.writeStream || !this.openLogFileStats) throw `Some resources have not been initialized! Could be "writer", "writeStream", or "openLogFileStats"`;

        if (!this.options.omitAutoTimeStamp) data[this.options.autoTimeStampKey] = new Date().toISOString()

        const bytesWritten = this.writer.write(this.writeStream, data)

        this.openLogFileStats.size += bytesWritten

        if (!this.logFileMatchesConditions({size: this.openLogFileStats.size})) {
            const loc = this.generateNewLogName();
            this.openLogFileStats = fs.lstatSync(loc)
            this.writeStream = await this.openLogFile(loc)
        }
    }

    constructor(rootLocation: string, id: string, options?: loggerOptions) {
        if (!fs.pathExistsSync(rootLocation)) throw `Root location "${rootLocation}" for logs does not exist!`;
        if (!fs.lstatSync(rootLocation).isDirectory()) throw `Expected a directory to be provided as root location, got "${rootLocation}"!`;
        if (!path.isAbsolute(rootLocation)) throw `Root location provided to Logger "${rootLocation}" must be an absolute path!`;
        this.rootLoc = rootLocation

        if (!id) throw `Log ID "${id}" is invalid!`;
        this.logID = `${id}`

        this.logExt = `.txt`;

        this.options = this.processLoggerOptions(options)
    }

    async init(): Promise<Logger> {
        if (this.isInitiated) throw `The logger has already been initiated!`;
        this.isInitiated = true

        let latestLogFile = this.getLatestLogFile()
        this.openLogFileStats = fs.lstatSync(latestLogFile)

        this.writeStream = await this.openLogFile(latestLogFile)

        this.writer = this.options?.writer || new JSONWriter(this.options.uriEncodeWrittenValues);

        return this
    }
}

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
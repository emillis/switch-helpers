/// <reference types="node" />
import * as fs from "fs-extra";

export declare const allowedLogTypes: {
    readonly JSON: "json";
};
export type allowedLogTypes = typeof allowedLogTypes[keyof typeof allowedLogTypes];
export type writeData = {
    [key: string]: string;
};

export interface Writer {
    write(stream: fs.WriteStream, data: {
        [k: string]: string;
    }): number;
}

export type loggerOptions = {
    maxLogSize?: number;
    writer?: Writer;
    uriEncodeWrittenValues?: boolean;
    logType?: allowedLogTypes;
    omitAutoTimeStamp?: boolean;
    autoTimeStampKey?: string;
};
export declare class Logger {
    private readonly rootLoc;
    private readonly logID;
    private readonly logExt;
    private readonly options;
    private isInitiated;
    private writer;
    private writeStream;
    private openLogFileStats;
    private wasInitiated;
    private composeName;
    private logFileMatchesConditions;
    private getLatestLogFile;
    private generateNewLogName;
    private processLoggerOptions;
    private openLogFile;
    getWriteStream(): fs.WriteStream | undefined;
    write(data: writeData): Promise<void>;
    constructor(rootLocation: string, id: string, options?: loggerOptions);
    init(): Promise<Logger>;
}

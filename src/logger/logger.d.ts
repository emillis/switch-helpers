export declare const logFormat: {
    readonly Json: "Json";
    readonly Txt: "Txt";
};
export declare type logFormat = typeof logFormat[keyof typeof logFormat];
declare type loggerOptions = {
    logFormat?: logFormat;
    createLocationIfDoesntExist?: boolean;
    logExt?: string;
    logNaming?: string;
    maxSingleLogFileSize?: number;
};
export declare class Logger {
    private readonly options;
    private readonly logDirectory;
    private readonly logFileName;
    private readonly logExt;
    private readonly fullLogFilePath;
    private readonly logFile;
    private readonly adder;
    private readonly saver;
    private logFileMatchesConditions;
    private getCurrentLogFileLocation;
    add(entry: string): void;
    saveFile(): void;
    constructor(logLocation: string, options?: loggerOptions);
}
export {};

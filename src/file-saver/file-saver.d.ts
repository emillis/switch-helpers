/// <reference types="node" />
import * as fs from "fs-extra";
export declare const fileExistOptions: {
    readonly override: "override";
    readonly addVersionNumber: "addVersionNumber";
    readonly addDateTimeSuffix: "addDateTimeSuffix";
    readonly fail: "fail";
};
export type fileExistOptions = typeof fileExistOptions[keyof typeof fileExistOptions];
export type options = {
    createFoldersRecursively?: boolean;
    ifFileExist?: fileExistOptions;
    versionNumberPrefix?: string;
};
export declare class FileSaver {
    private readonly options;
    private handleExistingFile;
    save(fullPath: string, data: string, options?: fs.WriteFileOptions | undefined): string;
    constructor(options?: options);
}

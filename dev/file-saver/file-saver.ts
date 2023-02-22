import {NameGenerator} from "../main";
import * as path from "path";
import * as fs from "fs-extra";

export const fileExistOptions = {override: "override", addVersionNumber: "addVersionNumber", addDateTimeSuffix: "addDateTimeSuffix", fail: "fail"} as const;
export type fileExistOptions = typeof fileExistOptions[keyof typeof fileExistOptions];

export type options = {
    createFoldersRecursively?: boolean
    ifFileExist?: fileExistOptions
    versionNumberPrefix?: string
}

function makeOptionsReasonable(options?: options): options {
    options = options || {}

    options.createFoldersRecursively = options.createFoldersRecursively === undefined ? true : options.createFoldersRecursively;
    options.ifFileExist = options.ifFileExist === undefined ? fileExistOptions.addVersionNumber : options.ifFileExist;
    options.versionNumberPrefix = options.versionNumberPrefix === undefined ? "_v" : options.versionNumberPrefix;

    return options
}

export class FileSaver {
    private readonly options: options;

    private handleExistingFile(parsedPath: path.ParsedPath): string {
        if (this.options.ifFileExist === fileExistOptions.fail) {throw `File named "${parsedPath.base}" already exist in "${parsedPath.dir}"!`}
        if (this.options.ifFileExist === fileExistOptions.override) {return parsedPath.base}

        const originalBase = parsedPath.base;
        let vn = 0;

        while (fs.existsSync(path.join(parsedPath.dir, parsedPath.base))) {
            parsedPath.base = originalBase;

            if (this.options.ifFileExist === fileExistOptions.addDateTimeSuffix) {
                parsedPath.base = `${parsedPath.name}_${NameGenerator.newDate({format: "YYYYMMDD-hhmmssSSS"})}${parsedPath.ext}`
                continue
            }

            if (this.options.ifFileExist === fileExistOptions.addVersionNumber) {
                vn++;
                parsedPath.base = `${parsedPath.name}${this.options.versionNumberPrefix}${vn}${parsedPath.ext}`
            }
        }
        return parsedPath.base
    }

    save(fullPath: string, data: string, options?: fs.WriteFileOptions | undefined): string {
        if (!fullPath) {throw `Cannot save file to "${fullPath}" as the path is invalid!`}
        const parsed = path.parse(fullPath)

        if (!parsed.base) {throw `Cannot save the file as the file name is not provided! Received "${parsed.base}"`}

        if (!fs.existsSync(parsed.dir)) {
            if (!this.options.createFoldersRecursively) {throw `Cannot save file to "${parsed.dir}" as the location does not exist!`}
            fs.mkdirsSync(parsed.dir);
        }

        if (fs.existsSync(fullPath)) {
            parsed.base = this.handleExistingFile(parsed);
        }

        fs.writeFileSync(path.join(parsed.dir, parsed.base), data, options || "utf-8")

        return fullPath
    }

    constructor(options?: options) {
        this.options = makeOptionsReasonable(options);
    }
}
























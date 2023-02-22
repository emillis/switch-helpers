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
exports.FileSaver = exports.fileExistOptions = void 0;
const main_1 = require("../main");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
exports.fileExistOptions = { override: "override", addVersionNumber: "addVersionNumber", addDateTimeSuffix: "addDateTimeSuffix", fail: "fail" };
function makeOptionsReasonable(options) {
    options = options || {};
    options.createFoldersRecursively = options.createFoldersRecursively === undefined ? true : options.createFoldersRecursively;
    options.ifFileExist = options.ifFileExist === undefined ? exports.fileExistOptions.addVersionNumber : options.ifFileExist;
    options.versionNumberPrefix = options.versionNumberPrefix === undefined ? "_v" : options.versionNumberPrefix;
    return options;
}
class FileSaver {
    options;
    handleExistingFile(parsedPath) {
        if (this.options.ifFileExist === exports.fileExistOptions.fail) {
            throw `File named "${parsedPath.base}" already exist in "${parsedPath.dir}"!`;
        }
        if (this.options.ifFileExist === exports.fileExistOptions.override) {
            return parsedPath.base;
        }
        const originalBase = parsedPath.base;
        let vn = 0;
        while (fs.existsSync(path.join(parsedPath.dir, parsedPath.base))) {
            parsedPath.base = originalBase;
            if (this.options.ifFileExist === exports.fileExistOptions.addDateTimeSuffix) {
                parsedPath.base = `${parsedPath.name}_${main_1.NameGenerator.newDate({ format: "YYYYMMDD-hhmmssSSS" })}${parsedPath.ext}`;
                continue;
            }
            if (this.options.ifFileExist === exports.fileExistOptions.addVersionNumber) {
                vn++;
                parsedPath.base = `${parsedPath.name}${this.options.versionNumberPrefix}${vn}${parsedPath.ext}`;
            }
        }
        return parsedPath.base;
    }
    save(fullPath, data, options) {
        if (!fullPath) {
            throw `Cannot save file to "${fullPath}" as the path is invalid!`;
        }
        const parsed = path.parse(fullPath);
        if (!parsed.base) {
            throw `Cannot save the file as the file name is not provided! Received "${parsed.base}"`;
        }
        if (!fs.existsSync(parsed.dir)) {
            if (!this.options.createFoldersRecursively) {
                throw `Cannot save file to "${parsed.dir}" as the location does not exist!`;
            }
            fs.mkdirsSync(parsed.dir);
        }
        if (fs.existsSync(fullPath)) {
            parsed.base = this.handleExistingFile(parsed);
        }
        fs.writeFileSync(path.join(parsed.dir, parsed.base), data, options || "utf-8");
        return fullPath;
    }
    constructor(options) {
        this.options = makeOptionsReasonable(options);
    }
}
exports.FileSaver = FileSaver;

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
const fs = __importStar(require("fs-extra"));
const main_1 = require("../main");
function makeZipperOptionsReasonable(options) {
    const o = options || {};
    if (o.tmpLocation === undefined)
        o.tmpLocation = (new main_1.GlobalSwitchConfig.Fetcher()).getValueOrFail(`TempMetadataFileLocation`);
    return o;
}
function makeCompressionOptionsReasonable(options) {
    let o = options || {};
    if (o.failIfFileMissing === undefined)
        o.failIfFileMissing = false;
    return o;
}
class Archiver {
    options;
    compress(fileList, options) {
        const o = makeCompressionOptionsReasonable(options);
        //Following logic checks for existing files and adds them to the two arrays accordingly
        let existingFiles = [];
        let missingFiles = [];
        for (const filePath of fileList) {
            if (fs.existsSync(filePath)) {
                existingFiles.push(filePath);
                continue;
            }
            missingFiles.push(filePath);
        }
        if (o.failIfFileMissing && missingFiles.length)
            throw `Some of the files requested to be zipped (archived) do not exist! Those are: "${missingFiles.join(`", "`)}"!`;
        for (;;) {
        }
    }
    constructor(name, options) {
        this.options = makeZipperOptionsReasonable(options);
        if (!fs.pathExistsSync(this.options.tmpLocation || ""))
            throw `Temporary location "${this.options.tmpLocation}" does not exist!`;
        if (!name)
            throw `Zi`;
    }
}

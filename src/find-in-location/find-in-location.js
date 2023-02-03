"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEngine = exports.searchEngineOptionsDefaults = exports.searchTarget = exports.notExistingOptions = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.notExistingOptions = { returnEmptyResults: "returnEmptyResults", throwError: "throwError" };
exports.searchTarget = { both: "both", files: "files", folders: "folders" };
exports.searchEngineOptionsDefaults = {
    allowedExt: [],
    allowPartialMatch: true,
    caseSensitiveMatch: false,
    returnTypes: { full: true, name: true, nameProper: true },
    scanDepth: 0,
    searchTarget: exports.searchTarget.both,
    ifHaystackDoesNotExist: exports.notExistingOptions.throwError,
    ifNeedleDoesNotExist: exports.notExistingOptions.returnEmptyResults
};
//Adds default values to the options and does some processing on them
function makeSenseOutOfOptions(opt) {
    const options = opt || {};
    if (options.allowedExt === undefined) {
        options.allowedExt = exports.searchEngineOptionsDefaults.allowedExt;
    }
    else {
        for (let i = 0; i < options.allowedExt.length; i++) {
            let ext = options.allowedExt[i].toLowerCase().trim();
            if (ext[0] !== ".") {
                ext = `.${ext}`;
            }
            options.allowedExt[i] = ext;
        }
    }
    if (options.allowPartialMatch === undefined) {
        options.allowPartialMatch = exports.searchEngineOptionsDefaults.allowPartialMatch;
    }
    if (options.caseSensitiveMatch === undefined) {
        options.caseSensitiveMatch = exports.searchEngineOptionsDefaults.caseSensitiveMatch;
    }
    if (options.returnTypes === undefined) {
        options.returnTypes = exports.searchEngineOptionsDefaults.returnTypes;
    }
    if (options.scanDepth === undefined || +options.scanDepth < 0) {
        options.scanDepth = exports.searchEngineOptionsDefaults.scanDepth;
    }
    if (options.searchTarget === undefined) {
        options.searchTarget = exports.searchEngineOptionsDefaults.searchTarget;
    }
    if (options.ifHaystackDoesNotExist === undefined) {
        options.ifHaystackDoesNotExist = exports.searchEngineOptionsDefaults.ifHaystackDoesNotExist;
    }
    if (options.ifNeedleDoesNotExist === undefined) {
        options.ifNeedleDoesNotExist = exports.searchEngineOptionsDefaults.ifNeedleDoesNotExist;
    }
    return options;
}
//Returns a new "searchResult" object
function initiateSearchResults(returnTypes) {
    returnTypes = returnTypes || exports.searchEngineOptionsDefaults.returnTypes;
    const result = {
        results: {},
        stats: {
            foldersScanned: 0,
            entitiesCompared: 0,
            resultsFound: 0,
            timeTaken: 0
        }
    };
    if (returnTypes !== undefined) {
        if (returnTypes.name) {
            result.results.name = [];
        }
        if (returnTypes.full) {
            result.results.full = [];
        }
        if (returnTypes.nameProper) {
            result.results.nameProper = [];
        }
    }
    return result;
}
class SearchEngine {
    options;
    makeSenseOutOfOptions(options) {
        return makeSenseOutOfOptions(options);
    }
    initiateSearchResults() {
        return initiateSearchResults(this.options.returnTypes);
    }
    searchRecursively(results, needle, haystack, depth) {
        let newDepth = depth - 1;
        results.stats.foldersScanned++;
        for (let dirent of fs_1.default.readdirSync(haystack, { withFileTypes: true, encoding: "utf-8" })) {
            results.stats.entitiesCompared++;
            const hayOriginal = dirent.name;
            const hay = this.options.caseSensitiveMatch ? hayOriginal : hayOriginal.toLowerCase();
            const fullPath = path_1.default.join(haystack, hayOriginal).replaceAll("\\", "/");
            const isDir = dirent.isDirectory();
            if (isDir && newDepth >= 0) {
                this.searchRecursively(results, needle, fullPath, newDepth);
            }
            if (this.options.allowPartialMatch && hay.search(needle) === -1) {
                continue;
            }
            else if (!this.options.allowPartialMatch && hay !== needle) {
                continue;
            }
            const parsedName = path_1.default.parse(hayOriginal);
            if (!isDir && this.options.allowedExt && this.options.allowedExt.length && !this.options.allowedExt.includes(parsedName.ext.toLowerCase())) {
                continue;
            }
            if (this.options.searchTarget !== exports.searchTarget.both) {
                if (this.options.searchTarget === exports.searchTarget.folders && dirent.isFile()) {
                    continue;
                }
                if (this.options.searchTarget === exports.searchTarget.files && isDir) {
                    continue;
                }
            }
            if (results.results.full) {
                results.results.full.push(fullPath);
            }
            if (results.results.name) {
                results.results.name.push(parsedName.base);
            }
            if (results.results.nameProper) {
                results.results.nameProper.push(parsedName.name);
            }
            results.stats.resultsFound++;
        }
    }
    search(needle, haystack) {
        needle = this.options.caseSensitiveMatch ? needle : needle.toLowerCase();
        const result = this.initiateSearchResults();
        //Checking if haystack exist and acting based on what's in the options
        if (!fs_1.default.existsSync(haystack)) {
            if (this.options.ifHaystackDoesNotExist === exports.notExistingOptions.throwError) {
                throw new Error(`Haystack "${haystack}" does not exist!`);
            }
            else if (this.options.ifHaystackDoesNotExist === exports.notExistingOptions.returnEmptyResults) {
                return result;
            }
            else {
                throw new Error(`Option ifHaystackDoesNotExist has invalid value "${this.options.ifHaystackDoesNotExist}", allowed values are: "${Object.values(exports.notExistingOptions).join(`", "`)}"!`);
            }
        }
        result.stats.timeTaken = Date.now();
        this.searchRecursively(result, needle, haystack, this.options.scanDepth || exports.searchEngineOptionsDefaults.scanDepth || 0);
        result.stats.timeTaken = Date.now() - result.stats.timeTaken;
        //Checking if needle exist and acting based on what's in the options
        if (result.stats.resultsFound < 1 && this.options.ifNeedleDoesNotExist === exports.notExistingOptions.throwError) {
            throw new Error(`No results were found for needle "${needle}" in haystack "${haystack}"!`);
        }
        return result;
    }
    constructor(options) {
        this.options = this.makeSenseOutOfOptions(options);
    }
}
exports.SearchEngine = SearchEngine;

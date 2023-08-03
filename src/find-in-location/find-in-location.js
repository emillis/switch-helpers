"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEngine = exports.searchEngineOptionsDefaults = exports.searchTarget = exports.notExistingOptions = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
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
function initiateSearchResults(needles) {
    const result = {
        allResults: {
            full: [],
            name: [],
            nameProper: []
        },
        needleResults: {},
        stats: {
            foldersScanned: 0,
            entitiesCompared: 0,
            resultsFound: 0,
            timeTaken: 0
        }
    };
    for (const needle of needles)
        result.needleResults[needle] = { full: [], name: [], nameProper: [], resultsFount: 0 };
    return result;
}
class SearchEngine {
    options;
    makeSenseOutOfOptions(options) {
        return makeSenseOutOfOptions(options);
    }
    searchRecursively(results, needles, haystack, depth) {
        let newDepth = depth - 1;
        results.stats.foldersScanned++;
        for (let dirent of fs_extra_1.default.readdirSync(haystack, { withFileTypes: true, encoding: "utf-8" })) {
            results.stats.entitiesCompared++;
            const hayOriginal = dirent.name;
            const hay = this.options.caseSensitiveMatch ? hayOriginal : hayOriginal.toLowerCase();
            const fullPath = path_1.default.join(haystack, hayOriginal).replaceAll("\\", "/");
            const isDir = dirent.isDirectory();
            if (isDir && newDepth >= 0)
                this.searchRecursively(results, needles, fullPath, newDepth);
            const belongsToNeedles = [];
            if (this.options.allowPartialMatch) {
                let found = false;
                for (const needle of needles) {
                    if (!hay.includes(needle.caseAdjustedNeedle))
                        continue;
                    found = true;
                    belongsToNeedles.push(needle.originalNeedle);
                }
                if (!found)
                    continue;
            }
            else {
                let found = false;
                for (const needle of needles) {
                    if (needle.caseAdjustedNeedle !== hay)
                        continue;
                    found = true;
                    break;
                }
                if (!found)
                    continue;
            }
            const parsedName = path_1.default.parse(hayOriginal);
            if (!isDir && this.options.allowedExt && this.options.allowedExt.length && !this.options.allowedExt.includes(parsedName.ext.toLowerCase()))
                continue;
            if (this.options.searchTarget !== exports.searchTarget.both) {
                if (this.options.searchTarget === exports.searchTarget.folders && dirent.isFile()) {
                    continue;
                }
                if (this.options.searchTarget === exports.searchTarget.files && isDir) {
                    continue;
                }
            }
            results.allResults.full.push(fullPath);
            results.allResults.name.push(parsedName.base);
            results.allResults.nameProper.push(parsedName.name);
            for (const needle of belongsToNeedles) {
                const entry = results.needleResults[needle];
                if (!entry)
                    continue;
                entry.full.push(fullPath);
                entry.name.push(parsedName.base);
                entry.nameProper.push(parsedName.name);
                entry.resultsFount++;
            }
            results.stats.resultsFound++;
        }
    }
    search(needles, haystack) {
        if (!Array.isArray(needles))
            needles = [`${needles}`];
        const result = initiateSearchResults(needles);
        //Checking if haystack exist and acting based on what's in the options
        if (!fs_extra_1.default.existsSync(haystack)) {
            if (this.options.ifHaystackDoesNotExist === exports.notExistingOptions.throwError) {
                throw `Haystack "${haystack}" does not exist!`;
            }
            else if (this.options.ifHaystackDoesNotExist === exports.notExistingOptions.returnEmptyResults) {
                return result;
            }
            else {
                throw new Error(`Option ifHaystackDoesNotExist has invalid value "${this.options.ifHaystackDoesNotExist}", allowed values are: "${Object.values(exports.notExistingOptions).join(`", "`)}"!`);
            }
        }
        const n = needles.map(v => {
            return { originalNeedle: v, caseAdjustedNeedle: this.options.caseSensitiveMatch ? v : v.toLowerCase() };
        });
        result.stats.timeTaken = Date.now();
        this.searchRecursively(result, n, haystack, this.options.scanDepth || exports.searchEngineOptionsDefaults.scanDepth || 0);
        result.stats.timeTaken = Date.now() - result.stats.timeTaken;
        //Checking if needle exist and acting based on what's in the options
        if (result.stats.resultsFound < 1 && this.options.ifNeedleDoesNotExist === exports.notExistingOptions.throwError) {
            throw new Error(`No results were found for needle "${needles}" in haystack "${haystack}"!`);
        }
        return result;
    }
    constructor(options) {
        this.options = this.makeSenseOutOfOptions(options);
    }
}
exports.SearchEngine = SearchEngine;
//======[TESTING]================================================================================================
// console.log((new SearchEngine({scanDepth: 1})).search([`Enlarge A4 101%.eal`, `Convert Color to Gray and Keep Black Text.eal`], `D:/Switch Resources - Local/action_lists/auto_fixes/dagenham`));
// console.log((new SearchEngine({scanDepth: 1})).search([`6pp`, `4pp`], `//10.1.6.81/AraxiVolume_HW35899-71_J/Jobs`));
// const scanLocation: string  =       `//10.1.6.81/AraxiVolume_HW35899-71_J/Jobs`;
// const numberOfScans: number =       10;
// let totalScanTime: number =         0;
//
// for (let i=0; i<numberOfScans; i++) totalScanTime += (new SearchEngine({
//     scanDepth: 1,
//     returnTypes: {full: true, name: false, nameProper: false}
// })).search(`6pp`, scanLocation).stats.timeTaken
//
// console.log(`After scanning location "${scanLocation}" ${numberOfScans} times, average scan time is ${Math.round(totalScanTime/numberOfScans)}`);

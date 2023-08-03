import * as async from "async"
import fs from "fs-extra";
import path from "path";

export const notExistingOptions = {returnEmptyResults: "returnEmptyResults", throwError: "throwError"} as const;
export type notExistingOptions = typeof notExistingOptions[keyof typeof notExistingOptions];

export const searchTarget = {both: "both", files: "files", folders: "folders"} as const
export type searchTarget = typeof searchTarget[keyof typeof searchTarget];

export type returnTypes = { full: boolean, name: boolean, nameProper: boolean }

export type searchEngineOptions = {
    allowedExt?: string[],
    allowPartialMatch?: boolean,
    caseSensitiveMatch?: boolean,
    returnTypes?: returnTypes,
    scanDepth?: number,
    searchTarget?: searchTarget,
    ifHaystackDoesNotExist?: notExistingOptions,
    ifNeedleDoesNotExist?: notExistingOptions
}
export const searchEngineOptionsDefaults: searchEngineOptions = {
    allowedExt: [],
    allowPartialMatch: true,
    caseSensitiveMatch: false,
    returnTypes: {full: true, name: true, nameProper: true},
    scanDepth: 0,
    searchTarget: searchTarget.both,
    ifHaystackDoesNotExist: notExistingOptions.throwError,
    ifNeedleDoesNotExist: notExistingOptions.returnEmptyResults
}

type genericResult = {
    full: string[],
    name: string[],
    nameProper: string[]
}

type needleResult = genericResult & {
    resultsFount: number
}

export type searchResult = {
    allResults: genericResult,
    needleResults: { [needle: string]: needleResult }
    stats: {
        foldersScanned: number,
        entitiesCompared: number,
        timeTaken: number,
        resultsFound: number
    }
}

//Adds default values to the options and does some processing on them
function makeSenseOutOfOptions(opt?: searchEngineOptions): searchEngineOptions {
    const options: searchEngineOptions = opt || {};

    if (options.allowedExt === undefined) {
        options.allowedExt = searchEngineOptionsDefaults.allowedExt
    } else {
        for (let i = 0; i < options.allowedExt.length; i++) {
            let ext = options.allowedExt[i].toLowerCase().trim();
            if (ext[0] !== ".") {
                ext = `.${ext}`
            }
            options.allowedExt[i] = ext
        }
    }
    if (options.allowPartialMatch === undefined) {
        options.allowPartialMatch = searchEngineOptionsDefaults.allowPartialMatch
    }
    if (options.caseSensitiveMatch === undefined) {
        options.caseSensitiveMatch = searchEngineOptionsDefaults.caseSensitiveMatch
    }
    if (options.returnTypes === undefined) {
        options.returnTypes = searchEngineOptionsDefaults.returnTypes
    }
    if (options.scanDepth === undefined || +options.scanDepth < 0) {
        options.scanDepth = searchEngineOptionsDefaults.scanDepth
    }
    if (options.searchTarget === undefined) {
        options.searchTarget = searchEngineOptionsDefaults.searchTarget
    }
    if (options.ifHaystackDoesNotExist === undefined) {
        options.ifHaystackDoesNotExist = searchEngineOptionsDefaults.ifHaystackDoesNotExist
    }
    if (options.ifNeedleDoesNotExist === undefined) {
        options.ifNeedleDoesNotExist = searchEngineOptionsDefaults.ifNeedleDoesNotExist
    }

    return options
}

//Returns a new "searchResult" object
function initiateSearchResults(needles: string[]): searchResult {
    const result: searchResult = {
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
    }

    for (const needle of needles) result.needleResults[needle] = {full: [], name: [], nameProper: [], resultsFount: 0}

    return result
}

export class SearchEngine {
    private readonly options: searchEngineOptions;

    private makeSenseOutOfOptions(options?: searchEngineOptions): searchEngineOptions {
        return makeSenseOutOfOptions(options)
    }

    private searchRecursively(results: searchResult, needles: string[], haystack: string, depth: number) {
        let newDepth = depth - 1;
        results.stats.foldersScanned++

        for (let dirent of fs.readdirSync(haystack, {withFileTypes: true, encoding: "utf-8"})) {
            results.stats.entitiesCompared++
            const hayOriginal = dirent.name;
            const hay = this.options.caseSensitiveMatch ? hayOriginal : hayOriginal.toLowerCase()
            const fullPath = path.join(haystack, hayOriginal).replaceAll("\\", "/");
            const isDir = dirent.isDirectory();

            if (isDir && newDepth >= 0) this.searchRecursively(results, needles, fullPath, newDepth)

            const belongsToNeedles: string[] = [];

            if (this.options.allowPartialMatch) {
                let found: boolean = false;

                for (const needle of needles) {
                    if (!hay.includes(needle)) continue
                    found = true;
                    belongsToNeedles.push(needle)
                }

                if (!found) continue
            } else {
                if (needles.includes(hay)) continue
            }

            const parsedName = path.parse(hayOriginal);

            if (!isDir && this.options.allowedExt && this.options.allowedExt.length && !this.options.allowedExt.includes(parsedName.ext.toLowerCase())) continue

            if (this.options.searchTarget !== searchTarget.both) {
                if (this.options.searchTarget === searchTarget.folders && dirent.isFile()) {
                    continue
                }
                if (this.options.searchTarget === searchTarget.files && isDir) {
                    continue
                }
            }

            results.allResults.full.push(fullPath)
            results.allResults.name.push(parsedName.base)
            results.allResults.nameProper.push(parsedName.name)
            for (const needle of belongsToNeedles) {
                const entry = results.needleResults[needle];
                if (!entry) continue

                entry.full.push(fullPath)
                entry.name.push(parsedName.base)
                entry.nameProper.push(parsedName.name)
                entry.resultsFount++
            }

            results.stats.resultsFound++
        }
    }

    public search(needles: string | string[], haystack: string): searchResult {
        if (!Array.isArray(needles)) needles = [`${needles}`];
        if (!this.options.caseSensitiveMatch) needles.map(v => v.toLowerCase())

        const result: searchResult = initiateSearchResults(needles);

        //Checking if haystack exist and acting based on what's in the options
        if (!fs.existsSync(haystack)) {
            if (this.options.ifHaystackDoesNotExist === notExistingOptions.throwError) {
                throw `Haystack "${haystack}" does not exist!`
            } else if (this.options.ifHaystackDoesNotExist === notExistingOptions.returnEmptyResults) {
                return result
            } else {
                throw new Error(`Option ifHaystackDoesNotExist has invalid value "${this.options.ifHaystackDoesNotExist}", allowed values are: "${Object.values(notExistingOptions).join(`", "`)}"!`)
            }
        }

        result.stats.timeTaken = Date.now();
        this.searchRecursively(result, needles, haystack, this.options.scanDepth || searchEngineOptionsDefaults.scanDepth || 0)
        result.stats.timeTaken = Date.now() - result.stats.timeTaken;

        //Checking if needle exist and acting based on what's in the options
        if (result.stats.resultsFound < 1 && this.options.ifNeedleDoesNotExist === notExistingOptions.throwError) {
            throw new Error(`No results were found for needle "${needles}" in haystack "${haystack}"!`)
        }

        return result
    }

    constructor(options?: searchEngineOptions) {
        this.options = this.makeSenseOutOfOptions(options);
    }
}

//======[TESTING]================================================================================================

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
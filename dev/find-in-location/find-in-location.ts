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

export type searchResult = {
    results: {
        full?: string[],
        name?: string[],
        nameProper?: string[]
    },
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
function initiateSearchResults(returnTypes?: returnTypes): searchResult {
    returnTypes = returnTypes || searchEngineOptionsDefaults.returnTypes

    const result: searchResult = {
        results: {},
        stats: {
            foldersScanned: 0,
            entitiesCompared: 0,
            resultsFound: 0,
            timeTaken: 0
        }
    }

    if (returnTypes !== undefined) {
        if (returnTypes.name) {
            result.results.name = []
        }
        if (returnTypes.full) {
            result.results.full = []
        }
        if (returnTypes.nameProper) {
            result.results.nameProper = []
        }
    }

    return result
}

export class SearchEngine {
    private readonly options: searchEngineOptions;

    private makeSenseOutOfOptions(options?: searchEngineOptions): searchEngineOptions {
        return makeSenseOutOfOptions(options)
    }

    private initiateSearchResults(): searchResult {
        return initiateSearchResults(this.options.returnTypes)
    }

    private searchRecursively(results: searchResult, needle: string, haystack: string, depth: number) {
        let newDepth = depth - 1;
        results.stats.foldersScanned++

        for (let dirent of fs.readdirSync(haystack, {withFileTypes: true, encoding: "utf-8"})) {
            results.stats.entitiesCompared++
            const hayOriginal = dirent.name;
            const hay = this.options.caseSensitiveMatch ? hayOriginal : hayOriginal.toLowerCase()
            const fullPath = path.join(haystack, hayOriginal).replaceAll("\\", "/");
            const isDir = dirent.isDirectory();

            if (isDir && newDepth >= 0) {
                this.searchRecursively(results, needle, fullPath, newDepth)
            }

            if (this.options.allowPartialMatch && hay.search(needle) === -1) {
                continue
            } else if (!this.options.allowPartialMatch && hay !== needle) {
                continue
            }

            const parsedName = path.parse(hayOriginal);

            if (!isDir && this.options.allowedExt && this.options.allowedExt.length && !this.options.allowedExt.includes(parsedName.ext.toLowerCase())) {
                continue
            }

            if (this.options.searchTarget !== searchTarget.both) {
                if (this.options.searchTarget === searchTarget.folders && dirent.isFile()) {
                    continue
                }
                if (this.options.searchTarget === searchTarget.files && isDir) {
                    continue
                }
            }

            if (results.results.full) {
                results.results.full.push(fullPath)
            }
            if (results.results.name) {
                results.results.name.push(parsedName.base)
            }
            if (results.results.nameProper) {
                results.results.nameProper.push(parsedName.name)
            }

            results.stats.resultsFound++
        }
    }

    public search(needle: string, haystack: string): searchResult {
        needle = this.options.caseSensitiveMatch ? needle : needle.toLowerCase();

        const result: searchResult = this.initiateSearchResults();

        //Checking if haystack exist and acting based on what's in the options
        if (!fs.existsSync(haystack)) {
            if (this.options.ifHaystackDoesNotExist === notExistingOptions.throwError) {
                throw new Error(`Haystack "${haystack}" does not exist!`)
            } else if (this.options.ifHaystackDoesNotExist === notExistingOptions.returnEmptyResults) {
                return result
            } else {
                throw new Error(`Option ifHaystackDoesNotExist has invalid value "${this.options.ifHaystackDoesNotExist}", allowed values are: "${Object.values(notExistingOptions).join(`", "`)}"!`)
            }
        }

        result.stats.timeTaken = Date.now()
        this.searchRecursively(result, needle, haystack, this.options.scanDepth || searchEngineOptionsDefaults.scanDepth || 0)
        result.stats.timeTaken = Date.now() - result.stats.timeTaken

        //Checking if needle exist and acting based on what's in the options
        if (result.stats.resultsFound < 1 && this.options.ifNeedleDoesNotExist === notExistingOptions.throwError) {
            throw new Error(`No results were found for needle "${needle}" in haystack "${haystack}"!`)
        }

        return result
    }

    constructor(options?: searchEngineOptions) {
        this.options = this.makeSenseOutOfOptions(options);
    }
}
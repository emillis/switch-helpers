export declare const notExistingOptions: {
    readonly returnEmptyResults: "returnEmptyResults";
    readonly throwError: "throwError";
};
export type notExistingOptions = typeof notExistingOptions[keyof typeof notExistingOptions];
export declare const searchTarget: {
    readonly both: "both";
    readonly files: "files";
    readonly folders: "folders";
};
export type searchTarget = typeof searchTarget[keyof typeof searchTarget];
export type returnTypes = {
    full: boolean;
    name: boolean;
    nameProper: boolean;
};
export type searchEngineOptions = {
    allowedExt?: string[];
    allowPartialMatch?: boolean;
    caseSensitiveMatch?: boolean;
    returnTypes?: returnTypes;
    scanDepth?: number;
    searchTarget?: searchTarget;
    ifHaystackDoesNotExist?: notExistingOptions;
    ifNeedleDoesNotExist?: notExistingOptions;
};
export declare const searchEngineOptionsDefaults: searchEngineOptions;
type genericResult = {
    full: string[];
    name: string[];
    nameProper: string[];
};
type needleResult = genericResult & {
    resultsFount: number;
};
export type searchResult = {
    allResults: genericResult;
    needleResults: {
        [needle: string]: needleResult;
    };
    stats: {
        foldersScanned: number;
        entitiesCompared: number;
        timeTaken: number;
        resultsFound: number;
    };
};
export declare class SearchEngine {
    private readonly options;
    private makeSenseOutOfOptions;
    private searchRecursively;
    search(needles: string | string[], haystack: string): searchResult;
    constructor(options?: searchEngineOptions);
}
export {};

export declare const notExistingOptions: {
    readonly returnEmptyResults: "returnEmptyResults";
    readonly throwError: "throwError";
};
export declare type notExistingOptions = typeof notExistingOptions[keyof typeof notExistingOptions];
export declare const searchTarget: {
    readonly both: "both";
    readonly files: "files";
    readonly folders: "folders";
};
export declare type searchTarget = typeof searchTarget[keyof typeof searchTarget];
export declare type returnTypes = {
    full: boolean;
    name: boolean;
    nameProper: boolean;
};
export declare type searchEngineOptions = {
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
declare type genericResult = {
    full: string[];
    name: string[];
    nameProper: string[];
};
declare type needleResult = genericResult & {
    resultsFount: number;
};
export declare type searchResult = {
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

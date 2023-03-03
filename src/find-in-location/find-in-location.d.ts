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
export type searchResult = {
    results: {
        full?: string[];
        name?: string[];
        nameProper?: string[];
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
    private initiateSearchResults;
    private searchRecursively;
    search(needle: string, haystack: string): searchResult;
    constructor(options?: searchEngineOptions);
}

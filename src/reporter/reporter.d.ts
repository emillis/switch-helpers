/// <reference types="switch-scripting" />
export declare type pageSetup = {
    TabTitle: string;
    PageTitle: string;
};
export declare type messages = {
    Errors: string[];
    Warnings: string[];
    Successes: string[];
    Logs: string[];
};
export interface IReporter {
    addErrors(...msg: string[]): void;
    addWarnings(...msg: string[]): void;
    addSuccesses(...msg: string[]): void;
    addLogs(...msg: string[]): void;
}
export declare class Reporter implements IReporter {
    private readonly pageSetup;
    private readonly messages;
    private readonly FileSaver;
    tabTitle(newTitle?: string): string;
    pageTitle(newTitle?: string): string;
    counts: {
        errors: () => number;
        warnings: () => number;
        successes: () => number;
        logs: () => number;
    };
    list: {
        errors: () => string[];
        warnings: () => string[];
        successes: () => string[];
        logs: () => string[];
    };
    addErrors(...msg: string[]): void;
    addWarnings(...msg: string[]): void;
    addSuccesses(...msg: string[]): void;
    addLogs(...msg: string[]): void;
    getReportAsHTMLString(): string;
    saveAsHtml(options?: {
        name?: string;
        location?: string;
    }): string;
    sendWithReportAttached(job: Job, flowElement: FlowElement, options?: {
        datasetName?: string;
        tmpLocation?: string;
        tmpReportFileName?: string;
        newJobName?: string;
    }): Promise<void>;
    constructor(pageSetup?: pageSetup);
}

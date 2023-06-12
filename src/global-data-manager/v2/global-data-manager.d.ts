/// <reference types="switch-scripting" />
export type config = {
    tag: string;
    scope?: Scope;
    loadJobs?: boolean;
};
export type entry<T> = {
    _id: string;
    _timeAdded: number;
    _timeModified: number;
    _jobId?: string;
    _currentJobRetrievalAttempt: number;
    _jobRetrievalAttempts: number;
    _data: T;
};
export declare class Entry<T> {
    private readonly entry;
    private _job;
    id(newId?: string): string;
    timeAdded(newTime?: number): number;
    timeModified(newTime?: number): number;
    updateTimeModified(): number;
    job(job?: Job): Job | undefined;
    jobId(newJobId?: string): string | undefined;
    currentJobRetrievalAttempt(newValue?: number): number;
    jobRetrievalAttempts(newValue?: number): number;
    data(newData?: T): T;
    getEntryDataObject(): entry<T>;
    constructor(e: entry<T>, job?: Job);
}
export type addOptions = {
    id?: string;
    job?: Job;
    jobRetrievalCount?: number;
};
export default class GlobalDataManager<T> {
    private readonly switch;
    private readonly flowElement;
    private readonly config;
    private readonly randGen;
    private initiated;
    private originalGlobalDataObject;
    private globalDataObject;
    private customMetadata;
    private isInitiated;
    private loadJobs;
    getAll(): {
        [ID: string]: Entry<T>;
    };
    getEntry(id: string): Entry<T> | undefined;
    getAllEntryIds(): string[];
    getEntries(ids: string[]): {
        [ID: string]: Entry<T> | undefined;
    };
    getAvailableEntries(): Entry<T>[];
    removeEntries(...ids: string[]): void;
    removeAllEntries(): void;
    addEntry(data: T, options?: addOptions): Entry<T>;
    addCustomMetadata(key: string, value: any): Promise<void>;
    removeCustomMetadata(...keys: string[]): Promise<void>;
    getCustomMetadata(key: string): any;
    getMultipleCustomData(...keys: string[]): {
        [key: string]: any;
    };
    unlockGlobalData(): Promise<void>;
    saveAndUnlockGlobalData(): Promise<void>;
    constructor(s: Switch, flowElement: FlowElement, cfg: config);
    init(): Promise<GlobalDataManager<T>>;
}

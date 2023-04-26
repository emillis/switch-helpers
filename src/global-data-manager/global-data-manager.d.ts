/// <reference types="switch-scripting" />
export declare type config = {
    tag: string;
    scope?: Scope;
};
export declare type entry<T> = {
    _id: string;
    _timeAdded: number;
    _timeModified: number;
    _data: T;
};
export declare class Entry<T> {
    private _id;
    private _timeAdded;
    private _timeModified;
    private _data;
    id(newId?: string): string;
    timeAdded(newTime?: number): number;
    timeModified(newTime?: number): number;
    updateTimeModified(): number;
    data(newData?: T): T;
    getEntryDataObject(): entry<T>;
    constructor(e: entry<T>);
}
export declare class GlobalDataManager<T> {
    private readonly switch;
    private readonly cfg;
    private readonly randGen;
    private initiated;
    private notInitiatedErrMsg;
    private originalGlobalDataObject;
    private globalDataObject;
    private customMetadata;
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
    addEntry(data: T, id?: string): Entry<T>;
    addCustomMetadata(key: string, value: any): Promise<void>;
    removeCustomMetadata(...keys: string[]): Promise<void>;
    getCustomMetadata(key: string): any;
    getMultipleCustomData(...keys: string[]): {
        [key: string]: any;
    };
    unlockGlobalData(): Promise<void>;
    saveAndUnlockGlobalData(): Promise<void>;
    constructor(s: Switch, cfg: config);
    init(): Promise<GlobalDataManager<T>>;
}

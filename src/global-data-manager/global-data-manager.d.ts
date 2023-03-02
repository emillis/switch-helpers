/// <reference types="switch-scripting" />
export type config = {
    tag: string;
    scope?: Scope;
};
export type entry<T> = {
    id: string;
    timeAdded: number;
    timeModified: number;
    data: T;
};
export declare class Entry<T> {
    private readonly entry;
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
    getAll(): {
        [ID: string]: Entry<T>;
    };
    getEntry(id: string): Entry<T> | undefined;
    getEntries(ids: string[]): {
        [ID: string]: Entry<T> | undefined;
    };
    getAvailableEntries(): Entry<T>[];
    removeEntries(...ids: string[]): void;
    addEntry(data: T, id?: string): void;
    unlockGlobalData(): Promise<void>;
    saveAndUnlockGlobalData(): Promise<void>;
    constructor(s: Switch, cfg: config);
    init(): Promise<GlobalDataManager<T>>;
}

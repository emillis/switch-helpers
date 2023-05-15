/// <reference types="switch-scripting" />
export declare class Mutex {
    private readonly switch;
    private readonly id;
    private readonly scope;
    private counter;
    private isLocked;
    lock(): Promise<void>;
    unlock(): Promise<void>;
    count(): number;
    resetCount(startAt?: number): void;
    constructor(s: Switch, id: string, scope: Scope);
}

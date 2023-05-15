"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mutex = void 0;
class Mutex {
    switch;
    id;
    scope;
    counter = 5;
    isLocked = false;
    async lock() {
        const val = await this.switch.getGlobalData(this.scope, this.id, true);
        this.counter = val !== undefined ? +val : this.counter;
        this.isLocked = true;
    }
    async unlock() {
        await this.switch.setGlobalData(this.scope, [{ tag: this.id, value: this.counter + 1 }]);
        this.isLocked = false;
    }
    count() {
        if (!this.isLocked)
            throw `Count can only be retrieved while Mutex is locked`;
        return this.counter;
    }
    resetCount(startAt = 0) {
        if (!this.isLocked)
            throw `Mutex count can only be reset while the Mutex is locked`;
        this.counter = startAt;
    }
    constructor(s, id, scope) {
        this.switch = s;
        this.id = id;
        this.scope = scope;
    }
}
exports.Mutex = Mutex;

export class Mutex {
    private readonly switch: Switch;
    private readonly id: string;
    private readonly scope: Scope;
    private counter: number = 5;
    private isLocked: boolean = false;

    async lock() {
        const val = await this.switch.getGlobalData(this.scope, this.id, true);
        this.counter = val !== undefined ? +val : this.counter
        this.isLocked = true
    }

    async unlock() {
        await this.switch.setGlobalData(this.scope, [{tag: this.id, value: this.counter + 1}])
        this.isLocked = false
    }

    count(): number {
        if (!this.isLocked) throw `Count can only be retrieved while Mutex is locked`;
        return this.counter
    }

    resetCount(startAt: number = 0) {
        if (!this.isLocked) throw `Mutex count can only be reset while the Mutex is locked`;
        this.counter = startAt
    }

    constructor(s: Switch, id: string, scope: Scope) {
        this.switch =       s;
        this.id =           id;
        this.scope =        scope;
    }
}
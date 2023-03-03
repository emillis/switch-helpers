import {NameGenerator} from "../main";

type config = {
    tag: string,
    scope?: Scope
}

const defaultConfig = {
    tag: "",
    scope: EnfocusSwitch.Scope.FlowElement
}

function makeConfigReasonable(config?: config): config {
    config = config || {
        tag: defaultConfig.tag,
        scope: defaultConfig.scope
    }

    if (!config.tag) throw `Invalid global data tag "${config.tag}" provided!`;
    if (config.scope === undefined) config.scope = defaultConfig.scope

    return config
}

type entry<T> = {
    _id: string
    _timeAdded: number
    _timeModified: number
    _data: T
}
class Entry<T> {
    private _id: string;
    private _timeAdded: number;
    private _timeModified: number;
    private _data: T;

    //Returns entry ID
    id(newId?: string): string {
        if (newId !== undefined) this._id = `${newId}`

        return this._id
    }

    //Returns time when the entry was added (timestamp)
    timeAdded(newTime?: number): number {
        if (newTime !== undefined) this._timeAdded = newTime;

        return this._timeAdded
    }

    //Returns time when the entry was last modified
    timeModified(newTime?: number): number {
        if (newTime !== undefined) this._timeModified = newTime;

        return this._timeModified;
    }

    //Updates timeModified field with current timestamp
    updateTimeModified(): number {
        return this.timeModified(+ new Date())
    }

    //Returns the custom data added by the client
    data(newData?: T): T {
        if (newData !== undefined) this._data = newData;

        return this._data
    }

    //Returns entry data object
    getEntryDataObject(): entry<T> {
        return {
            _id: this._id,
            _timeAdded: this._timeAdded,
            _timeModified: this._timeModified,
            _data: this._data
        }
    }

    constructor(e: entry<T>) {
        this._id = e._id
        this._timeAdded = e._timeAdded
        this._timeModified = e._timeModified
        this._data = e._data
    }
}

class GlobalDataManager<T> {
    private readonly switch: Switch;
    private readonly cfg: config;
    private readonly randGen: NameGenerator.AdvancedStringGenerator;
    private initiated: boolean = false;
    private notInitiatedErrMsg: string = `This GlobalDataManager has not yet been initiated! Please run ".init()" async function on GlobalDataManager before calling any other functions in order to resolve this!`;
    private originalGlobalDataObject: {[ID: string]: Entry<T>} = {};
    private globalDataObject: {[ID: string]: Entry<T>} = {};

    getAll(): {[ID: string]: Entry<T>} {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        return this.globalDataObject;
    }

    getEntry(id: string): Entry<T> | undefined {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        return this.globalDataObject[id];
    }

    getEntries(ids: string[]): {[ID: string]: Entry<T> | undefined} {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        let result: {[ID: string]: Entry<T> | undefined} = {};

        for (const id of ids) {
            result[id] = this.globalDataObject[id]
        }

        return result
    }

    getAvailableEntries(): Entry<T>[] {
        return Object.values(this.globalDataObject);
    }

    removeEntries(...ids: string[]) {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        for (const id of ids) {
            delete this.globalDataObject[id];
        }
    }

    addEntry(data: T, id?: string): Entry<T> {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        if (id === undefined) {
            let tmpId = this.randGen.generate();

            while (this.globalDataObject[tmpId] !== undefined) {
                tmpId = this.randGen.generate();
            }

            id = tmpId;
        }

        const now = + new Date();

        const e = new Entry<T>({
            _id: id,
            _timeAdded: now,
            _timeModified: now,
            _data: data
        });

        this.globalDataObject[id] = e;
        return e;
    }

    //Unlocks global data without saving newly added / removed shared data.
    async unlockGlobalData() {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, this.originalGlobalDataObject)
    }

    //Saves newly added / removed shared data to the global data and unlocks it.
    async saveAndUnlockGlobalData() {
        if (!this.initiated) throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, this.globalDataObject)
    }

    constructor(s: Switch, cfg: config) {
        this.switch = s
        this.cfg = makeConfigReasonable(cfg);
        this.randGen = new NameGenerator.AdvancedStringGenerator({
            minLen: 20,
            maxLen: 20,
            type: "random",
            composition: "alphaNumericOnly",
            charCase: "upperOnly",
        })
    }

    async init(): Promise<GlobalDataManager<T>> {
        const values: {[ID: string]: entry<T>} = await this.switch.getGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, true) || {}

        for (const value of Object.values(values)) {
            const e1 = new Entry<T>(value);
            const e2 = new Entry<T>(value);

            this.originalGlobalDataObject[e1.id()] = e1;
            this.globalDataObject[e2.id()] = e2;
        }

        this.initiated = true;
        return this
    }
}
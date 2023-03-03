"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalDataManager = exports.Entry = void 0;
const main_1 = require("../main");
const defaultConfig = {
    tag: "",
    scope: EnfocusSwitch.Scope.FlowElement
};
function makeConfigReasonable(config) {
    config = config || {
        tag: defaultConfig.tag,
        scope: defaultConfig.scope
    };
    if (!config.tag)
        throw `Invalid global data tag "${config.tag}" provided!`;
    if (config.scope === undefined)
        config.scope = defaultConfig.scope;
    return config;
}
class Entry {
    _id;
    _timeAdded;
    _timeModified;
    _data;
    //Returns entry ID
    id(newId) {
        if (newId !== undefined)
            this._id = `${newId}`;
        return this._id;
    }
    //Returns time when the entry was added (timestamp)
    timeAdded(newTime) {
        if (newTime !== undefined)
            this._timeAdded = newTime;
        return this._timeAdded;
    }
    //Returns time when the entry was last modified
    timeModified(newTime) {
        if (newTime !== undefined)
            this._timeModified = newTime;
        return this._timeModified;
    }
    //Updates timeModified field with current timestamp
    updateTimeModified() {
        return this.timeModified(+new Date());
    }
    //Returns the custom data added by the client
    data(newData) {
        if (newData !== undefined)
            this._data = newData;
        return this._data;
    }
    //Returns entry data object
    getEntryDataObject() {
        return {
            id: this._id,
            timeAdded: this._timeAdded,
            timeModified: this._timeModified,
            data: this._data
        };
    }
    constructor(e) {
        this._id = e.id;
        this._timeAdded = e.timeAdded;
        this._timeModified = e.timeModified;
        this._data = e.data;
    }
}
exports.Entry = Entry;
class GlobalDataManager {
    switch;
    cfg;
    randGen;
    initiated = false;
    notInitiatedErrMsg = `This GlobalDataManager has not yet been initiated! Please run ".init()" async function on GlobalDataManager before calling any other functions in order to resolve this!`;
    originalGlobalDataObject = {};
    globalDataObject = {};
    getAll() {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        return this.globalDataObject;
    }
    getEntry(id) {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        return this.globalDataObject[id];
    }
    getEntries(ids) {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        let result = {};
        for (const id of ids) {
            result[id] = this.globalDataObject[id];
        }
        return result;
    }
    getAvailableEntries() {
        return Object.values(this.globalDataObject);
    }
    removeEntries(...ids) {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        for (const id of ids) {
            delete this.globalDataObject[id];
        }
    }
    addEntry(data, id) {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        if (id === undefined) {
            let tmpId = this.randGen.generate();
            while (this.globalDataObject[tmpId] !== undefined) {
                tmpId = this.randGen.generate();
            }
            id = tmpId;
        }
        const now = +new Date();
        const e = new Entry({
            id: id,
            timeAdded: now,
            timeModified: now,
            data: data
        });
        this.globalDataObject[id] = e;
        return e;
    }
    //Unlocks global data without saving newly added / removed shared data.
    async unlockGlobalData() {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, this.originalGlobalDataObject);
    }
    //Saves newly added / removed shared data to the global data and unlocks it.
    async saveAndUnlockGlobalData() {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, this.globalDataObject);
    }
    constructor(s, cfg) {
        this.switch = s;
        this.cfg = makeConfigReasonable(cfg);
        this.randGen = new main_1.NameGenerator.AdvancedStringGenerator({
            minLen: 20,
            maxLen: 20,
            type: "random",
            composition: "alphaNumericOnly",
            charCase: "upperOnly",
        });
    }
    async init() {
        const values = await this.switch.getGlobalData(this.cfg.scope || defaultConfig.scope, this.cfg.tag, true) || {};
        for (const value of Object.values(values)) {
            const e1 = new Entry(value);
            const e2 = new Entry(value);
            this.originalGlobalDataObject[e1.id()] = e1;
            this.globalDataObject[e2.id()] = e2;
        }
        this.initiated = true;
        return this;
    }
}
exports.GlobalDataManager = GlobalDataManager;

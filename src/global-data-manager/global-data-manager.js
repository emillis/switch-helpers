"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalDataManager = exports.Entry = void 0;
const main_1 = require("../main");
function makeConfigReasonable(config) {
    config = config || {
        tag: "",
        scope: Scope.FlowElement
    };
    if (!config.tag)
        throw `Invalid global data tag "${config.tag}" provided!`;
    if (config.scope === undefined)
        config.scope = Scope.FlowElement;
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
            _id: this._id,
            _timeAdded: this._timeAdded,
            _timeModified: this._timeModified,
            _data: this._data
        };
    }
    constructor(e) {
        this._id = e._id;
        this._timeAdded = e._timeAdded;
        this._timeModified = e._timeModified;
        this._data = e._data;
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
    customMetadata = {};
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
    getAllEntryIds() {
        try {
            return Object.keys(this.globalDataObject);
        }
        catch {
            return [];
        }
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
    removeAllEntries() {
        this.globalDataObject = {};
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
            _id: id,
            _timeAdded: now,
            _timeModified: now,
            _data: data
        });
        this.globalDataObject[id] = e;
        return e;
    }
    async addCustomMetadata(key, value) {
        this.customMetadata[key] = value;
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata);
    }
    async removeCustomMetadata(...keys) {
        for (const key of keys)
            delete this.customMetadata[key];
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata);
    }
    getCustomMetadata(key) {
        return this.customMetadata[key];
    }
    getMultipleCustomData(...keys) {
        const result = {};
        for (const key of keys)
            result[key] = this.getCustomMetadata(key);
        return result;
    }
    //Unlocks global data without saving newly added / removed shared data.
    async unlockGlobalData() {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || Scope.FlowElement, this.cfg.tag, this.originalGlobalDataObject);
    }
    //Saves newly added / removed shared data to the global data and unlocks it.
    async saveAndUnlockGlobalData() {
        if (!this.initiated)
            throw this.notInitiatedErrMsg;
        await this.switch.setGlobalData(this.cfg.scope || EnfocusSwitch.Scope.FlowElement, this.cfg.tag, this.globalDataObject);
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
        const values = await this.switch.getGlobalData(this.cfg.scope || EnfocusSwitch.Scope.FlowElement, this.cfg.tag, true) || {};
        this.customMetadata = await this.switch.getGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, false);
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entry = void 0;
const main_1 = require("../../main");
function makeConfigReasonable(config) {
    config = config || {
        tag: "",
        scope: Scope.FlowElement,
        loadJobs: false
    };
    if (!config.tag)
        throw `Invalid global data tag "${config.tag}" provided!`;
    if (config.scope === undefined)
        config.scope = EnfocusSwitch.Scope.FlowElement;
    if (config.loadJobs === undefined)
        config.loadJobs = false;
    return config;
}
class Entry {
    entry;
    _job;
    //Returns entry ID
    id(newId) {
        if (newId !== undefined)
            this.entry._id = `${newId}`;
        return this.entry._id;
    }
    //Returns time when the entry was added (timestamp)
    timeAdded(newTime) {
        if (newTime !== undefined)
            this.entry._timeAdded = newTime;
        return this.entry._timeAdded;
    }
    //Returns time when the entry was last modified
    timeModified(newTime) {
        if (newTime !== undefined)
            this.entry._timeModified = newTime;
        return this.entry._timeModified;
    }
    //Updates timeModified field with current timestamp
    updateTimeModified() {
        return this.timeModified(Date.now());
    }
    job(job) {
        if (job)
            this._job = job;
        return this._job;
    }
    jobId(newJobId) {
        if (newJobId !== undefined)
            this.entry._jobId = newJobId;
        return this.entry._jobId;
    }
    currentJobRetrievalAttempt(newValue) {
        if (newValue !== undefined)
            this.entry._currentJobRetrievalAttempt = newValue;
        return this.entry._currentJobRetrievalAttempt;
    }
    jobRetrievalAttempts(newValue) {
        if (newValue !== undefined)
            this.entry._jobRetrievalAttempts = newValue;
        return this.entry._jobRetrievalAttempts;
    }
    //Returns the custom data added by the client
    data(newData) {
        if (newData !== undefined)
            this.entry._data = newData;
        return this.entry._data;
    }
    //Returns entry data object
    getEntryDataObject() {
        return this.entry;
    }
    constructor(e, job) {
        this.entry = e;
        this.job(job);
    }
}
exports.Entry = Entry;
class GlobalDataManager {
    switch;
    flowElement;
    config;
    randGen;
    initiated = false;
    originalGlobalDataObject = {};
    globalDataObject = {};
    customMetadata = {};
    isInitiated() {
        if (!this.initiated)
            throw `This GlobalDataManager has not yet been initiated! Please run ".init()" async function on GlobalDataManager before calling any other functions in order to resolve this!`;
    }
    async loadJobs() {
        const entries = Object.values(this.globalDataObject);
        const jobIdsToGet = [];
        for (const e of entries) {
            const jid = e.jobId();
            if (jid)
                jobIdsToGet.push(jid);
        }
        let jobs = [];
        try {
            jobs = await this.flowElement.getJobs(jobIdsToGet);
        }
        catch { }
        for (const entry of entries) {
            let jobAssigned = false;
            for (const job of jobs) {
                if (entry.jobId() !== job.getId())
                    continue;
                entry.job(job);
                jobAssigned = true;
                break;
            }
            if (!jobAssigned) {
            }
        }
    }
    getAll() {
        this.isInitiated();
        return this.globalDataObject;
    }
    getEntry(id) {
        this.isInitiated();
        return this.globalDataObject[id];
    }
    getAllEntryIds() {
        this.isInitiated();
        try {
            return Object.keys(this.globalDataObject);
        }
        catch {
            return [];
        }
    }
    getEntries(ids) {
        this.isInitiated();
        let result = {};
        for (const id of ids) {
            result[id] = this.globalDataObject[id];
        }
        return result;
    }
    getAvailableEntries() {
        this.isInitiated();
        return Object.values(this.globalDataObject);
    }
    removeEntries(...ids) {
        this.isInitiated();
        for (const id of ids) {
            delete this.globalDataObject[id];
        }
    }
    removeAllEntries() {
        this.isInitiated();
        this.globalDataObject = {};
    }
    addEntry(data, options = {}) {
        this.isInitiated();
        if (options.id === undefined) {
            let tmpId = this.randGen.generate();
            while (this.globalDataObject[tmpId] !== undefined) {
                tmpId = this.randGen.generate();
            }
            options.id = tmpId;
        }
        const now = Date.now();
        const e = new Entry({
            _id: options.id,
            _timeAdded: now,
            _timeModified: now,
            _jobId: options.job?.getId(),
            _currentJobRetrievalAttempt: 0,
            _jobRetrievalAttempts: options.jobRetrievalCount || 3,
            _data: data
        });
        this.globalDataObject[options.id] = e;
        return e;
    }
    async addCustomMetadata(key, value) {
        this.isInitiated();
        this.customMetadata[key] = value;
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata);
    }
    async removeCustomMetadata(...keys) {
        this.isInitiated();
        for (const key of keys)
            delete this.customMetadata[key];
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata);
    }
    getCustomMetadata(key) {
        this.isInitiated();
        return this.customMetadata[key];
    }
    getMultipleCustomData(...keys) {
        this.isInitiated();
        const result = {};
        for (const key of keys)
            result[key] = this.getCustomMetadata(key);
        return result;
    }
    //Unlocks global data without saving newly added / removed shared data.
    async unlockGlobalData() {
        this.isInitiated();
        await this.switch.setGlobalData(this.config.scope || Scope.FlowElement, this.config.tag, this.originalGlobalDataObject);
    }
    //Saves newly added / removed shared data to the global data and unlocks it.
    async saveAndUnlockGlobalData() {
        this.isInitiated();
        await this.switch.setGlobalData(this.config.scope || EnfocusSwitch.Scope.FlowElement, this.config.tag, this.globalDataObject);
    }
    constructor(s, flowElement, cfg) {
        this.switch = s;
        this.flowElement = flowElement;
        this.config = makeConfigReasonable(cfg);
        this.randGen = new main_1.NameGenerator.AdvancedStringGenerator({
            minLen: 20,
            maxLen: 20,
            type: "random",
            composition: "alphaNumericOnly",
            charCase: "upperOnly",
        });
    }
    async init() {
        const values = await this.switch.getGlobalData(this.config.scope || EnfocusSwitch.Scope.FlowElement, this.config.tag, true) || {};
        this.customMetadata = await this.switch.getGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, false) || this.customMetadata;
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
exports.default = GlobalDataManager;

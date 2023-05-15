import {NameGenerator} from "../../main";

export type config = {
    tag: string
    scope?: Scope
    loadJobs?: boolean
}

function makeConfigReasonable(config?: config): config {
    config = config || {
        tag: "",
        scope: Scope.FlowElement,
        loadJobs: false
    }

    if (!config.tag)                                            throw `Invalid global data tag "${config.tag}" provided!`;
    if (config.scope === undefined) config.scope =              EnfocusSwitch.Scope.FlowElement
    if (config.loadJobs === undefined) config.loadJobs =        false

    return config
}

export type entry<T> = {
    _id: string
    _timeAdded: number
    _timeModified: number
    _jobId?: string
    _currentJobRetrievalAttempt: number
    _jobRetrievalAttempts: number
    _data: T
}
export class Entry<T> {
    private readonly entry: entry<T>;
    private _job: Job | undefined;

    //Returns entry ID
    id(newId?: string): string {
        if (newId !== undefined) this.entry._id = `${newId}`

        return this.entry._id
    }

    //Returns time when the entry was added (timestamp)
    timeAdded(newTime?: number): number {
        if (newTime !== undefined) this.entry._timeAdded = newTime;

        return this.entry._timeAdded
    }

    //Returns time when the entry was last modified
    timeModified(newTime?: number): number {
        if (newTime !== undefined) this.entry._timeModified = newTime;

        return this.entry._timeModified;
    }

    //Updates timeModified field with current timestamp
    updateTimeModified(): number {
        return this.timeModified(Date.now())
    }

    job(job?: Job): Job | undefined {
        if (job) this._job = job
        return this._job
    }

    jobId(newJobId?: string): string | undefined {
        if (newJobId !== undefined) this.entry._jobId = newJobId
        return this.entry._jobId
    }

    currentJobRetrievalAttempt(newValue?: number): number {
        if (newValue !== undefined) this.entry._currentJobRetrievalAttempt = newValue
        return this.entry._currentJobRetrievalAttempt
    }

    jobRetrievalAttempts(newValue?: number): number {
        if (newValue !== undefined) this.entry._jobRetrievalAttempts = newValue
        return this.entry._jobRetrievalAttempts
    }

    //Returns the custom data added by the client
    data(newData?: T): T {
        if (newData !== undefined) this.entry._data = newData;

        return this.entry._data
    }

    //Returns entry data object
    getEntryDataObject(): entry<T> {
        return this.entry
    }

    constructor(e: entry<T>, job?: Job) {
        this.entry = e
        this.job(job)
    }
}

export type addOptions = {
    id?: string
    job?: Job
    jobRetrievalCount?: number
}

export default class GlobalDataManager<T> {
    private readonly switch: Switch;
    private readonly flowElement: FlowElement;
    private readonly config: config;
    private readonly randGen: NameGenerator.AdvancedStringGenerator;
    private initiated: boolean = false;
    private originalGlobalDataObject: {[ID: string]: Entry<T>} = {};
    private globalDataObject: {[ID: string]: Entry<T>} = {};
    private customMetadata: {[key:string]: any} = {};

    private isInitiated() {
        if (!this.initiated) throw `This GlobalDataManager has not yet been initiated! Please run ".init()" async function on GlobalDataManager before calling any other functions in order to resolve this!`;
    }

    private async loadJobs() {
        const entries = Object.values(this.globalDataObject);
        const jobIdsToGet: string[] = [];
        for (const e of entries) {
            const jid = e.jobId()
            if (jid) jobIdsToGet.push(jid)
        }

        let jobs: Job[] = [];
        try {jobs = await this.flowElement.getJobs(jobIdsToGet)} catch {}

        for (const entry of entries) {
            let jobAssigned: boolean = false
            for (const job of jobs) {
                if (entry.jobId() !== job.getId()) continue
                entry.job(job)
                jobAssigned = true
                break
            }

            if (!jobAssigned) {

            }
        }
    }

    getAll(): {[ID: string]: Entry<T>} {
        this.isInitiated()
        return this.globalDataObject;
    }

    getEntry(id: string): Entry<T> | undefined {
        this.isInitiated()
        return this.globalDataObject[id];
    }

    getAllEntryIds(): string[] {
        this.isInitiated()
        try {
            return Object.keys(this.globalDataObject)
        } catch {
            return []
        }
    }

    getEntries(ids: string[]): {[ID: string]: Entry<T> | undefined} {
        this.isInitiated()
        let result: {[ID: string]: Entry<T> | undefined} = {};

        for (const id of ids) {
            result[id] = this.globalDataObject[id]
        }

        return result
    }

    getAvailableEntries(): Entry<T>[] {
        this.isInitiated()
        return Object.values(this.globalDataObject);
    }

    removeEntries(...ids: string[]) {
        this.isInitiated()
        for (const id of ids) {
            delete this.globalDataObject[id];
        }
    }

    removeAllEntries() {
        this.isInitiated()
        this.globalDataObject = {}
    }

    addEntry(data: T, options: addOptions = {}): Entry<T> {
        this.isInitiated()
        if (options.id === undefined) {
            let tmpId = this.randGen.generate();

            while (this.globalDataObject[tmpId] !== undefined) {
                tmpId = this.randGen.generate();
            }

            options.id = tmpId;
        }

        const now = Date.now();

        const e = new Entry<T>({
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

    async addCustomMetadata(key: string, value: any) {
        this.isInitiated()
        this.customMetadata[key] = value
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata)
    }
    async removeCustomMetadata(...keys: string[]) {
        this.isInitiated()
        for (const key of keys) delete this.customMetadata[key]
        await this.switch.setGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, this.customMetadata)
    }
    getCustomMetadata(key: string): any {
        this.isInitiated()
        return this.customMetadata[key]
    }
    getMultipleCustomData(...keys: string[]): {[key: string]: any} {
        this.isInitiated()
        const result: {[key: string]: any} = {};

        for (const key of keys) result[key] = this.getCustomMetadata(key)

        return result
    }

    //Unlocks global data without saving newly added / removed shared data.
    async unlockGlobalData() {
        this.isInitiated()
        await this.switch.setGlobalData(this.config.scope || Scope.FlowElement, this.config.tag, this.originalGlobalDataObject)
    }

    //Saves newly added / removed shared data to the global data and unlocks it.
    async saveAndUnlockGlobalData() {
        this.isInitiated()
        await this.switch.setGlobalData(this.config.scope || EnfocusSwitch.Scope.FlowElement, this.config.tag, this.globalDataObject)
    }

    constructor(s: Switch, flowElement: FlowElement, cfg: config) {
        this.switch = s
        this.flowElement = flowElement
        this.config = makeConfigReasonable(cfg);
        this.randGen = new NameGenerator.AdvancedStringGenerator({
            minLen: 20,
            maxLen: 20,
            type: "random",
            composition: "alphaNumericOnly",
            charCase: "upperOnly",
        })
    }

    async init(): Promise<GlobalDataManager<T>> {
        const values: {[ID: string]: entry<T>} = await this.switch.getGlobalData(this.config.scope || EnfocusSwitch.Scope.FlowElement, this.config.tag, true) || {}
        this.customMetadata = await this.switch.getGlobalData(EnfocusSwitch.Scope.FlowElement, `global-data-manager-custom-metadata`, false) || this.customMetadata

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
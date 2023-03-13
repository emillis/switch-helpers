"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobManager = void 0;
class JobManager {
    flowElement;
    listOfJobIds;
    initiated = false;
    jobs = [];
    idToJob = {};
    checkInit() {
        if (!this.initiated)
            throw `JobManager has not been initiated yet! Call "await JobManager.init()" before using this method!`;
    }
    getAllJobs() {
        this.checkInit();
        return Object.values(this.idToJob);
    }
    getJob(id) {
        this.checkInit();
        try {
            return this.idToJob[id];
        }
        catch {
            return undefined;
        }
    }
    getJobOrFail(id) {
        this.checkInit();
        const errMsg = `Job with ID: "${id}" does not exist!`;
        try {
            const job = this.getJob(id);
            if (!job)
                throw errMsg;
            return job;
        }
        catch (e) {
            throw errMsg;
        }
    }
    removeJobFromJobManager(id) {
        this.checkInit();
        delete this.idToJob[id];
    }
    removeAllJobs() {
        this.checkInit();
        this.idToJob = {};
    }
    async init() {
        try {
            this.jobs = await this.flowElement.getJobs(this.listOfJobIds);
        }
        catch { }
        for (const job of this.jobs) {
            this.idToJob[job.getId()] = job;
        }
        this.initiated = true;
        return this;
    }
    constructor(flowElement, listOfJobIds) {
        if (!flowElement)
            throw `Flow element was not provided!`;
        if (!listOfJobIds)
            throw `List of job IDs was not provided!`;
        this.flowElement = flowElement;
        this.listOfJobIds = listOfJobIds;
    }
}
exports.JobManager = JobManager;

export default class JobManager {
    private readonly flowElement: FlowElement;
    private readonly listOfJobIds: string[];
    private initiated: boolean = false;
    private jobs: Job[] = [];
    private idToJob: {[id: string]: Job} = {};

    private checkInit() {
        if (!this.initiated) throw `JobManager has not been initiated yet! Call "await JobManager.init()" before using this method!`;
    }

    getAllJobs(): Job[] {
        this.checkInit()
        return Object.values(this.idToJob)
    }

    getJob(id: string): Job | undefined {
        this.checkInit()
        try {
            return this.idToJob[id]
        } catch {
            return undefined
        }
    }

    getJobOrFail(id: string): Job {
        this.checkInit()
        const errMsg = `Job with ID: "${id}" does not exist!`;

        try {
            const job = this.getJob(id);

            if (!job) throw errMsg;

            return job
        } catch (e) {
            throw errMsg;
        }
    }

    removeJobFromJobManager(id: string) {
        this.checkInit()
        delete this.idToJob[id]
    }

    removeAllJobs() {
        this.checkInit()
        this.idToJob = {}
    }

    async init() {
        try {this.jobs = await this.flowElement.getJobs(this.listOfJobIds)} catch {}

        for (const job of this.jobs) {
            this.idToJob[job.getId()] = job
        }

        this.initiated = true;
    }

    constructor(flowElement: FlowElement, listOfJobIds: string[]) {
        if (!flowElement) throw `Flow element was not provided!`;
        if(!listOfJobIds) throw `List of job IDs was not provided!`;
        this.flowElement = flowElement;
        this.listOfJobIds = listOfJobIds;
    }
}
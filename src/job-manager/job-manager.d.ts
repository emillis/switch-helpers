/// <reference types="switch-scripting" />
export declare class JobManager {
    private readonly flowElement;
    private readonly listOfJobIds;
    private initiated;
    private jobs;
    private idToJob;
    private checkInit;
    getAllJobs(): Job[];
    getJob(id: string): Job | undefined;
    getJobOrFail(id: string): Job;
    removeJobFromJobManager(id: string): void;
    removeAllJobs(): void;
    init(): Promise<void>;
    constructor(flowElement: FlowElement, listOfJobIds: string[]);
}

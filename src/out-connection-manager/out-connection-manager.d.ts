/// <reference types="switch-scripting" />
export declare type connIndex = {
    all: Connection[];
    byName: {
        [p: string]: Connection[];
    };
};
export declare type options = {
    newName?: string;
};
export declare type sendToAllOnPropertyTagConditionOptions = {
    newName?: string;
    sendCopy?: boolean;
};
export declare class OutConnectionManager {
    private readonly flowElement;
    private connectionIndex;
    private indexConnections;
    private doesTagMatch;
    removeJob(job: Job): Promise<void>;
    trafficLights: {
        sendToData: (job: Job, level: Connection.Level, options?: options | undefined) => Promise<void>;
        sendToDataSuccess: (job: Job, options?: options | undefined) => Promise<void>;
        sendToDataWarning: (job: Job, options?: options | undefined) => Promise<void>;
        sendToDataError: (job: Job, options?: options | undefined) => Promise<void>;
        sendToLog: (job: Job, level: Connection.Level, model?: DatasetModel, newName?: string) => Promise<void>;
        sendToLogSuccess: (job: Job, model?: DatasetModel, newName?: string) => Promise<void>;
        sendToLogWarning: (job: Job, model?: DatasetModel, newName?: string) => Promise<void>;
        sendToLogError: (job: Job, model?: DatasetModel, newName?: string) => Promise<void>;
    };
    sendTo(job: Job, connection: Connection, options?: options): Promise<void>;
    sendToOnPropertyTagCondition(job: Job, connection: Connection, tag: string, tag_value: string, options?: options): Promise<void>;
    sendToAllOnPropertyTagCondition(job: Job, tag: string, tag_value: string | string[], options?: sendToAllOnPropertyTagConditionOptions): Promise<void>;
    constructor(flowElement: FlowElement);
}

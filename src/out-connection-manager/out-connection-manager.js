"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutConnectionManager = void 0;
class OutConnectionManager {
    flowElement;
    connectionIndex;
    indexConnections(connections) {
        for (const connection of connections) {
            this.connectionIndex.all.push(connection);
            const connName = `${connection.getName()}`.toLowerCase();
            if (!Array.isArray(this.connectionIndex.byName[connName])) {
                this.connectionIndex.byName[connName] = [];
            }
            this.connectionIndex.byName[connName].push(connection);
        }
    }
    async doesTagMatch(connection, tag, value) {
        if (!connection.hasProperty(tag) || `${await connection.getPropertyStringValue(tag)}`.toLowerCase() !== `${value}`.toLowerCase()) {
            return false;
        }
        return true;
    }
    //Removes job - sends it to null, Job.sendToNull();
    async removeJob(job) {
        if (!job) {
            return;
        }
        await job.sendToNull();
    }
    trafficLights = {
        //Sends job to data connection with level specified
        sendToData: async function (job, level, options) {
            await job.sendToData(level, options?.newName);
        },
        //Sends job to success data connection.
        sendToDataSuccess: async function (job, options) {
            await this.sendToData(job, EnfocusSwitch.Connection.Level.Success, options);
        },
        //Sends job to warning data connection.
        sendToDataWarning: async function (job, options) {
            await this.sendToData(job, EnfocusSwitch.Connection.Level.Warning, options);
        },
        //Sends job to error data connection.
        sendToDataError: async function (job, options) {
            await this.sendToData(job, EnfocusSwitch.Connection.Level.Error, options);
        },
        //Sends job to log connection with the level specified
        sendToLog: async function (job, level, model = DatasetModel.Opaque, newName) {
            await job.sendToLog(level, model, newName);
        },
        //Sends job to success log connection.
        sendToLogSuccess: async function (job, model = DatasetModel.Opaque, newName) {
            await this.sendToLog(job, EnfocusSwitch.Connection.Level.Success, model, newName);
        },
        //Sends job to warning log connection.
        sendToLogWarning: async function (job, model = DatasetModel.Opaque, newName) {
            await this.sendToLog(job, EnfocusSwitch.Connection.Level.Warning, model, newName);
        },
        //Sends job to error log connection.
        sendToLogError: async function (job, model = DatasetModel.Opaque, newName) {
            await this.sendToLog(job, EnfocusSwitch.Connection.Level.Error, model, newName);
        }
    };
    //Same as Job.SendTo(), sens the job to connection provided
    async sendTo(job, connection, options) {
        await job.sendTo(connection, options?.newName);
    }
    //Sends a job to the connection provided if tag value matches provided value
    async sendToOnPropertyTagCondition(job, connection, tag, tag_value, options) {
        if (!await this.doesTagMatch(connection, tag, tag_value)) {
            return;
        }
        await this.sendTo(job, connection, options);
    }
    //Sends the job to all connection that have matching tag value with the one provided
    async sendToAllOnPropertyTagCondition(job, tag, tag_value, options) {
        for (const connection of this.connectionIndex.all) {
            if (!await this.doesTagMatch(connection, tag, tag_value)) {
                continue;
            }
            await this.sendTo(await job.createChild(await job.get(AccessLevel.ReadOnly)), connection, options);
        }
    }
    //flowElement - Switch's FlowElement object to be provided.
    //properties - A list of properties by which this class will index the connections
    constructor(flowElement) {
        this.flowElement = flowElement;
        this.connectionIndex = { all: [], byName: {} };
        this.indexConnections(flowElement.getOutConnections() || []);
    }
}
exports.OutConnectionManager = OutConnectionManager;

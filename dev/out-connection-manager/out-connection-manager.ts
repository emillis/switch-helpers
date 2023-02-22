export type connIndex = {
    all: Connection[],
    byName: {[p: string]: Connection[]}
}

export type options = {
    newName?: string
}

export class OutConnectionManager {
    private readonly flowElement: FlowElement;
    private connectionIndex: connIndex;

    private indexConnections(connections: Connection[]) {
        for (const connection of connections) {

            this.connectionIndex.all.push(connection);

            const connName = `${connection.getName()}`.toLowerCase();
            if (!Array.isArray(this.connectionIndex.byName[connName])) {this.connectionIndex.byName[connName] = []}

            this.connectionIndex.byName[connName].push(connection);
        }
    }

    private async doesTagMatch(connection: Connection, tag: string, value: string): Promise<boolean> {
        if (!connection.hasProperty(tag) || `${await connection.getPropertyStringValue(tag)}`.toLowerCase() !== `${value}`.toLowerCase()) {
            return false
        }

        return true
    }

    //Removes job - sends it to null, Job.sendToNull();
    async removeJob(job: Job) {
        if (!job) {return}
        await job.sendToNull()
    }

    trafficLights = {
        //Sends job to data connection with level specified
        sendToData: async function(job: Job, level: Connection.Level, options?: options) {
            await job.sendToData(level, options?.newName)
        },
        //Sends job to success data connection.
        sendToDataSuccess: async function (job: Job, options?: options) {
            await this.sendToData(job, Connection.Level.Success, options);
        },
        //Sends job to warning data connection.
        sendToDataWarning: async function (job: Job, options?: options) {
            await this.sendToData(job, Connection.Level.Warning, options);
        },
        //Sends job to error data connection.
        sendToDataError: async function (job: Job, options?: options) {
            await this.sendToData(job, Connection.Level.Error, options);
        },

        //Sends job to log connection with the level specified
        sendToLog: async function(job: Job, level: Connection.Level, model: DatasetModel = DatasetModel.Opaque, newName?: string) {
            await job.sendToLog(level, model, newName);
        },
        //Sends job to success log connection.
        sendToLogSuccess: async function(job: Job, model: DatasetModel = DatasetModel.Opaque, newName?: string) {
            await this.sendToLog(job, Connection.Level.Success, model, newName);
        },
        //Sends job to warning log connection.
        sendToLogWarning: async function(job: Job, model: DatasetModel = DatasetModel.Opaque, newName?: string) {
            await this.sendToLog(job, Connection.Level.Warning, model, newName);
        },
        //Sends job to error log connection.
        sendToLogError: async function(job: Job, model: DatasetModel = DatasetModel.Opaque, newName?: string) {
            await this.sendToLog(job, Connection.Level.Error, model, newName);
        }
    }

    //Same as Job.SendTo(), sens the job to connection provided
    async sendTo(job: Job, connection: Connection, options?: options) {
        await job.sendTo(connection, options?.newName)
    }

    //Sends a job to the connection provided if tag value matches provided value
    async sendToOnPropertyTagCondition(job: Job, connection: Connection, tag: string, tag_value: string, options?: options) {
        if (!await this.doesTagMatch(connection, tag, tag_value)) {return}

        await this.sendTo(job, connection, options);
    }

    //Sends the job to all connection that have matching tag value with the one provided
    async sendToAllOnPropertyTagCondition(job: Job, tag: string, tag_value: string, options?: options) {
        for (const connection of this.connectionIndex.all) {
            if (!await this.doesTagMatch(connection, tag, tag_value)) {
                continue
            }

            await this.sendTo(await job.createChild(await job.get(AccessLevel.ReadOnly)), connection, options)
        }
    }

    //flowElement - Switch's FlowElement object to be provided.
    //properties - A list of properties by which this class will index the connections
    constructor(flowElement: FlowElement) {
        this.flowElement = flowElement;
        this.connectionIndex = {all: [], byName: {}}

        this.indexConnections(flowElement.getOutConnections() || [])
    }
}
export type externalMetadata = {
    path:       string
    name:       string
    extension:  string
    model:      DatasetModel
}

export type internalMetadata = {
    key:        string
    value:      string
}

export type metadata = {
    external: externalMetadata[],
    internal: internalMetadata[],
}

export type fileDef = {
    path:           string
    originalName:   string
    originalPrefix: string
}

export type privateDataSignature = {
    tag: string, value: any
}

export type definitionStructure = {
    privateData:        privateDataSignature[]
    metadata:           metadata,
    file:               fileDef
}

export class DefinitionStructure {
    private readonly struct: definitionStructure;

    async addPrivateData(job: Job) {
        this.struct.privateData = await job.getPrivateData() || []
    }

    async addExternalMetadata(job: Job) {
        this.struct.metadata.external

        for (const metadata of await job.listDatasets()) {
            this.struct.metadata.external.push({
                name: metadata.name,
                model: metadata.model,
                extension: metadata.extension,
                path: `metadata/external/${metadata.name}.${metadata.extension}`
            })
        }
    }

    async addInternalMetadata(job: Job) {}

    async addFileInfo(job: Job) {
        this.struct.file.originalName =     `_${job.getId()}_${job.getName(true)}`
        this.struct.file.path =             `file/${this.struct.file.originalName}`
        this.struct.file.originalPrefix =   job.getId()
    }

    async get(): Promise<definitionStructure> {
        return this.struct
    }

    constructor() {
        this.struct = {
            privateData:            [],
            metadata: {
                external:           [],
                internal:           []
            },
            file: {
                path:               ``,
                originalName:       ``,
                originalPrefix:     ``
            }
        }

    }
}
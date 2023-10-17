"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinitionStructure = void 0;
class DefinitionStructure {
    struct;
    async addPrivateData(job) {
        this.struct.privateData = await job.getPrivateData() || [];
    }
    async addExternalMetadata(job) {
        this.struct.metadata.external;
        for (const metadata of await job.listDatasets()) {
            this.struct.metadata.external.push({
                name: metadata.name,
                model: metadata.model,
                extension: metadata.extension,
                path: `metadata/external/${metadata.name}.${metadata.extension}`
            });
        }
    }
    async addInternalMetadata(job) { }
    async addFileInfo(job) {
        this.struct.file.originalName = `_${job.getId()}_${job.getName(true)}`;
        this.struct.file.path = `file/${this.struct.file.originalName}`;
        this.struct.file.originalPrefix = job.getId();
    }
    async get() {
        return this.struct;
    }
    constructor() {
        this.struct = {
            privateData: [],
            metadata: {
                external: [],
                internal: []
            },
            file: {
                path: ``,
                originalName: ``,
                originalPrefix: ``
            }
        };
    }
}
exports.DefinitionStructure = DefinitionStructure;

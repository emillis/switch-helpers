import {GlobalSwitchConfig, NameGenerator} from "../main";
import fs from "fs-extra";
import path from "path";

export const allowedDatasetModels = {JSON: "JSON", Opaque: "Opaque"} as const;
export type allowedDatasetModels = typeof allowedDatasetModels[keyof typeof allowedDatasetModels];

export type options = {
    replaceIfExist?: boolean
}

function makeOptionsReasonable(options?: options): options {
    options = options || {}

    if (options.replaceIfExist === undefined) options.replaceIfExist = true;

    return options
}

//Typically Switch requires creating a custom file before it gets attached to a job as a dataset. This class
//abstracts that behaviour by creating those file behind the scenes, allowing only a JS object being passed in.
//The temporary created file can then be removed using "removeTmpFiles()" method.
export class DatasetGenerator {
    private readonly job: Job;
    private readonly tmpFileLocation: string;
    private readonly nameGenerator: NameGenerator.AdvancedStringGenerator;
    private tmpFileLocations: string[] = [];

    private checkForAllowedDatasetModels(val: string): boolean {
        for (const v of Object.values(allowedDatasetModels)) {
            if (val !== v) continue;
            return true;
        }

        return false
    }

    private async addJsonDataset(datasetName: string, data: any): Promise<string> {
        let location: string = "";
        for (;;) {
            location = path.join(this.tmpFileLocation, `tmp-json-dataset-${this.nameGenerator.generate()}-${this.nameGenerator.generate()}.json`);

            if (fs.existsSync(location)) {continue}

            break
        }

        if (!location) throw `Failed to generate a new name for JSON dataset file!`;

        fs.writeFileSync(location, JSON.stringify(data))

        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JSON);

        return location;
    }

    private async addOpaqueDataset(datasetName: string, data: any) {
        await this.job.createDataset(datasetName, data, EnfocusSwitch.DatasetModel.Opaque);
    }

    //datasetName - How will the dataset be called within the metadata.
    //model - Use "allowedDatasetModels" for this.
    //data - In case of JSON model, data should be a JS object and in case of an opaque model, data should be a link
    //to the file which will be attached as the opaque dataset.
    async addDataset(datasetName: string, model: allowedDatasetModels, data: any, options?: options) {
        if (!this.checkForAllowedDatasetModels(model)) throw `Dataset model "${model}" is not allowed! Allowed dataset models are: "${Object.values(allowedDatasetModels).join(`", "`)}"`;

        options = makeOptionsReasonable(options);

        //Checking whether the right type of variables are supplied to the function
        if (model === allowedDatasetModels.JSON && typeof data !== "object") throw `When using "${allowedDatasetModels.JSON}" dataset model, expecting to receive data type "object", got "${typeof data}".`;
        if (model === allowedDatasetModels.Opaque && typeof data !== "string") throw `When using "Opaque" DatasetModel, expecting to receive data of type "string", got "${typeof data}".`
        if (!datasetName) throw `Dataset name "${datasetName.toString()}" is invalid!`;

        if (options.replaceIfExist) {try {await this.job.removeDataset(datasetName)} catch {}}

        if (model === allowedDatasetModels.JSON) {
            this.tmpFileLocations.push(await this.addJsonDataset(datasetName, data))
        } else if (model === allowedDatasetModels.Opaque) {
            await this.addOpaqueDataset(datasetName, data)
        }
    }

    //This method removes all temporary created files (Switch requires a files being created before it gets attached to a job as a dataset)
    removeTmpFiles() {
        try {for (const loc of this.tmpFileLocations) {fs.unlinkSync(loc)}} catch {}
    }

    constructor(job: Job, tmpFileLocation?: string) {
        if(!tmpFileLocation) {
            tmpFileLocation = (new GlobalSwitchConfig.Fetcher()).getValueOrFail("TempMetadataFileLocation");
        }

        if (!fs.existsSync(tmpFileLocation)) throw `Temporary file location "${tmpFileLocation}" does not exist!`;

        this.job = job;
        this.tmpFileLocation = tmpFileLocation;
        this.nameGenerator = new NameGenerator.AdvancedStringGenerator({type: "random", charCase: "any", composition: "alphaNumericOnly", minLen: 30, maxLen: 30});
    }
}
import {GlobalSwitchConfig, NameGenerator} from "../main";
import fs from "fs-extra";
import path from "path";

export type options = {
    replaceIfExist?: boolean
}

function makeOptionsReasonable(options?: options): options {
    options = options || {}

    if (options.replaceIfExist === undefined) options.replaceIfExist = true;

    return options
}

function generateUniqueFileLocation(tmpLoc: string, prefix: string, ext: string, nameGen: NameGenerator.AdvancedStringGenerator): string {
    let result: string | undefined;

    if (ext[0] !== `.`) ext = `.${ext}`

    for (;;) {
        result = path.join(tmpLoc, `${prefix}${nameGen.generate()}${ext}`);

        if (fs.existsSync(result)) {continue}

        break
    }

    if (!result) throw `Failed to generate new unique file location!`;

    return result
}

//Typically Switch requires creating a custom file before it gets attached to a job as a dataset. This class
//abstracts that behaviour by creating those file behind the scenes, allowing only a JS object being passed in.
//The temporary created file can then be removed using "removeTmpFiles()" method.
export class DatasetGenerator {
    private readonly job: Job;
    private readonly tmpFileLocation: string;
    private readonly nameGenerator: NameGenerator.AdvancedStringGenerator;
    private tmpFileLocations: string[] = [];

    private async addJsonDataset(datasetName: string, data: any, isDataAFile: boolean): Promise<string> {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-json-dataset-`, `.json`, this.nameGenerator)

        if (isDataAFile) {
            location = data
        } else {
            if (typeof data === "object") data = JSON.stringify(data)
            fs.writeFileSync(location, data)
        }

        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JSON);

        return location;
    }

    private async addXmlDataset(datasetName: string, data: string, isDataAFile: boolean): Promise<string> {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-xml-dataset-`, `.xml`, this.nameGenerator)

        if (isDataAFile) {
            location = data
        } else {
            fs.writeFileSync(location, data)
        }

        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.XML);

        return location;
    }

    private async addXmpDataset(datasetName: string, data: string, isDataAFile: boolean): Promise<string> {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-xmp-dataset-`, `.xmp`, this.nameGenerator)

        if (isDataAFile) {
            location = data
        } else {
            fs.writeFileSync(location, data)
        }

        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.XMP);

        return location;
    }

    private async addJdfDataset(datasetName: string, data: string, isDataAFile: boolean): Promise<string> {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-jdf-dataset-`, `.jdf`, this.nameGenerator)

        if (isDataAFile) {
            location = data
        } else {
            fs.writeFileSync(location, data)
        }

        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JDF);

        return location;
    }

    private async addOpaqueDataset(datasetName: string, data: any) {
        await this.job.createDataset(datasetName, data, EnfocusSwitch.DatasetModel.Opaque);
    }

    //datasetName - How will the dataset be called within the metadata.
    //model - Use default Switch models for this.
    //data - In case of JSON model, data should be a JS object and in case of an opaque model, data should be a link
    //to the file which will be attached as the opaque dataset.
    async addDataset(datasetName: string, model: DatasetModel, data: any, isDataAFile: boolean, options?: options) {
        if (!datasetName) throw `Dataset name "${datasetName.toString()}" is invalid!`;
        options = makeOptionsReasonable(options);
        let tmpCurrentDatasetLoc: {name: string, model: DatasetModel, extension: string, fullPath: string} | undefined;

        if (isDataAFile && !fs.existsSync(data)) throw `Dataset to pick up was marked to be acquired from a file, but the file was not found in the location '${data}'!`;
        if (options.replaceIfExist) {
            try {
                for (const d of await this.job.listDatasets()) {
                    if (d.name !== datasetName) continue

                    const newLoc = generateUniqueFileLocation(this.tmpFileLocation, `original-metadata-backup-`, d.extension, this.nameGenerator);

                    fs.copyFileSync(await this.job.getDataset(datasetName, EnfocusSwitch.AccessLevel.ReadOnly), newLoc, fs.constants.COPYFILE_EXCL)

                    tmpCurrentDatasetLoc = {
                        name:       d.name,
                        model:      d.model,
                        extension:  d.extension,
                        fullPath:   newLoc
                    }

                    this.tmpFileLocations.push(newLoc)

                    break
                }
            } catch {}

            //Removing the original dataset
            try {await this.job.removeDataset(datasetName)} catch {}
        }

        try {

            if (model === EnfocusSwitch.DatasetModel.JSON) {
                this.tmpFileLocations.push(await this.addJsonDataset(datasetName, data, isDataAFile))
            }
            else if (model === EnfocusSwitch.DatasetModel.XML) {
                this.tmpFileLocations.push(await this.addXmlDataset(datasetName, data, isDataAFile))
            }
            else if (model === EnfocusSwitch.DatasetModel.XMP) {
                this.tmpFileLocations.push(await this.addXmpDataset(datasetName, data, isDataAFile))
            }
            else if (model === EnfocusSwitch.DatasetModel.JDF) {
                this.tmpFileLocations.push(await this.addJdfDataset(datasetName, data, isDataAFile))
            }
            else if (model === EnfocusSwitch.DatasetModel.Opaque) {
                if (typeof data !== "string") throw `When adding Opaque dataset, data must be of 'string' type containing path to a file, current data type is '${typeof data}'!`;
                if (!fs.existsSync(data)) throw `Could not find file located at '${data}' to be added as Opaque dataset named '${datasetName}'!`;
                await this.addOpaqueDataset(datasetName, data)
            }
            else {
                throw `Dataset model '${model}' is not handled!`
            }

        } catch {
            //This restores the original dataset in case of a failure to overwrite it
            if (tmpCurrentDatasetLoc) await this.job.createDataset(tmpCurrentDatasetLoc.name, tmpCurrentDatasetLoc.fullPath, tmpCurrentDatasetLoc.model)
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
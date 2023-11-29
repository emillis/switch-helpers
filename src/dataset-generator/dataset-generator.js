"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetGenerator = void 0;
const main_1 = require("../main");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
function makeOptionsReasonable(options) {
    options = options || {};
    if (options.replaceIfExist === undefined)
        options.replaceIfExist = true;
    return options;
}
function generateUniqueFileLocation(tmpLoc, prefix, ext, nameGen) {
    let result;
    if (ext[0] !== `.`)
        ext = `.${ext}`;
    for (;;) {
        result = path_1.default.join(tmpLoc, `${prefix}${nameGen.generate()}${ext}`);
        if (fs_extra_1.default.existsSync(result)) {
            continue;
        }
        break;
    }
    if (!result)
        throw `Failed to generate new unique file location!`;
    return result;
}
//Typically Switch requires creating a custom file before it gets attached to a job as a dataset. This class
//abstracts that behaviour by creating those file behind the scenes, allowing only a JS object being passed in.
//The temporary created file can then be removed using "removeTmpFiles()" method.
class DatasetGenerator {
    job;
    tmpFileLocation;
    nameGenerator;
    tmpFileLocations = [];
    async addJsonDataset(datasetName, data, isDataAFile) {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-json-dataset-`, `.json`, this.nameGenerator);
        if (isDataAFile) {
            location = data;
        }
        else {
            if (typeof data === "object")
                data = JSON.stringify(data);
            fs_extra_1.default.writeFileSync(location, data);
        }
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JSON);
        return location;
    }
    async addXmlDataset(datasetName, data, isDataAFile) {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-xml-dataset-`, `.xml`, this.nameGenerator);
        if (isDataAFile) {
            location = data;
        }
        else {
            fs_extra_1.default.writeFileSync(location, data);
        }
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.XML);
        return location;
    }
    async addXmpDataset(datasetName, data, isDataAFile) {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-xmp-dataset-`, `.xmp`, this.nameGenerator);
        if (isDataAFile) {
            location = data;
        }
        else {
            fs_extra_1.default.writeFileSync(location, data);
        }
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.XMP);
        return location;
    }
    async addJdfDataset(datasetName, data, isDataAFile) {
        let location = generateUniqueFileLocation(this.tmpFileLocation, `tmp-jdf-dataset-`, `.jdf`, this.nameGenerator);
        if (isDataAFile) {
            location = data;
        }
        else {
            fs_extra_1.default.writeFileSync(location, data);
        }
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JDF);
        return location;
    }
    async addOpaqueDataset(datasetName, data) {
        await this.job.createDataset(datasetName, data, EnfocusSwitch.DatasetModel.Opaque);
    }
    //datasetName - How will the dataset be called within the metadata.
    //model - Use default Switch models for this.
    //data - In case of JSON model, data should be a JS object and in case of an opaque model, data should be a link
    //to the file which will be attached as the opaque dataset.
    async addDataset(datasetName, model, data, isDataAFile, options) {
        if (!datasetName)
            throw `Dataset name "${datasetName.toString()}" is invalid!`;
        options = makeOptionsReasonable(options);
        let tmpCurrentDatasetLoc;
        if (isDataAFile && !fs_extra_1.default.existsSync(data))
            throw `Dataset to pick up was marked to be acquired from a file, but the file was not found in the location '${data}'!`;
        if (options.replaceIfExist) {
            try {
                for (const d of await this.job.listDatasets()) {
                    if (d.name !== datasetName)
                        continue;
                    const newLoc = generateUniqueFileLocation(this.tmpFileLocation, `original-metadata-backup-`, d.extension, this.nameGenerator);
                    fs_extra_1.default.copyFileSync(await this.job.getDataset(datasetName, EnfocusSwitch.AccessLevel.ReadOnly), newLoc, fs_extra_1.default.constants.COPYFILE_EXCL);
                    tmpCurrentDatasetLoc = {
                        name: d.name,
                        model: d.model,
                        extension: d.extension,
                        fullPath: newLoc
                    };
                    this.tmpFileLocations.push(newLoc);
                    break;
                }
            }
            catch { }
            //Removing the original dataset
            try {
                await this.job.removeDataset(datasetName);
            }
            catch { }
        }
        try {
            if (model === EnfocusSwitch.DatasetModel.JSON) {
                this.tmpFileLocations.push(await this.addJsonDataset(datasetName, data, isDataAFile));
            }
            else if (model === EnfocusSwitch.DatasetModel.XML) {
                this.tmpFileLocations.push(await this.addXmlDataset(datasetName, data, isDataAFile));
            }
            else if (model === EnfocusSwitch.DatasetModel.XMP) {
                this.tmpFileLocations.push(await this.addXmpDataset(datasetName, data, isDataAFile));
            }
            else if (model === EnfocusSwitch.DatasetModel.JDF) {
                this.tmpFileLocations.push(await this.addJdfDataset(datasetName, data, isDataAFile));
            }
            else if (model === EnfocusSwitch.DatasetModel.Opaque) {
                if (typeof data !== "string")
                    throw `When adding Opaque dataset, data must be of 'string' type containing path to a file, current data type is '${typeof data}'!`;
                if (!fs_extra_1.default.existsSync(data))
                    throw `Could not find file located at '${data}' to be added as Opaque dataset named '${datasetName}'!`;
                await this.addOpaqueDataset(datasetName, data);
            }
            else {
                throw `Dataset model '${model}' is not handled!`;
            }
        }
        catch {
            //This restores the original dataset in case of a failure to overwrite it
            if (tmpCurrentDatasetLoc)
                await this.job.createDataset(tmpCurrentDatasetLoc.name, tmpCurrentDatasetLoc.fullPath, tmpCurrentDatasetLoc.model);
        }
    }
    //This method removes all temporary created files (Switch requires a files being created before it gets attached to a job as a dataset)
    removeTmpFiles() {
        try {
            for (const loc of this.tmpFileLocations) {
                fs_extra_1.default.unlinkSync(loc);
            }
        }
        catch { }
    }
    constructor(job, tmpFileLocation) {
        if (!tmpFileLocation) {
            tmpFileLocation = (new main_1.GlobalSwitchConfig.Fetcher()).getValueOrFail("TempMetadataFileLocation");
        }
        if (!fs_extra_1.default.existsSync(tmpFileLocation))
            throw `Temporary file location "${tmpFileLocation}" does not exist!`;
        this.job = job;
        this.tmpFileLocation = tmpFileLocation;
        this.nameGenerator = new main_1.NameGenerator.AdvancedStringGenerator({ type: "random", charCase: "any", composition: "alphaNumericOnly", minLen: 30, maxLen: 30 });
    }
}
exports.DatasetGenerator = DatasetGenerator;

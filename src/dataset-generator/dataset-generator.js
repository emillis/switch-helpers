"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetGenerator = exports.allowedDatasetModels = void 0;
const main_1 = require("../main");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
exports.allowedDatasetModels = { JSON: "JSON", XML: "XML", Opaque: "Opaque" };
function makeOptionsReasonable(options) {
    options = options || {};
    if (options.replaceIfExist === undefined)
        options.replaceIfExist = true;
    return options;
}
//Typically Switch requires creating a custom file before it gets attached to a job as a dataset. This class
//abstracts that behaviour by creating those file behind the scenes, allowing only a JS object being passed in.
//The temporary created file can then be removed using "removeTmpFiles()" method.
class DatasetGenerator {
    job;
    tmpFileLocation;
    nameGenerator;
    tmpFileLocations = [];
    checkForAllowedDatasetModels(val) {
        for (const v of Object.values(exports.allowedDatasetModels)) {
            if (val !== v)
                continue;
            return true;
        }
        return false;
    }
    async addJsonDataset(datasetName, data) {
        let location = "";
        for (;;) {
            location = path_1.default.join(this.tmpFileLocation, `tmp-json-dataset-${this.nameGenerator.generate()}-${this.nameGenerator.generate()}.json`);
            if (fs_extra_1.default.existsSync(location)) {
                continue;
            }
            break;
        }
        if (!location)
            throw `Failed to generate a new name for JSON dataset file!`;
        fs_extra_1.default.writeFileSync(location, JSON.stringify(data));
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.JSON);
        return location;
    }
    async addXmlDataset(datasetName, data) {
        let location = "";
        for (;;) {
            location = path_1.default.join(this.tmpFileLocation, `tmp-xml-dataset-${this.nameGenerator.generate()}-${this.nameGenerator.generate()}.xml`);
            if (fs_extra_1.default.existsSync(location)) {
                continue;
            }
            break;
        }
        if (!location)
            throw `Failed to generate a new name for XML dataset file!`;
        fs_extra_1.default.writeFileSync(location, data);
        await this.job.createDataset(datasetName, location, EnfocusSwitch.DatasetModel.XML);
        return location;
    }
    async addOpaqueDataset(datasetName, data) {
        await this.job.createDataset(datasetName, data, EnfocusSwitch.DatasetModel.Opaque);
    }
    //datasetName - How will the dataset be called within the metadata.
    //model - Use "allowedDatasetModels" for this.
    //data - In case of JSON model, data should be a JS object and in case of an opaque model, data should be a link
    //to the file which will be attached as the opaque dataset.
    async addDataset(datasetName, model, data, options) {
        if (!this.checkForAllowedDatasetModels(model))
            throw `Dataset model "${model}" is not allowed! Allowed dataset models are: "${Object.values(exports.allowedDatasetModels).join(`", "`)}"`;
        options = makeOptionsReasonable(options);
        //Checking whether the right type of variables are supplied to the function
        if (model === exports.allowedDatasetModels.JSON && typeof data !== "object")
            throw `When using "${exports.allowedDatasetModels.JSON}" dataset model, expecting to receive data type "object", got "${typeof data}".`;
        if (model === exports.allowedDatasetModels.Opaque && typeof data !== "string")
            throw `When using "Opaque" DatasetModel, expecting to receive data of type "string", got "${typeof data}".`;
        if (!datasetName)
            throw `Dataset name "${datasetName.toString()}" is invalid!`;
        if (options.replaceIfExist) {
            try {
                await this.job.removeDataset(datasetName);
            }
            catch {
            }
        }
        if (model === exports.allowedDatasetModels.XML) {
            this.tmpFileLocations.push(await this.addXmlDataset(datasetName, data));
        }
        if (model === exports.allowedDatasetModels.JSON) {
            this.tmpFileLocations.push(await this.addJsonDataset(datasetName, data));
        }
        else if (model === exports.allowedDatasetModels.Opaque) {
            await this.addOpaqueDataset(datasetName, data);
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

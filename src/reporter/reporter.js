"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reporter = void 0;
//Constructor for ease of creation of Switch Report
const main_1 = require("../main");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
class Reporter {
    pageSetup;
    messages;
    FileSaver;
    //If new value is provided, assigns a new tab title and/or returns it
    tabTitle(newTitle) {
        if (newTitle !== undefined) {
            this.pageSetup.TabTitle = `${newTitle}`;
        }
        return this.pageSetup.TabTitle;
    }
    //If new value is provided, assigns a new page title and/or returns it
    pageTitle(newTitle) {
        if (newTitle !== undefined) {
            this.pageSetup.PageTitle = `${newTitle}`;
        }
        return this.pageSetup.PageTitle;
    }
    //Contains a list of function to return a count of errors, warnings, successes and logs
    counts = {
        //Returns number of errors present
        errors: () => { return this.messages.Errors.length; },
        //Returns number of warnings present
        warnings: () => { return this.messages.Warnings.length; },
        //Returns number of successes present
        successes: () => { return this.messages.Successes.length; },
        //Returns number of logs present
        logs: () => { return this.messages.Logs.length; },
    };
    //Contains a list of function to return all errors, warnings, successes and logs
    list = {
        //Returns an array of errors present
        errors: () => { return this.messages.Errors; },
        //Returns an array of warnings present
        warnings: () => { return this.messages.Warnings; },
        //Returns an array of successes present
        successes: () => { return this.messages.Successes; },
        //Returns an array of logs present
        logs: () => { return this.messages.Logs; }
    };
    //Adds error(s) to the report
    addErrors(...msg) {
        this.messages.Errors.push(...msg);
    }
    //Adds warnings(s) to the report
    addWarnings(...msg) {
        this.messages.Warnings.push(...msg);
    }
    //Adds successes(s) to the report
    addSuccesses(...msg) {
        this.messages.Successes.push(...msg);
    }
    //Adds logs(s) to the report
    addLogs(...msg) {
        this.messages.Logs.push(...msg);
    }
    //Returns html as string containing the report
    getReportAsHTMLString() {
        //Allowed backgrounds: "bg-success", "bg-warning", "bg-error", "bg-default" - for logs
        function makeRows(background, ...msg) {
            let results = [];
            for (let m of msg) {
                results.push(`<div class="row"><div class="cell-status ${background}"></div><div class="cell-message">${m}</div></div>`);
            }
            return results;
        }
        const rows = [
            ...makeRows("bg-error", ...this.list.errors()),
            ...makeRows("bg-warning", ...this.list.warnings()),
            ...makeRows("bg-success", ...this.list.successes()),
            ...makeRows("bg-default", ...this.list.logs()),
        ];
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${this.tabTitle()}</title>
                <style>
                    body {
                        font-family: Calibri, "Roboto", sans-serif;
                    }
                    #page-title {
                        text-align: center;
                    }
            
                    .row {
                        display: flex;
                        margin: 0 0 .5rem 0;
                    }
                    .row:hover {
                        background-color: #eee;
                    }
                    .row .cell-message {
                        flex: 24;
                        padding: 0 0 0 1rem;
                    }
                    .row .cell-status {
                        flex: 1rem;
                    }
            
                    #status-info {
                        font-size: .875rem;
                    }
            
                    .bg-error {
                        background-color: #dc3545;
                    }
                    .bg-warning {
                        background-color: #ffc107;
                    }
                    .bg-success {
                        background-color: #28a745;
                    }
                    .bg-default {
                        background-color: #999;
                    }
            
                    #stats-container {
                        display: flex;
                    }
                    #stats-container .stats-entry {
                        display: flex;
                        flex: 24;
                        text-align: center;
                        font-size: 1.125rem;
                    }
                    #stats-container .stats-entry .contents {
                        display: flex;
                        margin: 0 auto;
                    }
                    #stats-container .stats-entry .contents .indicator {
                        width: 1.5rem;
                    }
                    #stats-container .stats-entry .contents .stats {
                    }
                    #stats-container .stats-entry .contents .stats .label {
                        margin: 0 .5rem 0 0;
                    }
                    #stats-container .stats-entry .contents .stats .count {
                    }
            
                </style>
            </head>
            <body>
            
            <div id="page-title">
                <h2>${this.pageTitle()}</h2>
            </div>
            <div id="stats-container">
                <div class="stats-entry"><div class="contents"><div class="indicator bg-error"></div><div class="stats"><span class="label">Error:</span><span class="count">${this.counts.errors()}</span></div></div></div>
                <div class="stats-entry"><div class="contents"><div class="indicator bg-warning"></div><div class="stats"><span class="label">Warning:</span><span class="count">${this.counts.warnings()}</span></div></div></div>
                <div class="stats-entry"><div class="contents"><div class="indicator bg-success"></div><div class="stats"><span class="label">Success:</span><span class="count">${this.counts.successes()}</span></div></div></div>
                <div class="stats-entry"><div class="contents"><div class="indicator bg-default"></div><div class="stats"><span class="label">Log:</span><span class="count">${this.counts.logs()}</span></div></div></div>
            </div>
            <hr style="margin: 2rem 0">
            <div id="rows">
                ${rows.join("")}
            </div>
            <hr style="margin: 2rem 0">
            <div id="status-info">
                Time Created: ${(new Date()).toLocaleString("en-gb")}
            </div>
            
            </body>
            </html>
        `;
    }
    //Saves the report as HTML to the location provided (optional) and returns full path to the report
    saveAsHtml(options) {
        options = options || {};
        if (!options?.location)
            options.location = (new main_1.GlobalSwitchConfig.Fetcher()).getValueOrFail("TempMetadataFileLocation");
        if (!options?.location)
            throw `Invalid location "${options.location}" supplied! The location would be used for temporarily storing reports`;
        const nameGenerator = new main_1.NameGenerator.AdvancedStringGenerator({ type: "random", composition: "alphaNumericOnly", charCase: "upperOnly", minLen: 30, maxLen: 30 });
        let fullPath = options.name ? path_1.default.join(options.location, options.name) : undefined;
        while (!fullPath || fs.existsSync(fullPath)) {
            fullPath = path_1.default.join(options.location, `report-${nameGenerator.generate()}-${nameGenerator.generate()}.html`);
        }
        if (!fullPath) {
            throw `Invalid location "${fullPath}" supplied as place where to save an html report!`;
        }
        this.FileSaver.save(fullPath, this.getReportAsHTMLString());
        return fullPath;
    }
    async attachReport(job, options) {
        const datasetGenerator = new main_1.DatasetGenerator.DatasetGenerator(job, options?.tmpLocation);
        const reportLocation = this.saveAsHtml({ location: options.tmpLocation, name: options.tmpReportFileName });
        await datasetGenerator.addDataset(options.datasetName, main_1.DatasetGenerator.allowedDatasetModels.Opaque, reportLocation, { replaceIfExist: true });
        return reportLocation;
    }
    async sendWithReportAttached(job, flowElement, options) {
        if (!job)
            throw `"job" is not provided as an argument to method "sendWithReportAttached"!`;
        const ConnManager = new main_1.OutConnectionManager.OutConnectionManager(flowElement);
        const reportLocation = await this.attachReport(job, { datasetName: options.datasetName, tmpLocation: options.tmpLocation, tmpReportFileName: options.tmpReportFileName });
        if (this.counts.errors()) {
            await ConnManager.trafficLights.sendToLogError(await job.createChild(reportLocation), EnfocusSwitch.DatasetModel.Opaque, options.newJobName);
            await ConnManager.trafficLights.sendToDataError(job, { newName: options.newJobName });
        }
        else if (this.counts.warnings()) {
            await ConnManager.trafficLights.sendToLogWarning(await job.createChild(reportLocation), EnfocusSwitch.DatasetModel.Opaque, options.newJobName);
            await ConnManager.trafficLights.sendToDataWarning(job, { newName: options.newJobName });
        }
        else {
            await ConnManager.trafficLights.sendToLogSuccess(await job.createChild(reportLocation), EnfocusSwitch.DatasetModel.Opaque, options.newJobName);
            await ConnManager.trafficLights.sendToDataSuccess(job, { newName: options.newJobName });
        }
    }
    constructor(pageSetup) {
        pageSetup = pageSetup || { TabTitle: "Report", PageTitle: "Report" };
        this.pageSetup = pageSetup;
        this.messages = { Errors: [], Warnings: [], Successes: [], Logs: [] };
        this.FileSaver = new main_1.FileSaver.FileSaver({
            createFoldersRecursively: true,
            ifFileExist: main_1.FileSaver.fileExistOptions.addVersionNumber
        });
    }
}
exports.Reporter = Reporter;

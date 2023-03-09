//Constructor for ease of creation of Switch Report
import {NameGenerator, GlobalSwitchConfig, FileSaver, OutConnectionManager, DatasetGenerator} from "../main";
import path from "path";
import * as fs from "fs-extra";

export type pageSetup = { TabTitle: string, PageTitle: string }
export type messages = { Errors: string[], Warnings: string[], Successes: string[], Logs: string[] }

export class Reporter {
    private readonly pageSetup: pageSetup;
    private readonly messages: messages;
    private readonly FileSaver: FileSaver.FileSaver;

    //If new value is provided, assigns a new tab title and/or returns it
    tabTitle(newTitle?: string): string {
        if (newTitle !== undefined) {
            this.pageSetup.TabTitle = `${newTitle}`
        }

        return this.pageSetup.TabTitle;
    }
    //If new value is provided, assigns a new page title and/or returns it
    pageTitle(newTitle?: string): string {
        if (newTitle !== undefined) {
            this.pageSetup.PageTitle = `${newTitle}`;
        }

        return this.pageSetup.PageTitle
    }

    //Contains a list of function to return a count of errors, warnings, successes and logs
    counts = {
        //Returns number of errors present
        errors: ()=>{return this.messages.Errors.length},
        //Returns number of warnings present
        warnings: ()=>{return this.messages.Warnings.length},
        //Returns number of successes present
        successes: ()=>{return this.messages.Successes.length},
        //Returns number of logs present
        logs: ()=>{return this.messages.Logs.length},
    }

    //Contains a list of function to return all errors, warnings, successes and logs
    list = {
        //Returns an array of errors present
        errors: ()=>{return this.messages.Errors},
        //Returns an array of warnings present
        warnings: ()=>{return this.messages.Warnings},
        //Returns an array of successes present
        successes: ()=>{return this.messages.Successes},
        //Returns an array of logs present
        logs: ()=>{return this.messages.Logs}
    }

    //Adds error(s) to the report
    addErrors(...msg: string[]) {
        this.messages.Errors.push(...msg);
    }
    //Adds warnings(s) to the report
    addWarnings(...msg: string[]) {
        this.messages.Warnings.push(...msg);
    }
    //Adds successes(s) to the report
    addSuccesses(...msg: string[]) {
        this.messages.Successes.push(...msg);
    }
    //Adds logs(s) to the report
    addLogs(...msg: string[]) {
        this.messages.Logs.push(...msg);
    }

    //Returns html as string containing the report
    getReportAsHTMLString(): string {

        //Allowed backgrounds: "bg-success", "bg-warning", "bg-error", "bg-default" - for logs
        function makeRows(background: string, ...msg: string[]): string[] {
            let results: string[] = [];

            for (let m of msg) {
                results.push(`<div class="row"><div class="cell-status ${background}"></div><div class="cell-message">${m}</div></div>`)
            }

            return results
        }

        const rows: string[] = [
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
                <title>hello world</title>
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
        `
    }

    //Saves the report as HTML to the location provided (optional) and returns full path to the report
    saveAsHtml(options?: {name?: string, location?: string}): string {
        options = options || {}
        if (!options?.location) options.location = (new GlobalSwitchConfig.Fetcher()).getValueOrFail("TempMetadataFileLocation")
        if (!options?.location) throw `Invalid location "${options.location}" supplied! The location would be used for temporarily storing reports`;
        const nameGenerator = new NameGenerator.AdvancedStringGenerator({type: "random", composition: "alphaNumericOnly", charCase: "upperOnly", minLen: 30, maxLen: 30});

        let fullPath: string | undefined = options.name ? path.join(options.location, options.name) : undefined;

        while (!fullPath || fs.existsSync(fullPath)) {
            fullPath = path.join(options.location, `report-${nameGenerator.generate()}-${nameGenerator.generate()}.html`)
        }

        if (!fullPath) {throw `Invalid location "${fullPath}" supplied as place where to save an html report!`}

        this.FileSaver.save(fullPath, this.getReportAsHTMLString())
        return fullPath
    }

    async sendWithReportAttached(job: Job, flowElement: FlowElement, options?: {datasetName?: string, tmpLocation?: string, tmpReportFileName?: string, newJobName?: string}) {
        if (!job) {throw `"job" is not provided as an argument to method "sendJobToConnection"!`}
        const datasetGenerator = new DatasetGenerator.DatasetGenerator(job, options?.tmpLocation);
        options = options || {};

        const ConnManager = new OutConnectionManager.OutConnectionManager(flowElement);

        // await datasetGenerator.addDataset(options.datasetName || `default-report-name`, DatasetGenerator.allowedDatasetModels.Opaque, `C:\\Users\\service_switch\\Desktop\\dummy.txt`)
        await datasetGenerator.addDataset(options.datasetName || `default-report-name`, DatasetGenerator.allowedDatasetModels.Opaque, this.saveAsHtml({location: options.tmpLocation, name: options.tmpReportFileName}))

        if (this.counts.errors()) {
            await ConnManager.trafficLights.sendToDataError(job, {newName: options.newJobName})
            await ConnManager.trafficLights.sendToLogError(job, DatasetModel.Opaque, options.newJobName)
        } else if (this.counts.warnings()) {
            await ConnManager.trafficLights.sendToDataWarning(job, {newName: options.newJobName})
            await ConnManager.trafficLights.sendToLogWarning(job, DatasetModel.Opaque, options.newJobName)
        } else {
            await ConnManager.trafficLights.sendToDataSuccess(job, {newName: options.newJobName})
            await ConnManager.trafficLights.sendToLogSuccess(job, DatasetModel.Opaque, options.newJobName)
        }
    }

    constructor(pageSetup?: pageSetup) {
        pageSetup = pageSetup || {TabTitle: "Report", PageTitle: "Report"}
        this.pageSetup = pageSetup;
        this.messages = {Errors: [], Warnings: [], Successes: [], Logs: []};
        this.FileSaver = new FileSaver.FileSaver({
            createFoldersRecursively: true,
            ifFileExist: FileSaver.fileExistOptions.addVersionNumber
        });
    }
}

// function SwitchReport() {
//
//     let options = {
//         PageTitle: "",
//         TabTitle: "",
//         RowCounts: {
//             Error: 0,
//             Warning: 0,
//             Success: 0,
//         },
//         MessageByType: {
//             Error: [],
//             Warning: [],
//             Success: [],
//             Log: [],
//         },
//         Rows: [],
//     }
//
//     const thisFunction = this;
//
//     this.setPageTitle = function (newTitle) {
//         options.PageTitle = newTitle
//
//         return thisFunction;
//     }
//     this.getPageTitle = function () {
//         return options.PageTitle
//     }
//
//     this.setTabTitle = function (newTitle) {
//         options.TabTitle = newTitle
//
//         return thisFunction;
//     }
//     this.getTabTitle = function () {
//         return options.TabTitle
//     }
//
//     this.addErrorRow = function (...messages) {
//         thisFunction.addRow("error", ...messages);
//         options.MessageByType.Error.push(...messages)
//         options.RowCounts.Error++
//     }
//     this.addWarningRow = function (...messages) {
//         thisFunction.addRow("warning", ...messages);
//         options.MessageByType.Warning.push(...messages)
//         options.RowCounts.Warning++
//     }
//     this.addSuccessRow = function (...messages) {
//         thisFunction.addRow("success", ...messages);
//         options.MessageByType.Success.push(...messages)
//         options.RowCounts.Success++
//     }
//
//     this.addRow = function (rowType, ...messages) {
//         let colours = {
//             success: "bg-success",
//             warning: "bg-warning",
//             error: "bg-error",
//         }
//
//         let color = colours[rowType] || "bg-default"
//
//         for (let message of messages) {
//             options.Rows.push(`
//             <div class="row">
//               <div class="cell-status ${color}"></div>
//               <div class="cell-message">${message}</div>
//             </div>
//         `)
//         }
//     }
//
//     this.ErrorCount = function () {
//         return options.RowCounts.Error
//     }
//     this.WarningCount = function () {
//         return options.RowCounts.Warning
//     }
//     this.SuccessCount = function () {
//         return options.RowCounts.Success
//     }
//
//     this.ListErrors = function () {return options.MessageByType.Error}
//     this.ListWarnings = function () {return options.MessageByType.Warning}
//     this.ListSuccess = function () {return options.MessageByType.Success}
//
//     this.generateHtmlReport = function () {
//         return `
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//               <meta charset="UTF-8">
//               <title>${options.TabTitle}</title>
//               <style>
//                 #page-title {
//                   text-align: center;
//                 }
//
//                 .row {
//                   display: flex;
//                   margin: 0 0 .5rem 0;
//                 }
//                 .row:hover {
//                   background-color: #eee;
//                 }
//                 .row .cell-message {
//                   flex: 24;
//                   padding: 0 0 0 1rem;
//                 }
//                 .row .cell-status {
//                   flex: 1rem;
//                 }
//
//                 #status-info {
//                   font-size: .875rem;
//                 }
//
//                 .bg-error {
//                   background-color: #dc3545;
//                 }
//                 .bg-warning {
//                   background-color: #ffc107;
//                 }
//                 .bg-success {
//                   background-color: #28a745;
//                 }
//                 .bg-default {
//                   background-color: #999;
//                 }
//               </style>
//             </head>
//             <body>
//               <div id="page-title">
//                 <h2>${options.PageTitle}</h2>
//               </div>
//               <div id="rows">
//                 ${options.Rows.join("")}
//               </div>
//               <hr style="margin: 2rem 0">
//               <div id="status-info">
//                 Time Created: ${GenerateDateString(".", false)}
//               </div>
//             </body>
//             </html>
//         `
//     }
//
//     this.generateHtmlReportAsFile = function(tmpFileLocation) {
//         return CreateNewTmpFile(path.join(tmpFileLocation, GenerateNewName(`tmpHtml`, `_report.html`)), thisFunction.generateHtmlReport())
//     }
//
//     this.sendJobToConnection = async function (job, tmpFileLocation, newName) {
//         if (!job) {throw `"job" is not provided as an argument to method "sendJobToConnection"!`}
//         tmpFileLocation = tmpFileLocation || (GetGlobalSwitchConfig())["TempMetadataFileLocation"]
//
//         const ConnManager = new OutgoingConnectionManager(job, newName);
//
//         const sender = thisFunction.ErrorCount() ? ConnManager.error : thisFunction.WarningCount() ? ConnManager.warning : ConnManager.success
//
//         await sender(thisFunction.generateHtmlReportAsFile(tmpFileLocation));
//     }
// }
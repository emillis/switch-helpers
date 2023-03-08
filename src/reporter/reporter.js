"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Reporter = void 0;
//Constructor for ease of creation of Switch Report
const main_1 = require("../main");
const path_1 = __importDefault(require("path"));
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
              </style>
            </head>
            <body>
              <div id="page-title">
                <h2>${this.pageTitle()}</h2>
              </div>
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
    saveAsHtml(location) {
        if (!location) {
            location = (new main_1.GlobalSwitchConfig.Fetcher()).getValueOrFail("TempMetadataFileLocation");
        }
        const parsedLocation = path_1.default.parse(location);
        let base = parsedLocation.base;
        if (!base) {
            const nameGenerator = new main_1.NameGenerator.AdvancedStringGenerator({ type: "random", composition: "alphaNumericOnly", charCase: "upperOnly", minLen: 30, maxLen: 30, });
            base = `report-${nameGenerator.generate()}-${nameGenerator.generate()}.html`;
        }
        if (!parsedLocation.dir) {
            throw new Error(`Something went wrong.. While generating html report, directory has not been acquired! Got "${parsedLocation.dir}".`);
        }
        return path_1.default.join(parsedLocation.base, this.FileSaver.save(path_1.default.join(parsedLocation.dir, base), this.getReportAsHTMLString()));
    }
    async sendWithReportAttached(job, flowElement, options) {
        if (!job) {
            throw `"job" is not provided as an argument to method "sendJobToConnection"!`;
        }
        const datasetGenerator = new main_1.DatasetGenerator.DatasetGenerator(job, options?.tmpLocation);
        options = options || {};
        const ConnManager = new main_1.OutConnectionManager.OutConnectionManager(flowElement);
        await datasetGenerator.addDataset(options.datasetName || `default-report-name`, main_1.DatasetGenerator.allowedDatasetModels.Opaque, this.saveAsHtml(options.tmpLocation));
        if (this.counts.errors()) {
            await ConnManager.trafficLights.sendToDataError(job, { newName: options.newJobName });
        }
        else if (this.counts.warnings()) {
            await ConnManager.trafficLights.sendToDataWarning(job, { newName: options.newJobName });
        }
        else if (this.counts.successes()) {
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

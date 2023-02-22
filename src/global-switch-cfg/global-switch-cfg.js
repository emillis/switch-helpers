"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fetcher = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
//Reads environmental variable passed in (which is supposed to point to a Switch Config JSON file), reads
//the file and returns as JSON object
class Fetcher {
    obj;
    location;
    constructor(env_var = "SwitchConfig") {
        this.location = process.env[env_var] || "";
        if (!this.location) {
            throw new Error(`Environmental variable "${env_var}" is not set!`);
        }
        if (!fs_extra_1.default.existsSync(this.location)) {
            throw new Error(`Global switch config doe not exist in "${this.location}"!`);
        }
        try {
            this.obj = JSON.parse(fs_extra_1.default.readFileSync(this.location, "utf-8"));
        }
        catch (e) {
            throw new Error(`Invalid JSON file format referred from "${env_var}" environmental variable, location "${this.location}"! Original error: "${e}"`);
        }
    }
    getValue(...path) {
        let result = this.obj;
        try {
            for (const segment of path) {
                result = result[segment];
            }
        }
        catch (e) {
            return undefined;
        }
        return result;
    }
    getValueOrFail(...path) {
        const result = this.getValue(...path);
        if (result === undefined) {
            throw `Value '${path.join(`'.'`)}' does not exist in global switch config file "${this.location}"!`;
        }
        return result;
    }
    getObject() {
        return this.obj;
    }
}
exports.Fetcher = Fetcher;

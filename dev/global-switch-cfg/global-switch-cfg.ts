import fs from "fs-extra"

//Reads environmental variable passed in (which is supposed to point to a Switch Config JSON file), reads
//the file and returns as JSON object
export class Fetcher {
    private readonly obj: any;
    private readonly location: string;

    constructor(env_var: string = "SwitchConfig") {
        this.location = process.env[env_var] || "";

        if (!this.location) {throw new Error(`Environmental variable "${env_var}" is not set!`)}
        if (!fs.existsSync(this.location)) {throw new Error(`Global switch config doe not exist in "${this.location}"!`)}

        try {
            this.obj = JSON.parse(fs.readFileSync(this.location, "utf-8"))
        } catch (e) {
            throw new Error(`Invalid JSON file format referred from "${env_var}" environmental variable, location "${this.location}"! Original error: "${e}"`)
        }
    }

    getValue(...path: string[]): string | undefined {
        let result: any = this.obj;

        try {
            for (const segment of path) {
                result = result[segment];
            }
        } catch (e) {
            return undefined
        }

        return result
    }

    getValueOrFail(...path: string[]): string {
        const result = this.getValue(...path)

        if (result === undefined) {
            throw `Value '${path.join(`'.'`)}' does not exist in global switch config file "${this.location}"!`
        }

        return result
    }

    getObject(): any {
        return this.obj
    }
}
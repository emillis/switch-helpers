export declare class Fetcher {
    private readonly obj;
    private readonly location;
    constructor(env_var?: string);
    getValue(...path: string[]): string | undefined;
    getValueOrFail(...path: string[]): string;
    getObject(): any;
}

export type dateOptions = {
    format?: string;
    separator?: string;
};
export declare function newDate(dateOptions?: dateOptions): string;
export type options = {
    prefix?: string;
    suffix?: string;
    separator?: string;
    includeDate?: boolean;
    includeRandomNumber?: boolean;
};
export declare function newName(options?: options): string;
export declare const generationTypes: {
    readonly dateTime: "dateTime";
    readonly random: "random";
};
export type generationTypes = typeof generationTypes[keyof typeof generationTypes];
export declare const charCase: {
    readonly upperOnly: "upperOnly";
    readonly lowerOnly: "lowerOnly";
    readonly any: "any";
};
export type charCase = typeof charCase[keyof typeof charCase];
export declare const composition: {
    readonly alphaOnly: "alphaOnly";
    readonly numericOnly: "numericOnly";
    readonly alphaNumericOnly: "alphaNumericOnly";
};
export type composition = typeof composition[keyof typeof composition];
export type advanceOptions = {
    type?: generationTypes;
    dateTimeFormat?: string;
    charCase?: charCase;
    composition?: composition;
    minLen?: number;
    maxLen?: number;
    allowedSpecialChars?: string;
    minSpecialChars?: number;
    maxSpecialChars?: number;
};
export declare class AdvancedStringGenerator {
    private readonly options;
    private readonly regexStr;
    private encrypt;
    private generateDateTime;
    private manageCharCase;
    private getRandBetween;
    private addSpecialChars;
    private generateRandomText;
    generate(): string;
    constructor(options?: advanceOptions);
}

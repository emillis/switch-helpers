import * as crypto from "crypto";

export type dateOptions = {
    //Format of the output date the following values will get replaced with the actual date values:
    //YYYY = Current Year (4 digits)
    //MM = Current month (1-12)
    //DD = Current day (1-31)
    //hh = Current hour (24h format)
    //mm = Current minute (0-59)
    //ss = Current second (0-59)
    //SSS = Current millisecond (0-999)
    //So a format of "YYYY-MM-DD hh:mm:ss.SSS" would result in "1990-09-27 15:37:02.308"
    format?: string

    //Separator for each of the segments of the datetime
    separator?: string
}

function makeDateOptionsReasonable(dateOptions?: dateOptions): dateOptions {
    dateOptions = dateOptions || {};

    dateOptions.separator  = dateOptions.separator === undefined ? "-" : dateOptions.separator;
    dateOptions.format = dateOptions.format === undefined ? `YYYY${dateOptions.separator}MM${dateOptions.separator}DD${dateOptions.separator}hh${dateOptions.separator}mm${dateOptions.separator}ss${dateOptions.separator}SSS` : dateOptions.format

    return dateOptions
}

// export function newDate(dateOptions?: dateOptions): string {
export function newDate(dateOptions?: dateOptions): string {
    dateOptions = makeDateOptionsReasonable(dateOptions);
    const d = new Date();

    let format = dateOptions.format || "";

    const month = `${d.getMonth()+1}`;
    const day = `${d.getDate()}`;
    const hour = `${d.getHours()}`;
    const minute = `${d.getMinutes()}`;
    const second = `${d.getSeconds()}`;
    const millisecond = `${d.getMilliseconds()}`;

    format = format.replaceAll(`YYYY`, `${d.getFullYear()}`)
    format = format.replaceAll(`MM`, month.length < 2 ? `0${month}` : month)
    format = format.replaceAll(`DD`, day.length < 2 ? `0${day}` : day)
    format = format.replaceAll(`hh`, hour.length < 2 ? `0${hour}` : hour)
    format = format.replaceAll(`mm`, minute.length < 2 ? `0${minute}` : minute)
    format = format.replaceAll(`ss`, second.length < 2 ? `0${second}` : second)
    format = format.replaceAll(`SSS`, millisecond.length < 3 ? millisecond.length < 2 ? `00${millisecond}` : `0${millisecond}` : millisecond)

    return format
}

export type options = {
    prefix?: string,
    suffix?: string,
    separator?: string,
    includeDate?: boolean,
    includeRandomNumber?: boolean,
}

//Takes options and adds default values / checks supplied ones.
function makeOptionsReasonable(options?: options): options {
    options = options || {}

    options.prefix = options.prefix === undefined ? "" : `${options.prefix}`
    options.suffix = options.suffix === undefined ? "" : `${options.suffix}`
    options.separator = options.separator === undefined ? "_" : `${options.separator}`
    options.includeDate = options.includeDate === undefined ? true : options.includeDate
    options.includeRandomNumber = options.includeRandomNumber === undefined ? true : options.includeRandomNumber

    return options
}

//Generating a new name perfect for using with creation of random files. Note: existing file check should still
//be performed as there's a micro chance to produce a duplicate name
// export function newName(options?: options) {
export function newName(options?: options) {
    options = makeOptionsReasonable(options);
    return `${options.prefix ? options.prefix + options.separator : ""}${options.includeDate ? newDate() + options.separator : ""}${options.includeRandomNumber ? Math.round(Math.random() * 1000000000000) : ""}${options.suffix ? options.separator + options.suffix : ""}`
}

export const generationTypes = {dateTime: "dateTime", random: "random"} as const;
export type generationTypes = typeof generationTypes[keyof typeof generationTypes];

export const charCase = {upperOnly: "upperOnly", lowerOnly: "lowerOnly", any: "any"} as const;
export type charCase = typeof charCase[keyof typeof charCase];

export const composition = {alphaOnly: "alphaOnly", numericOnly: "numericOnly", alphaNumericOnly: "alphaNumericOnly"} as const;
export type composition = typeof composition[keyof typeof composition];

export type advanceOptions = {
    type?: generationTypes,
    dateTimeFormat?: string,
    charCase?: charCase,
    composition?: composition
    minLen?: number
    maxLen?: number
    allowedSpecialChars?: string
    minSpecialChars?: number
    maxSpecialChars?: number
}

function makeAdvancedOptionsReasonable(options?: advanceOptions): advanceOptions {
    options = options || {}

    options.type = options.type === undefined ? generationTypes.dateTime : options.type
    options.dateTimeFormat = options.dateTimeFormat === undefined ? "YYYY-MM-DD hh:mm:ss.SSS" : options.dateTimeFormat
    options.charCase = options.charCase === undefined ? charCase.any : options.charCase
    options.composition = options.composition === undefined ? composition.alphaNumericOnly : options.composition
    options.minLen = options.minLen === undefined || options.minLen < 0 ? 0 : options.minLen
    options.maxLen = options.maxLen === undefined || options.maxLen < 0 ? 64 : options.maxLen

    if (options.maxLen < options.minLen) {options.maxLen = options.minLen}

    options.allowedSpecialChars = options.allowedSpecialChars === undefined ? "" : options.allowedSpecialChars
    options.minSpecialChars = options.minSpecialChars === undefined || options.minSpecialChars < 0 ? 0 : options.minSpecialChars
    options.maxSpecialChars = options.maxSpecialChars === undefined || options.maxSpecialChars < 0 ? 0 : options.maxSpecialChars

    if (options.minSpecialChars > options.maxLen) {options.minSpecialChars = options.maxLen}
    if (options.maxSpecialChars > options.maxLen) {options.maxSpecialChars = options.maxLen}
    if (options.maxSpecialChars < options.minSpecialChars) {options.maxSpecialChars = options.minSpecialChars}

    return options
}

export class AdvancedStringGenerator {
    private readonly options: advanceOptions;
    private readonly regexStr: RegExp;

    private encrypt(val: string): string {
        return crypto.createHash("RSA-SHA512").update(val).digest("base64url")
    }

    private generateDateTime(): string {
        const d = new Date();

        let format = this.options.dateTimeFormat || "";

        const month = `${d.getMonth()+1}`;
        const day = `${d.getDate()}`;
        const hour = `${d.getHours()}`;
        const minute = `${d.getMinutes()}`;
        const second = `${d.getSeconds()}`;
        const millisecond = `${d.getMilliseconds()}`;

        format = format.replaceAll(`YYYY`, `${d.getFullYear()}`)
        format = format.replaceAll(`MM`, month.length < 2 ? `0${month}` : month)
        format = format.replaceAll(`DD`, day.length < 2 ? `0${day}` : day)
        format = format.replaceAll(`hh`, hour.length < 2 ? `0${hour}` : hour)
        format = format.replaceAll(`mm`, minute.length < 2 ? `0${minute}` : minute)
        format = format.replaceAll(`ss`, second.length < 2 ? `0${second}` : second)
        format = format.replaceAll(`SSS`, millisecond.length < 3 ? millisecond.length < 2 ? `00${millisecond}` : `0${millisecond}` : millisecond)

        return format
    }

    private manageCharCase(val: string): string {
        if (this.options.charCase === charCase.upperOnly) {
            return `${val}`.toUpperCase();
        } else if (this.options.charCase === charCase.lowerOnly) {
            return `${val}`.toLowerCase();
        } else if (this.options.charCase === charCase.any) {
            return `${val}`
        } else {
            throw `Invalid charCase selected! Value "${this.options.charCase}" is not allowed, allowed values are: "${Object.values(charCase).join(`", "`)}"`
        }
    }

    private getRandBetween(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    private addSpecialChars(val: string): string {
        const randChars = (this.options.allowedSpecialChars || "").split("");
        if (!randChars.length) {return val}

        this.options.minSpecialChars = this.options.minSpecialChars || 0
        this.options.maxSpecialChars = this.options.maxSpecialChars || 64

        const n = this.getRandBetween(this.options.minSpecialChars, this.options.maxSpecialChars <= val.length ? this.options.maxSpecialChars : val.length);
        console.log(`Replacing "${n}" character(s) with special characters which are: "${this.options.allowedSpecialChars}"`);

        let valueIndexed: {letter: string, index: number}[] = [];
        for (const char of val.split("")) {valueIndexed.push({letter: char, index: valueIndexed.length})}


        for (let i = 0; i < n ; i++) {
            if (!valueIndexed.length) {break}
            const x = this.getRandBetween(0, valueIndexed.length-1);
            const randChar = randChars[this.getRandBetween(0, randChars.length-1)]
            const char = valueIndexed[x];

            val = `${val.substring(0, char.index)}${randChar}${val.substring(char.index + 1, val.length)}`

            valueIndexed.splice(x, 1);
        }

        return val
    }

    private generateRandomText(): string {
        let result = "";

        let ok = false;

        while (!ok) {
            result = `${result}${this.encrypt(`${(new Date()).toString()}${Math.random()}${Math.random()}`).replaceAll(this.regexStr, "")}`;

            result = this.manageCharCase(result);

            if (result.length < (this.options.minLen || 0)) {continue}
            if (result.length > (this.options.maxLen || 64)) {result = result.substring(0, this.getRandBetween((this.options.minLen || 0), (this.options.maxLen || 64)))}

            result = this.addSpecialChars(result);

            ok = true;
        }

        return result
    }

    generate(): string {
        if (this.options.type === generationTypes.dateTime) {
            return this.generateDateTime();
        }

        return this.generateRandomText();
    }

    constructor(options?: advanceOptions) {
        this.options = makeAdvancedOptionsReasonable(options);

        if (this.options.composition === composition.alphaNumericOnly) {
            this.regexStr = /([^A-Za-z0-9]+)/gi;
        } else if (this.options.composition === composition.alphaOnly) {
            this.regexStr = /([^A-Za-z]+)/gi;
        } else if (this.options.composition === composition.numericOnly) {
            this.regexStr = /([^0-9]+)/gi;
        } else {
            throw `String composition option "${this.options.composition}" is not allowed! Allowed options are: "${Object.values(composition).join(`", "`)}"`
        }
    }
}

// const g = new AdvancedStringGenerator({
//     type: generationTypes.random,
//     charCase: charCase.any,
//     composition: composition.alphaNumericOnly,
//     minLen: 20,
//     maxLen: 24,
//     allowedSpecialChars: ``,
//     minSpecialChars: 1,
//     maxSpecialChars: 3
// })
//
// const result = g.generate();
//
// console.log({
//     value: result,
//     length: result.length
// });
















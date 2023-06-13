import { ResizeOptions, Sharp } from "sharp";
export declare type allowedSuffixOptions = `none` | `dimensions` | `widthOnly` | `heightOnly`;
export declare type resizerSaveOptions = {
    suffix?: allowedSuffixOptions;
    separator?: string;
};
export declare type imageOption = {
    w?: number;
    h?: number;
    o?: ResizeOptions;
};
export declare type imageToSave = imageOption & {
    image: Sharp;
};

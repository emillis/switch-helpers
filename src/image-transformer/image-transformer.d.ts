import {ResizeOptions, Sharp} from "sharp";

export type allowedSuffixOptions = `none` | `dimensions` | `widthOnly` | `heightOnly`;
export type resizerSaveOptions = {
    suffix?: allowedSuffixOptions;
    separator?: string;
};
export type imageOption = {
    w?: number;
    h?: number;
    o?: ResizeOptions;
};
export type imageToSave = imageOption & {
    image: Sharp;
};

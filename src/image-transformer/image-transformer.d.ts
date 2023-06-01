import { ResizeOptions, Sharp, SharpOptions } from "sharp";
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
export declare class Resizer {
    private readonly origin;
    private readonly originExtension;
    private readonly sharpOptions;
    private readonly resizeOptions;
    private readonly imagesToSave;
    private calculateNewDimensions;
    private generateSuffix;
    resize(images: imageOption[]): void;
    save(loc: string, options?: resizerSaveOptions): Promise<string[]>;
    constructor(origin: string, options?: {
        sharpOptions?: SharpOptions;
    });
}

import { ResizeOptions, Sharp, SharpOptions } from "sharp";
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
export declare class Resizer {
    private readonly origin;
    private readonly originExtension;
    private readonly sharpOptions;
    private readonly resizeOptions;
    private readonly imagesToSave;
    private calculateNewDimensions;
    private generateSuffix;
    resize(images: imageOption[]): void;
    save(loc: string, options?: resizerSaveOptions): Promise<void>;
    constructor(origin: string, options?: {
        sharpOptions?: SharpOptions;
    });
}

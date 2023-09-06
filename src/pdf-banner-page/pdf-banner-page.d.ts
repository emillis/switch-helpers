export declare const bannerPageLocation: {
    readonly start: "start";
    readonly end: "end";
};
export declare type bannerPageLocation = typeof bannerPageLocation[keyof typeof bannerPageLocation];
export declare type dataEntry = {
    value: string;
    posX: number;
    posY: number;
    fontSize: number;
};
export declare type addSheetOptions = {
    dataEntries: dataEntry[];
    width?: number;
    height?: number;
    location?: bannerPageLocation;
};
export declare class BannerSheet {
    private wasInitiated;
    private readonly pdfLoc;
    private doc;
    private checkInitiated;
    private getFirstPageSize;
    private verifyAddSheetOptions;
    addPage(options: addSheetOptions): void;
    save(location: string): Promise<void>;
    constructor(pdfLoc: string);
    init(): Promise<BannerSheet>;
}

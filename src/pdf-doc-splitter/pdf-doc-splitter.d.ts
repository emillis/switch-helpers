export declare class Splitter {
    private initialized;
    private readonly pdfLocation;
    private docToSplit;
    private docsToSave;
    private wasInitialized;
    private prettifySplitValue;
    splitToEqualBatches(batchSize: number, options?: {
        batchNumberingType?: "range" | "sequential";
        sequentialMinlength?: number;
    }): Promise<void>;
    splitToDefinedLengths(lengths: (string | number)[]): Promise<void>;
    private split;
    save(location: string, options?: {
        separator?: string;
    }): Promise<void>;
    constructor(pdfLocation: string);
    init(): Promise<Splitter>;
}

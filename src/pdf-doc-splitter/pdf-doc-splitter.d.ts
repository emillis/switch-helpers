export declare class Splitter {
    private initialized;
    private readonly pdfLocation;
    private docToSplit;
    private docsToSave;
    private wasInitialized;
    private prettifySplitValue;
    split(split: (string | number)[]): Promise<void>;
    save(location: string, options?: {
        separator?: string;
    }): Promise<void>;
    constructor(pdfLocation: string);
    init(): Promise<Splitter>;
}

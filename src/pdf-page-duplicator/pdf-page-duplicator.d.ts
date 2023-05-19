export declare class Duplicator {
    private initialized;
    private readonly pdfLocation;
    private document;
    private wasInitialized;
    private prettifyPageArray;
    duplicateWholeDocument(copies: number): Promise<void>;
    duplicateIndividualPages(duplicatePages: string[], copies: number): Promise<void>;
    save(location: string): Promise<void>;
    constructor(pdfLocation: string);
    init(): Promise<Duplicator>;
}

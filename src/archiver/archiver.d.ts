export type zipperOptions = {
    archiveName?: string;
    tmpLocation?: string;
    compressionLevel?: number;
};
export type compressionOptions = {
    failIfFileMissing?: boolean;
    randomizeNamesInArchive?: boolean;
};
export type addFileOptions = {
    newName?: string;
};
export declare class Zip {
    private readonly name;
    private readonly options;
    private readonly zipLocation;
    private readonly nameGenerator;
    private wasInitiated;
    private archiveCreated;
    private archive;
    private filesToArchive;
    private initiated;
    getPotentialArchiveSizeInBytes(): number;
    createArchive(options?: compressionOptions): Promise<string>;
    getArchiveLocation(): string | undefined;
    addFile(loc: string, options?: addFileOptions): void;
    addFiles(...files: string[]): void;
    constructor(options?: zipperOptions);
    init(): Promise<Zip>;
}

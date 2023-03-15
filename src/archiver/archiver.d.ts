export type zipperOptions = {
    archiveName?: string;
    tmpLocation?: string;
    compressionLevel?: number;
};
export type compressionOptions = {
    failIfFileMissing?: boolean;
    randomizeNamesInArchive?: boolean;
};
export declare class Zip {
    private readonly name;
    private readonly options;
    private readonly zipLocation;
    private readonly nameGenerator;
    private initiated;
    private archiveCreated;
    private archive;
    private filesToArchive;
    private checkIfInitiated;
    private init;
    getPotentialArchiveSizeInBytes(): number;
    createArchive(options?: compressionOptions): string;
    getArchiveLocation(): string | undefined;
    addFiles(...files: string[]): void;
    constructor(options?: zipperOptions);
}

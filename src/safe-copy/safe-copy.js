class SafeCopier {
    source;
    destination;
    options;
    checkOptions(options) {
        options = options || {};
        return options;
    }
    constructor(source, destination, options) {
        this.options = this.checkOptions(options);
        this.source = source;
        this.destination = destination;
    }
}
export function copySync(source, destination, options) {
    const copier = new SafeCopier(source, destination, options);
}

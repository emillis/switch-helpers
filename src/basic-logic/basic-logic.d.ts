export declare const allowedLogicalOperators: {
    readonly Equal: "===";
    readonly NotEqual: "!==";
    readonly LessThan: "<";
    readonly LessThanOrEqual: "<=";
    readonly MoreThan: ">";
    readonly MoreThanOrEqual: ">=";
};
export declare type allowedLogicalOperators = typeof allowedLogicalOperators[keyof typeof allowedLogicalOperators];
export interface ElseIfAndElse {
    ElseIf(val: boolean, callback: () => any): Promise<ElseIfAndElse>;
    Else(callback: () => any): Promise<void>;
}
export declare class LogicOperators {
    private StrToNumber;
    Equal(val1: string, val2: string): boolean;
    NotEqual(val1: string, val2: string): boolean;
    LessThan(val1: string, val2: string): boolean;
    LessThanOrEqual(val1: string, val2: string): boolean;
    MoreThan(val1: string, val2: string): boolean;
    MoreThanOrEqual(val1: string, val2: string): boolean;
    OperatorFromString(val1: string, operator: string, val2: string): boolean;
}
export declare class LogicStatements {
    private valueMatched;
    If(val: boolean, callback: () => any): Promise<ElseIfAndElse>;
    ElseIf(val: boolean, callback: () => any): Promise<ElseIfAndElse>;
    Else(callback: () => any): Promise<void>;
    constructor(valueMatched?: boolean);
}

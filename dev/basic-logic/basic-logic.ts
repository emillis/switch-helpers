export const allowedLogicalOperators = {
    Equal: `===`,
    NotEqual: `!==`,
    LessThan: `<`,
    LessThanOrEqual: `<=`,
    MoreThan: `>`,
    MoreThanOrEqual: `>=`
} as const;
export type allowedLogicalOperators = typeof allowedLogicalOperators[keyof typeof allowedLogicalOperators];

export interface ElseIfAndElse {
    ElseIf(val: boolean, callback: ()=>any): Promise<ElseIfAndElse>
    Else(callback: ()=>any): Promise<void>
}

export class LogicOperators {
    //If string passed in is a valid number, returns that number, if not, returning string length
    private StrToNumber(val: string): number {
        const v = +val;
        return isNaN(v) ? val.length : v
    }

    //Logical Operator: ===
    Equal(val1: string, val2: string): boolean {
        return val1 === val2
    }

    //Logical Operator: !==
    NotEqual(val1: string, val2: string): boolean {
        return val1 !== val2
    }

    //Logical Operator: <
    LessThan(val1: string, val2: string): boolean {
        return this.StrToNumber(val1) < this.StrToNumber(val2)
    }

    //Logical Operator: <=
    LessThanOrEqual(val1: string, val2: string): boolean {
        return this.StrToNumber(val1) <= this.StrToNumber(val2)
    }

    //Logical Operator: >
    MoreThan(val1: string, val2: string): boolean {
        return this.StrToNumber(val1) > this.StrToNumber(val2)
    }

    //Logical Operator: >=
    MoreThanOrEqual(val1: string, val2: string): boolean {
        return this.StrToNumber(val1) >= this.StrToNumber(val2)
    }

    //Allows to pass in the two values and an operator as a string.
    OperatorFromString(val1: string, operator: string, val2: string): boolean {
        switch (operator) {
            case allowedLogicalOperators.Equal:             return this.Equal(val1, val2);
            case allowedLogicalOperators.NotEqual:          return this.NotEqual(val1, val2);
            case allowedLogicalOperators.LessThan:          return this.LessThan(val1, val2);
            case allowedLogicalOperators.LessThanOrEqual:   return this.LessThanOrEqual(val1, val2);
            case allowedLogicalOperators.MoreThan:          return this.MoreThan(val1, val2);
            case allowedLogicalOperators.MoreThanOrEqual:   return this.MoreThanOrEqual(val1, val2);
            default:                                        throw `Invalid logical operator "${operator}" used! Allowed operators are: "${Object.values(allowedLogicalOperators).join(`", "`)}"`;
        }
    }
}

export class LogicStatements {
    private valueMatched: boolean;

    async If(val: boolean, callback: ()=>any): Promise<ElseIfAndElse> {
        if (val) {
            await callback()
            this.valueMatched = true
        }
        return new LogicStatements(this.valueMatched);
    }

    async ElseIf(val: boolean, callback: ()=>any): Promise<ElseIfAndElse> {
        if (this.valueMatched) return this;
        if (val) {
            await callback()
            this.valueMatched = true
        }
        return this
    }

    async Else(callback: ()=>any) {
        if (this.valueMatched) return;
        await callback()
        this.valueMatched = true
    }

    constructor(valueMatched: boolean = false) {
        this.valueMatched = valueMatched
    }
}

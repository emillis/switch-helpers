"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogicStatements = exports.LogicOperators = exports.allowedLogicalOperators = void 0;
exports.allowedLogicalOperators = {
    Equal: `===`,
    NotEqual: `!==`,
    LessThan: `<`,
    LessThanOrEqual: `<=`,
    MoreThan: `>`,
    MoreThanOrEqual: `>=`
};
class LogicOperators {
    //If string passed in is a valid number, returns that number, if not, returning string length
    StrToNumber(val) {
        const v = +val;
        return isNaN(v) ? val.length : v;
    }
    //Logical Operator: ===
    Equal(val1, val2) {
        return val1 === val2;
    }
    //Logical Operator: !==
    NotEqual(val1, val2) {
        return val1 !== val2;
    }
    //Logical Operator: <
    LessThan(val1, val2) {
        return this.StrToNumber(val1) < this.StrToNumber(val2);
    }
    //Logical Operator: <=
    LessThanOrEqual(val1, val2) {
        return this.StrToNumber(val1) <= this.StrToNumber(val2);
    }
    //Logical Operator: >
    MoreThan(val1, val2) {
        return this.StrToNumber(val1) > this.StrToNumber(val2);
    }
    //Logical Operator: >=
    MoreThanOrEqual(val1, val2) {
        return this.StrToNumber(val1) >= this.StrToNumber(val2);
    }
    //Allows to pass in the two values and an operator as a string.
    OperatorFromString(val1, operator, val2) {
        switch (operator) {
            case exports.allowedLogicalOperators.Equal: return this.Equal(val1, val2);
            case exports.allowedLogicalOperators.NotEqual: return this.NotEqual(val1, val2);
            case exports.allowedLogicalOperators.LessThan: return this.LessThan(val1, val2);
            case exports.allowedLogicalOperators.LessThanOrEqual: return this.LessThanOrEqual(val1, val2);
            case exports.allowedLogicalOperators.MoreThan: return this.MoreThan(val1, val2);
            case exports.allowedLogicalOperators.MoreThanOrEqual: return this.MoreThanOrEqual(val1, val2);
            default: throw `Invalid logical operator "${operator}" used! Allowed operators are: "${Object.values(exports.allowedLogicalOperators).join(`", "`)}"`;
        }
    }
}
exports.LogicOperators = LogicOperators;
class LogicStatements {
    valueMatched;
    async If(val, callback) {
        if (val) {
            await callback();
            this.valueMatched = true;
        }
        return new LogicStatements(this.valueMatched);
    }
    async ElseIf(val, callback) {
        if (this.valueMatched)
            return this;
        if (val) {
            await callback();
            this.valueMatched = true;
        }
        return this;
    }
    async Else(callback) {
        if (this.valueMatched)
            return;
        await callback();
        this.valueMatched = true;
    }
    constructor(valueMatched = false) {
        this.valueMatched = valueMatched;
    }
}
exports.LogicStatements = LogicStatements;

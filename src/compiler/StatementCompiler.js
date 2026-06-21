import {
    isFunction, isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import MapLocker from "@emcjs/core/data/locker/MapLocker.js";
import LogicStatement, {
    PARAM_STRING,
    VAL_STRING
} from "./statement/LogicStatement.js";
import StatementBuilder from "./builder/StatementBuilder.js";

export const DEFAULT_STATEMENT_TRANSPILERS = new MapLocker(new Map(Object.entries({
    /* literals */
    "true": () => "1",
    "false": () => "0",
    "string": (builder, logic) => `${builder.escapeString(logic.value)}`,
    "number": (builder, logic) => `${builder.escapeNumber(logic.value)}`,
    "value": (builder, logic) => `(${VAL_STRING}(${builder.escapeValue(logic.ref)})??0)`,
    "state": (builder, logic) => `((${VAL_STRING}(${builder.escapeValue(logic.ref)})??0)==${builder.escapeValue(logic.value)})`,
    "regexp": (builder, logic) => `(${new RegExp(logic.value)}.test(${builder.buildLogic(logic.content)}))`,
    "param": (builder, logic, params) => `(${resolveParam(params, logic.ref)})`,
    "paramvalue": (builder, logic, params) => `(${VAL_STRING}(${resolveParam(params, logic.ref)})??0)`,

    /* operators */
    "and": (builder, logic, params) => `${builder.multiElementOperation(logic.content, "&&", params)}`,
    "nand": (builder, logic, params) => `!${builder.multiElementOperation(logic.content, "&&", params)}`,
    "or": (builder, logic, params) => `${builder.multiElementOperation(logic.content, "||", params)}`,
    "nor": (builder, logic, params) => `!${builder.multiElementOperation(logic.content, "||", params)}`,
    "not": (builder, logic, params) => `!(${builder.buildLogic(logic.content, params)})`,
    "xor": (builder, logic, params) => `${builder.twoElementOperation(logic.content, "^", params) || 1}`,
    "xnor": (builder, logic, params) => `!${builder.twoElementOperation(logic.content, "^", params) || 1}`,

    /* restrictors */
    "min": (builder, logic, params) => `(${builder.buildLogic(logic.content, params)}>=${builder.escapeNumber(logic.value)})`,
    "max": (builder, logic, params) => `(${builder.buildLogic(logic.content, params)}<=${builder.escapeNumber(logic.value)})`,

    /* comparators */
    "eq": (builder, logic, params) => builder.twoElementOperation(logic.content, "==", params),
    "neq": (builder, logic, params) => builder.twoElementOperation(logic.content, "!=", params),
    "lt": (builder, logic, params) => builder.twoElementOperation(logic.content, "<", params),
    "lte": (builder, logic, params) => builder.twoElementOperation(logic.content, "<=", params),
    "gt": (builder, logic, params) => builder.twoElementOperation(logic.content, ">", params),
    "gte": (builder, logic, params) => builder.twoElementOperation(logic.content, ">=", params),

    /* math */
    "add": (builder, logic, params) => builder.mathMultiElementOperation(logic.content, "+", params),
    "sub": (builder, logic, params) => builder.mathMultiElementOperation(logic.content, "-", params),
    "mul": (builder, logic, params) => builder.mathMultiElementOperation(logic.content, "*", params),
    "div": (builder, logic, params) => builder.mathMultiElementOperation(logic.content, "/", params),
    "mod": (builder, logic, params) => builder.mathMultiElementOperation(logic.content, "%", params),
    "pow": (builder, logic, params) => builder.mathTwoElementOperation(logic.content, "**", params)
})));

function resolveParam(params = [], key = null) {
    const idx = params.indexOf(key);
    if (idx >= 0) {
        return `${PARAM_STRING}[${idx}]??""`;
    }
    return `""`;
}

export default class StatementCompiler {

    #transpilers;

    constructor() {
        this.#transpilers = new Map(new.target.defaultTranspilers);
    }

    compile(source, params = []) {
        const builder = new StatementBuilder(this.#transpilers);
        const statement = builder.buildLogic(source, params);
        return this.constructor.createStatement(params, statement, source, builder.dependencies);
    }

    registerTranspiler(type, fn) {
        if (!isStringNotEmpty(type)) {
            throw new TypeError("type must  be a non empty string");
        }
        if (!isFunction(fn)) {
            throw new TypeError("transpiler must be a function");
        }
        if (this.constructor.defaultTranspilers.has(type)) {
            throw new Error("can not override default transpilers");
        }
        this.#transpilers.set(type, fn);
    }

    static get defaultTranspilers() {
        return DEFAULT_STATEMENT_TRANSPILERS;
    }

    static createStatement(params, statement, source, dependencies) {
        return new LogicStatement(params, statement, source, dependencies);
    }

    static compile(source, params = []) {
        const builder = new StatementBuilder(this.defaultTranspilers);
        const statement = builder.buildLogic(source, params);
        return this.createStatement(params, statement, source, builder.dependencies);
    }

}

import {
    isFunction, isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import LogicStatement, {
    PARAM_STRING,
    VAL_STRING
} from "./statement/LogicStatement.js";
import StatementBuilder from "./builder/StatementBuilder.js";

const DEFAULT_TRANSPILERS = new Map(Object.entries({
    /* literals */
    "true": () => "1",
    "false": () => "0",
    "string": (builder, logic) => `${builder.escapeString(logic.value)}`,
    "number": (builder, logic) => `${builder.escapeNumber(logic.value)}`,
    "value": (builder, logic) => `(${VAL_STRING}(${builder.escapeValue(logic.ref)})??0)`,
    "state": (builder, logic) => `((${VAL_STRING}(${builder.escapeValue(logic.ref)})??0)==${builder.escapeValue(logic.value)})`,
    "regexp": (builder, logic) => `(/${logic.value}/.test(${builder.buildLogic(logic.content)}))`,
    "param": (builder, logic) => `(${PARAM_STRING}[${builder.escapeString(logic.ref)}]??0)`,
    "paramvalue": (builder, logic) => `(${VAL_STRING}(${PARAM_STRING}[${builder.escapeString(logic.ref)}]??"")??0)`,

    /* operators */
    "and": (builder, logic) => `${builder.multiElementOperation(logic.content, "&&")}`,
    "nand": (builder, logic) => `!${builder.multiElementOperation(logic.content, "&&")}`,
    "or": (builder, logic) => `${builder.multiElementOperation(logic.content, "||")}`,
    "nor": (builder, logic) => `!${builder.multiElementOperation(logic.content, "||")}`,
    "not": (builder, logic) => `!(${builder.buildLogic(logic.content)})`,
    "xor": (builder, logic) => `${builder.twoElementOperation(logic.content, "^") || 1}`,
    "xnor": (builder, logic) => `!${builder.twoElementOperation(logic.content, "^") || 1}`,

    /* restrictors */
    "min": (builder, logic) => `(${builder.buildLogic(logic.content)}>=${builder.escapeNumber(logic.value)})`,
    "max": (builder, logic) => `(${builder.buildLogic(logic.content)}<=${builder.escapeNumber(logic.value)})`,

    /* comparators */
    "eq": (builder, logic) => builder.twoElementOperation(logic.content, "=="),
    "neq": (builder, logic) => builder.twoElementOperation(logic.content, "!="),
    "lt": (builder, logic) => builder.twoElementOperation(logic.content, "<"),
    "lte": (builder, logic) => builder.twoElementOperation(logic.content, "<="),
    "gt": (builder, logic) => builder.twoElementOperation(logic.content, ">"),
    "gte": (builder, logic) => builder.twoElementOperation(logic.content, ">="),

    /* math */
    "add": (builder, logic) => builder.mathMultiElementOperation(logic.content, "+"),
    "sub": (builder, logic) => builder.mathMultiElementOperation(logic.content, "-"),
    "mul": (builder, logic) => builder.mathMultiElementOperation(logic.content, "*"),
    "div": (builder, logic) => builder.mathMultiElementOperation(logic.content, "/"),
    "mod": (builder, logic) => builder.mathMultiElementOperation(logic.content, "%"),
    "pow": (builder, logic) => builder.mathTwoElementOperation(logic.content, "**")
}));

export default class StatementCompiler {

    #transpilers = new Map(DEFAULT_TRANSPILERS);

    compile(source, params = []) {
        const builder = new StatementBuilder(this.#transpilers);
        const statement = builder.buildLogic(source);
        return this.createStatement(params, statement, source, builder.dependencies);
    }

    registerTranspiler(type, fn) {
        if (!isStringNotEmpty(type)) {
            throw new TypeError("type must  be a non empty string");
        }
        if (!isFunction(fn)) {
            throw new TypeError("transpiler must be a function");
        }
        if (DEFAULT_TRANSPILERS.has(type)) {
            throw new Error("can not override default transpilers");
        }
        this.#transpilers.set(type, fn);
    }

    createStatement(params, statement, source, dependencies) {
        return new LogicStatement(params, statement, source, dependencies);
    }

}

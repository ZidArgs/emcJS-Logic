import {
    isFunction, isStringNotEmpty
} from "@emcjs/core/util/helper/CheckType.js";
import StatementCompiler from "./StatementCompiler.js";
import EdgeStatement, {EXEC_STRING} from "./statement/EdgeStatement.js";
import {VAL_STRING} from "./statement/LogicStatement.js";

const DEFAULT_TRANSPILERS = {
    /* special */
    "at": (builder, logic, params) => logic.content ? `((${VAL_STRING}(${builder.escapeString(logic.node)})||0)&&${builder.buildLogic(logic.content, params)})` : `(${VAL_STRING}(${builder.escapeString(logic.node)})||0)`,
    "mixin": (builder, logic) => `${EXEC_STRING}(${builder.escapeString(logic.ref)})`,
    "function": (builder, logic, params) => `${EXEC_STRING}(${builder.escapeString(logic.ref)}${functionParams(builder, logic.params, params)})`
};

/* FUNCTION PARAMS */
function functionParams(builder, params, parentParams) {
    if (!Array.isArray(params)) {
        return ",[]";
    }
    const escapedParams = [];
    for (const value of params) {
        const buildValue = builder.buildLogic(value, parentParams);
        escapedParams.push(buildValue);
    }
    return `,[${escapedParams.join(",")}]`;
}

export default class EdgeLogicCompiler extends StatementCompiler {

    constructor() {
        super();
        for (const [type, fn] of Object.entries(DEFAULT_TRANSPILERS)) {
            super.registerTranspiler(type, fn);
        }
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
        super.registerTranspiler(type, fn);
    }

    createStatement(params, statement, source, dependencies) {
        return new EdgeStatement(params, statement, source, dependencies);
    }

}

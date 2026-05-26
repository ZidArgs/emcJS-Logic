import MapLocker from "@emcjs/core/data/locker/MapLocker.js";
import StatementCompiler, {DEFAULT_STATEMENT_TRANSPILERS} from "./StatementCompiler.js";
import EdgeStatement, {EXEC_STRING} from "./statement/EdgeStatement.js";
import {VAL_STRING} from "./statement/LogicStatement.js";

export const DEFAULT_EDGE_TRANSPILERS = new MapLocker(new Map([...DEFAULT_STATEMENT_TRANSPILERS, ...Object.entries({
    /* special */
    "at": (builder, logic, params) => logic.content ? `((${VAL_STRING}(${builder.escapeString(logic.node)})||0)&&${builder.buildLogic(logic.content, params)})` : `(${VAL_STRING}(${builder.escapeString(logic.node)})||0)`,
    "mixin": (builder, logic) => `${EXEC_STRING}(${builder.escapeString(logic.ref)})`,
    "function": (builder, logic, params) => `${EXEC_STRING}(${builder.escapeString(logic.ref)}${functionParams(builder, logic.params, params)})`
})]));

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

    static get defaultTranspilers() {
        return DEFAULT_EDGE_TRANSPILERS;
    }

    static createStatement(params, statement, source, dependencies) {
        return new EdgeStatement(params, statement, source, dependencies);
    }

}

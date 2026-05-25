import {immute} from "@emcjs/core/data/Immutable.js";

export const VAL_STRING = "val";

export const PARAM_STRING = "params";

export default class LogicStatement extends Function {

    #dependencies = new Set();

    #params;

    #source;

    constructor(params = [], statement = null, source = {}, dependencies = []) {
        const paramResolverString = LogicStatement.#createParamResolverString(params);

        super(new.target.parameterString, `${paramResolverString};return ${statement}`);

        this.#source = immute(source);
        if (Symbol.iterator in Object(dependencies)) {
            for (const req of dependencies) {
                this.#dependencies.add(req);
            }
        }
        this.#params = immute(params);
    }

    get source() {
        return this.#source;
    }

    get dependencies() {
        return new Set(this.#dependencies);
    }

    get params() {
        return this.#params;
    }

    get paramNames() {
        return Object.keys(this.#params);
    }

    getParamType(name) {
        return this.#params[name];
    }

    serialize() {
        return {
            logic: this.source,
            params: this.params
        };
    }

    static #createParamResolverString(params) {
        if (!Array.isArray(params) || !params.length) {
            return `${PARAM_STRING}={}`;
        }
        const result = [];
        for (const name of params) {
            result.push(`${name}:${PARAM_STRING}[${result.length}]`);
        }
        return `${PARAM_STRING}={${result.join(",")}}`;
    }

    static get parameterString() {
        return `{${VAL_STRING} = () => false, ${PARAM_STRING} = []} = {}`;
    }

}

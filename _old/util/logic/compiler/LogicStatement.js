import {immute} from "@emcjs/core/data/Immutable.js";

export default class LogicStatement extends Function {

    #dependencies = new Set();

    #params;

    #source;

    constructor(statement, opts = {}) {
        const {
            dependencies = [], params = [], source = {}
        } = opts;

        const paramResolverString = LogicStatement.#createParamResolverString();

        super(LogicStatement.parameterString, `${paramResolverString};return ${statement}`);

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
            return "params={}";
        }
        const result = [];
        for (const name of params) {
            result.push(`${name}:params[${result.length}]`);
        }
        return `params={${result.join(",")}}`;
    }

    static get parameterString() {
        return "{val = () => false, data = () => false, exec = () => false, at = () => false, params = []} = {}";
    }

}

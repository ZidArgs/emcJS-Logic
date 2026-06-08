import {immute} from "@emcjs/core/data/Immutable.js";

export const VAL_STRING = "val";

export const PARAM_STRING = "params";

export default class LogicStatement {

    #function = () => 0;

    #dependencies = new Set();

    #params = [];

    #source = null;

    constructor(params = [], statement = null, source = {}, dependencies = []) {
        if (statement != null) {
            this.#function = new Function(new.target.parameterString, `return ${statement}`);
        }
        this.#source = immute(source);
        if (Symbol.iterator in Object(dependencies)) {
            for (const req of dependencies) {
                this.#dependencies.add(req);
            }
        }
        this.#params = immute(params);
    }

    execute(...args) {
        return this.#function(...args);
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

    serialize() {
        return {
            logic: this.source,
            params: this.params
        };
    }

    toString() {
        return this.#function.toString();
    }

    static get parameterString() {
        return `${VAL_STRING} = () => false, ${PARAM_STRING} = []`;
    }

    static fromFunction(callback) {
        if (typeof callback !== "function") {
            throw new TypeError("callback must be a function");
        }
        const inst = new this();
        inst.#function = callback;
        return inst;
    }

}

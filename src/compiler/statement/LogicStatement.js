import {immute} from "@emcjs/core/data/Immutable.js";

export const VAL_STRING = "val";

export const PARAM_STRING = "params";

export default class LogicStatement extends Function {

    #dependencies = new Set();

    #params;

    #source;

    constructor(params = [], statement = null, source = {}, dependencies = []) {
        super(new.target.parameterString, `return ${statement}`);

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

    serialize() {
        return {
            logic: this.source,
            params: this.params
        };
    }

    static get parameterString() {
        return `${VAL_STRING} = () => false, ${PARAM_STRING} = []`;
    }

}

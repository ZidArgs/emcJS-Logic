import DependencyList from "../../data/DependencyList.js";

export default class StatementBuilder {

    #dependencies = new DependencyList();

    #transpilers;

    constructor(transpilers = new Map()) {
        this.#transpilers = new Map(transpilers);
    }

    get dependencies() {
        return this.#dependencies;
    }

    /* INITIATOR */
    buildLogic(logic, params) {
        if (typeof logic != "object") {
            logic = {type: logic};
        }
        if (this.#transpilers.has(logic.type)) {
            return this.#transpilers.get(logic.type)(this, logic, params);
        }
        return 0;
    }

    /* STRINGS */
    escapeString(str) {
        if (typeof str != "string") {
            if (typeof str == "number" && !isNaN(str)) {
                return `"${str}"`;
            }
            return `""`;
        }
        const res = str.replace(/[\\"]/g, "\\$&");
        return `"${res}"`;
    }

    /* VALUE */
    escapeValue(str) {
        if (typeof str != "string") {
            if (typeof str == "number") {
                if (isNaN(str)) {
                    return 0;
                }
                return str;
            }
            return 0;
        }
        const res = str.replace(/[\\"]/g, "\\$&");
        this.#dependencies.add(res);
        return `"${res}"`;
    }

    /* ELEMENTS */
    twoElementOperation(els, join, params) {
        return this.multiElementOperation(els.slice(0, 2), join, params);
    }

    multiElementOperation(els, join, params) {
        if (els.length == 0) {
            return 0;
        }
        return `(${els.map((el) => this.buildLogic(el, params)).join(join)})`;
    }

    /* MATH */
    escapeNumber(val) {
        val = parseInt(val);
        if (!isNaN(val)) {
            return val;
        }
        return 0;
    }

    toNumber(val) {
        return `(parseInt(${val})||0)`;
    }

    mathTwoElementOperation(els, join, params) {
        return this.mathMultiElementOperation(els.slice(0, 2), join, params);
    }

    mathMultiElementOperation(els, join, params) {
        if (els.length == 0) {
            return 0;
        }
        return `${els.map((el) => this.buildLogic(el, params)).map(this.toNumber).join(join)}`;
    }

}

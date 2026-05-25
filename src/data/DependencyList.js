class DependencyListIterator extends Iterator {

    #values;

    constructor(values) {
        super();
        this.#values = Array.from(values);
    }

    static {
        Object.defineProperty(this.prototype, Symbol.toStringTag, {
            value: "DependencyList Iterator",
            configurable: true,
            enumerable: false,
            writable: false
        });

        delete this.prototype.constructor;
    }

    next() {
        if (this.#values.length) {
            const value = this.#values.shift();
            return {
                value: value,
                done: false
            };
        }
        return {
            value: undefined,
            done: true
        };
    }

}

export default class DependencyList {

    #dependencies = new Set();

    add(value) {
        this.#dependencies.add(value);
        return this;
    }

    has(value) {
        return this.#dependencies.has(value);
    }

    keys() {
        return this.values();
    }

    values() {
        return new DependencyListIterator(this.#dependencies);
    }

    entries() {
        return new DependencyListIterator(this.#dependencies.map((entry) => [entry, entry]));
    }

    forEach(callbackFn, thisArg) {
        if (typeof callbackFn !== "function") {
            throw new TypeError("callback must be a function");
        }
        this.#dependencies.forEach((value, key) => {
            callbackFn.call(thisArg, value, key, this);
        });
    }

    toArray() {
        return [...this.#dependencies];
    }

    [Symbol.iterator]() {
        return new DependencyListIterator(this.#dependencies);
    }

}

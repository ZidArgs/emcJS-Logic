import Compiler from "./Compiler.js";

function resolveCircle(values, path = [], visited = new Set(), start = values.keys().next().value) {
    if (values.has(start)) {
        path.push(start);
        if (visited.has(start)) {
            return true;
        }
        visited.add(start);
        const value = values.get(start);
        for (const requirement of value.requires) {
            if (resolveCircle(values, path, visited, requirement)) {
                return true;
            }
        }
        visited.delete(start);
        path.pop();
    }
    return false;
}

function sortLogic(logic) {
    const value_old = new Map(logic);
    logic.clear();
    let len = 0;
    while (!!value_old.size && value_old.size != len) {
        len = value_old.size;
        for (const [key, value] of value_old) {
            for (const requirement of value.requires) {
                if (value_old.has(requirement)) {
                    return;
                }
            }
            logic.set(key, value);
            value_old.delete(key);
        }
    }
    if (value_old.size > 0) {
        const path = [];
        resolveCircle(value_old, path);
        throw new Error(`PROCESSOR LOGIC LOOP:\n${path.join("\n=> ")}`);
    }
}

const DIRTY = new WeakMap();
const LOGIC = new WeakMap();
const MEM_I = new WeakMap();
const MEM_O = new WeakMap();
const DEBUG = new WeakMap();

export default class Processor {

    constructor(debug = false) {
        DIRTY.set(this, false);
        LOGIC.set(this, new Map());
        MEM_I.set(this, new Map());
        MEM_O.set(this, new Map());
        DEBUG.set(this, !!debug);
    }

    loadLogic(value) {
        if (typeof value == "object" && !Array.isArray(value)) {
            const debug = DEBUG.get(this);
            const logic = LOGIC.get(this);
            const mem_o = MEM_O.get(this);
            if (debug) {
                console.group("PROCESSOR LOGIC BUILD");
                console.time("build time");
            }
            for (const name in value) {
                if (value[name] == null) {
                    logic.delete(name);
                    mem_o.delete(name);
                } else {
                    const fn = Compiler.compile(value[name]);
                    Object.defineProperty(fn, "name", {value: name});
                    logic.set(name, fn);
                    mem_o.set(name, false);
                }
            }
            sortLogic(logic);
            if (debug) {
                console.timeEnd("build time");
                console.groupEnd("PROCESSOR LOGIC BUILD");
            }
            DIRTY.set(this, true);
        }
    }

    setLogic(name, value) {
        const debug = DEBUG.get(this);
        const logic = LOGIC.get(this);
        const mem_o = MEM_O.get(this);
        if (debug) {
            console.group("PROCESSOR LOGIC BUILD");
            console.time("build time");
        }
        if (typeof value == "undefined" || value == null) {
            logic.delete(name);
            mem_o.delete(name);
        } else {
            const fn = Compiler.compile(value);
            Object.defineProperty(fn, "name", {value: name});
            logic.set(name, fn);
            mem_o.set(name, false);
        }
        sortLogic(logic);
        if (debug) {
            console.timeEnd("build time");
            console.groupEnd("PROCESSOR LOGIC BUILD");
        }
        DIRTY.set(this, true);
    }

    clearLogic() {
        const logic = LOGIC.get(this);
        logic.clear();
        DIRTY.set(this, true);
    }

    execute() {
        const res = {};
        const logic = LOGIC.get(this);
        const mem_i = MEM_I.get(this);
        const mem_o = MEM_O.get(this);
        const debug = DEBUG.get(this);
        if (debug) {
            console.group("PROCESSOR LOGIC EXECUTION");
            console.log("input", Object.fromEntries(mem_i));
            console.log("executing logic...");
            console.time("execution time");
        }
        const val = (key) => {
            if (mem_i.has(key)) {
                return mem_i.get(key);
            }
        };
        for (const [k, v] of logic) {
            const r = !!v(val);
            mem_i.set(k, r);
            if (r != mem_o.get(k)) {
                mem_o.set(k, r);
                res[k] = r;
            }
        }
        if (debug) {
            console.log("success");
            console.timeEnd("execution time");
            console.log("output", Object.fromEntries(mem_i));
            console.log("changes", res);
            console.groupEnd("PROCESSOR LOGIC EXECUTION");
        }
        DIRTY.set(this, false);
        return res;
    }

    set(key, value) {
        const debug = DEBUG.get(this);
        if (debug) {
            console.group("PROCESSOR LOGIC MEMORY CHANGE");
            console.log("change", `${key} => ${value}`);
        }
        const mem_i = MEM_I.get(this);
        mem_i.set(key, value);
        if (debug) {
            console.groupEnd("PROCESSOR LOGIC MEMORY CHANGE");
        }
        DIRTY.set(this, true);
    }

    setAll(values) {
        const debug = DEBUG.get(this);
        if (debug) {
            console.group("PROCESSOR LOGIC MEMORY CHANGE");
            console.log("changes", values);
        }
        const mem_i = MEM_I.get(this);
        if (values instanceof Map) {
            for (const [k, v] of values) {
                mem_i.set(k, v);
            }
        } else if (typeof values == "object" && !Array.isArray(values)) {
            for (const k in values) {
                const v = values[k];
                mem_i.set(k, v);
            }
        }
        if (debug) {
            console.groupEnd("PROCESSOR LOGIC MEMORY CHANGE");
        }
        DIRTY.set(this, true);
    }

    get(ref) {
        const mem_o = MEM_O.get(this);
        if (mem_o.has(ref)) {
            return mem_o.get(ref);
        }
        return false;
    }

    getAll() {
        const mem_o = MEM_O.get(this);
        const obj = {};
        for (const [k, v] of mem_o) {
            obj[k] = v;
        }
        return obj;
    }

    has(ref) {
        const mem_o = MEM_O.get(this);
        if (mem_o.has(ref)) {
            return true;
        }
        return false;
    }

    reset() {
        const mem_i = MEM_I.get(this);
        const mem_o = MEM_O.get(this);
        mem_i.clear();
        mem_o.clear();
        DIRTY.set(this, true);
    }

    isDirty() {
        return DIRTY.get(this);
    }

}

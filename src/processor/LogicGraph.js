import UniqueQueue from "@emcjs/core/data/collection/UniqueQueue.js";
import AbstractLogger from "@emcjs/core/util/log/AbstractLogger.js";
import LogicStatement from "../compiler/statement/LogicStatement.js";
import EdgeLogicCompiler from "../compiler/EdgeLogicCompiler.js";
import NodeFactory from "../util/NodeFactory.js";

export default class LogicGraph {

    #debug = false;

    #logger = console;

    #dirty = false;

    #edgeLogicCompiler = new EdgeLogicCompiler();

    #nodeFactory = new NodeFactory();

    #mixins = new Map();

    #collectibles = new Map();

    #memoryIn = new Map();

    #memoryOut = new Map();

    #redirects = new Map();

    #forcedReachables = new Set();

    #valueAliases = new Map();

    #injectedFunctions = new Map();

    constructor(debug = false) {
        this.#debug = debug;
    }

    set debug(value) {
        this.#debug = value;
    }

    get debug() {
        return this.#debug;
    }

    setLogger(logger) {
        if (logger !== null && !(logger instanceof AbstractLogger)) {
            throw new TypeError("logger must be an instance of AbstractLogger or null (to use console)");
        }
        this.#logger = logger ?? console;
    }

    clearGraph() {
        this.#nodeFactory.reset();
    }

    load(config) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC BUILD");
            this.#logger.time("build time");
        }
        for (const name in config.edges) {
            const children = config.edges[name];
            const node = this.#nodeFactory.get(name);
            for (const child in children) {
                const logic = children[child];
                const fn = this.#edgeLogicCompiler.compile(logic);
                node.append(this.#nodeFactory.get(child), fn);
                if (!this.#memoryOut.has(child)) {
                    this.#memoryOut.set(child, false);
                }
            }
        }
        for (const name in config.logic) {
            const logic = config.logic[name];
            if (logic.params != null) {
                const {
                    logic: fnLogic, params
                } = logic;
                const fn = this.#edgeLogicCompiler.compile(fnLogic, params);
                this.#mixins.set(name, fn);
            } else {
                const fn = this.#edgeLogicCompiler.compile(logic);
                this.#mixins.set(name, fn);
            }
        }
        if (this.#debug) {
            this.#logger.timeEnd("build time");
            this.#logger.groupEnd("GRAPH LOGIC BUILD");
        }
        this.#dirty = true;
    }

    setEdge(source, target, value) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC SET EDGE");
            this.#logger.time("build time");
        }
        const node = this.#nodeFactory.get(source);
        const child = this.#nodeFactory.get(target);
        if (typeof value == "undefined" || value == null) {
            node.remove(child);
            if (this.#debug) {
                this.#logger.log("removed edge");
            }
        } else {
            const fn = this.#edgeLogicCompiler.compile(value);
            node.append(child, fn);
            if (this.#debug) {
                this.#logger.log(`set edge [${source} => ${target}]`);
            }
        }
        this.#dirty = true;
        if (this.#debug) {
            this.#logger.timeEnd("build time");
            this.#logger.groupEnd("GRAPH LOGIC SET EDGE");
        }
    }

    setFunction(name, value) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC SET FUNCTION");
            this.#logger.time("build time");
        }
        if (typeof value == "undefined" || value == null) {
            this.#mixins.delete(name);
            if (this.#debug) {
                this.#logger.log("removed function");
            }
        } else if (value.params != null) {
            const {
                logic, params
            } = value;
            const fn = this.#edgeLogicCompiler.compile(logic, params);
            this.#mixins.set(name, fn);
            if (this.#debug) {
                this.#logger.log(`set function "${name}":`);
                this.#logger.log(fn.toString());
            }
        } else {
            const fn = this.#edgeLogicCompiler.compile(value);
            this.#mixins.set(name, fn);
            if (this.#debug) {
                this.#logger.log(`set function "${name}":`);
                this.#logger.log(fn.toString());
            }
        }
        this.#dirty = true;
        if (this.#debug) {
            this.#logger.timeEnd("build time");
            this.#logger.groupEnd("GRAPH LOGIC SET FUNCTION");
        }
    }

    injectFunction(name, callback) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC INJECT FUNCTION");
            this.#logger.time("build time");
        }
        if (callback instanceof LogicStatement) {
            this.#injectedFunctions.set(name, callback);
            if (this.#debug) {
                this.#logger.log(`set injected function "${name}":`);
                this.#logger.log(callback.toString());
            }
        } else if (typeof callback === "function") {
            const statement = LogicStatement.fromFunction(callback);
            this.#injectedFunctions.set(name, statement);
            if (this.#debug) {
                this.#logger.log(`set injected function "${name}":`);
                this.#logger.log(statement.toString());
            }
        } else {
            this.#injectedFunctions.delete(name);
            if (this.#debug) {
                this.#logger.log("removed injected function");
            }
        }
        if (this.#debug) {
            this.#logger.timeEnd("build time");
            this.#logger.groupEnd("GRAPH LOGIC INJECT FUNCTION");
        }
    }

    clearRedirects() {
        if (this.#debug === "extended") {
            this.#logger.log("GRAPH LOGIC REDIRECT RESET");
        }
        this.#redirects.clear();
    }

    setRedirect(source, target, reroute) {
        if (this.#debug === "extended") {
            this.#logger.groupCollapsed("GRAPH LOGIC REDIRECT CHANGE");
            this.#logger.log({[`${source} => ${target}`]: reroute});
            this.#logger.groupEnd("GRAPH LOGIC REDIRECT CHANGE");
        }
        if (reroute == null) {
            this.#redirects.delete(`${source} => ${target}`);
        } else {
            this.#redirects.set(`${source} => ${target}`, `${reroute}`);
        }
    }

    setAllRedirects(redirects) {
        if (this.#debug === "extended") {
            this.#logger.groupCollapsed("GRAPH LOGIC REDIRECT CHANGE");
        }
        for (const redirect of redirects) {
            const {
                source, target, reroute
            } = redirect;
            if (this.#debug === "extended") {
                this.#logger.log({[`${source} => ${target}`]: reroute});
            }
            if (reroute == null) {
                this.#redirects.delete(`${source} => ${target}`);
            } else {
                this.#redirects.set(`${source} => ${target}`, `${reroute}`);
            }
        }
        if (this.#debug === "extended") {
            this.#logger.groupEnd("GRAPH LOGIC REDIRECT CHANGE");
        }
    }

    getRedirect(source, target) {
        if (this.#redirects.has(`${source} => ${target}`)) {
            return this.#redirects.get(`${source} => ${target}`);
        }
        return target;
    }

    getEdges() {
        const nodes = this.#nodeFactory.getNames();
        const res = [];
        for (const name of nodes) {
            const node = this.#nodeFactory.get(name);
            const children = node.getTargets();
            for (const ch of children) {
                res.push([name, ch]);
            }
        }
        return res;
    }

    getTargetNodes() {
        const nodes = this.#nodeFactory.getNames();
        const res = new Set();
        for (const name of nodes) {
            const node = this.#nodeFactory.get(name);
            const children = node.getTargets();
            for (const ch of children) {
                res.add(ch);
            }
        }
        return res;
    }

    addReachable(target) {
        this.#forcedReachables.add(target);
    }

    deleteReachable(target) {
        this.#forcedReachables.delete(target);
    }

    clearReachables() {
        this.#forcedReachables.clear();
    }

    setValueAlias(value, logic) {
        if (logic != null) {
            const fn = this.#edgeLogicCompiler.compile(logic);
            if (fn.dependencies.has(value)) {
                throw new Error(`value alias circle detected for { ${value} }`);
            }
            this.#valueAliases.set(value, fn);
        } else {
            this.#valueAliases.delete(value);
        }
    }

    setCollectible(target, value) {
        this.#collectibles.set(target, value);
    }

    deleteCollectible(target) {
        this.#collectibles.delete(target);
    }

    clearCollectibles() {
        this.#collectibles.clear();
    }

    /* broad search */
    traverse(startNode) {
        const allTargets = this.getTargetNodes();
        let reachableCount = 0;
        const reachableNodes = new Set();
        const changes = {};
        const start = this.#nodeFactory.get(startNode);
        reachableNodes.add(startNode);
        const collected = new Map();
        let logicCalculationCounter = 0;
        this.#logger.group("GRAPH LOGIC EXECUTION");
        this.#logger.time("execution time");
        if (start != null) {
            if (this.#debug) {
                this.#logger.log("input", Object.fromEntries(this.#memoryIn));
                this.#logger.log("collectibles", Object.fromEntries(this.#collectibles));
                this.#logger.log("redirects", Object.fromEntries(this.#redirects));
                this.#logger.log("aliases", [...this.#valueAliases.keys()]);
                this.#logger.log("forced", Array.from(this.#forcedReachables));
                this.#logger.log("traverse nodes...");
                if (this.#debug === "extended") {
                    this.#logger.groupCollapsed("traversion graph");
                }
            }

            for (const name of this.#forcedReachables) {
                reachableNodes.add(name);
            }

            const collect = (key) => {
                const value = collected.get(key) ?? this.#memoryIn.get(key) ?? 0;
                collected.set(key, value + 1);
                if (this.#debug === "extended") {
                    this.#logger.log("collected:", key);
                }
            };

            const valueGetter = (key) => {
                if (allTargets.has(key) && reachableNodes.has(key)) {
                    if (this.#debug === "extended") {
                        this.#logger.log(`get value for { ${key} } (reached):`, 1);
                    }
                    return true;
                }
                if (this.#valueAliases.has(key)) {
                    const handler = this.#valueAliases.get(key);
                    if (this.#debug === "extended") {
                        this.#logger.groupCollapsed(`execute value alias handler { ${key} }`);
                        this.#logger.log(handler.toString());
                    }
                    const result = handler.execute(valueGetter, execute) ?? false;
                    if (this.#debug === "extended") {
                        this.#logger.log(`result:`, result);
                        this.#logger.groupEnd(`execute value alias handler { ${key} }`);
                    }
                    return result;
                }
                const result = collected.get(key) ?? this.#memoryIn.get(key) ?? false;
                if (this.#debug === "extended") {
                    this.#logger.log(`get value for { ${key} }: `, result);
                }
                return result;
            };

            const execute = (name, params) => {
                if (this.#injectedFunctions.has(name)) {
                    const mixin = this.#injectedFunctions.get(name);
                    if (this.#debug === "extended") {
                        this.#logger.groupCollapsed(`execute injected function { ${name} }`);
                        this.#logger.log(mixin.toString());
                        this.#logger.log(`params:`, params);
                    }
                    const res = mixin.execute(valueGetter, execute, params);
                    if (this.#debug === "extended") {
                        this.#logger.log(`result:`, res);
                        this.#logger.groupEnd(`execute injected function { ${name} }`);
                    }
                    return res;
                }
                if (this.#mixins.has(name)) {
                    const mixin = this.#mixins.get(name);
                    if (this.#debug === "extended") {
                        this.#logger.groupCollapsed(`execute function { ${name} }`);
                        this.#logger.log(mixin.toString());
                        this.#logger.log(`params:`, params);
                    }
                    const res = mixin.execute(valueGetter, execute, params);
                    if (this.#debug === "extended") {
                        this.#logger.log(`result:`, res);
                        this.#logger.groupEnd(`execute function { ${name} }`);
                    }
                    return res;
                }
                return false;
            };

            /* start traversion */
            const queue = new UniqueQueue();
            for (const ch of start.getTargets()) {
                const edge = start.getEdge(ch);
                queue.enqueue(edge);
            }
            let changed = true;
            while (!!queue.length && !!changed) {
                changed = false;
                let counts = queue.length;
                while (counts--) {
                    const edge = queue.dequeue();
                    const condition = edge.getCondition();
                    if (this.#debug === "extended") {
                        this.#logger.groupCollapsed(`traverse edge { ${edge} }`);
                        this.#logger.log(condition.toString());
                    }
                    const name = this.getRedirect(edge.getSource().getName(), edge.getTarget().getName());
                    if (reachableNodes.has(name)) {
                        if (this.#debug === "extended") {
                            this.#logger.groupEnd(`traverse edge { ${edge} }`);
                            this.#logger.log(`already reached node { ${name} }`);
                        }
                        continue;
                    }
                    const cRes = condition.execute(valueGetter, execute);
                    logicCalculationCounter++;
                    if (this.#debug === "extended") {
                        this.#logger.log(`result: ${cRes}`);
                    }
                    if (cRes) {
                        changed = true;
                        if (this.#debug === "extended") {
                            if (name != edge.getTarget().getName()) {
                                this.#logger.log(`redirecting edge { ${edge} } to point to { ${name} }`);
                            }
                        }
                        if (name != "") {
                            const node = this.#nodeFactory.get(name);
                            reachableNodes.add(name);
                            if (this.#collectibles.has(name)) {
                                const collectibleName = this.#collectibles.get(name);
                                collect(collectibleName);
                            }
                            const targets = node.getTargets();
                            for (const ch of targets) {
                                const chEdge = node.getEdge(ch);
                                const chName = this.getRedirect(chEdge.getSource().getName(), chEdge.getTarget().getName());
                                if (!reachableNodes.has(chName)) {
                                    queue.enqueue(chEdge);
                                    if (this.#debug === "extended") {
                                        this.#logger.log(`adding edge { ${chEdge} } to queue`);
                                    }
                                }
                            }
                        }
                    } else {
                        queue.enqueue(edge);
                        if (this.#debug === "extended") {
                            this.#logger.log(`adding unchanged edge { ${edge} } back to queue`);
                        }
                    }
                    if (this.#debug === "extended") {
                        this.#logger.groupEnd(`traverse edge { ${edge} }`);
                        if (reachableCount != reachableNodes.size) {
                            this.#logger.log("reachable changed", Array.from(reachableNodes));
                        }
                        if (reachableCount != reachableNodes.size) {
                            this.#logger.log("current queue", queue.toArray().map((edge) => edge.toString()));
                        }
                    }
                    reachableCount = reachableNodes.size;
                }
            }
            /* end traversion */

            this.#dirty = false;
            for (const ch of allTargets) {
                const v = reachableNodes.has(ch);
                if (this.#memoryOut.get(ch) != v) {
                    this.#memoryOut.set(ch, v);
                    changes[ch] = v;
                }
            }
            if (this.#debug) {
                if (this.#debug === "extended") {
                    this.#logger.groupEnd("traversion graph");
                }
                this.#logger.log("success");
                this.#logger.log("reachable", Array.from(reachableNodes));
                this.#logger.log("output", Object.fromEntries(this.#memoryOut));
                this.#logger.log("collected", Object.fromEntries(collected));
                this.#logger.log("changes", changes);
            }
            this.#logger.log("logic calculation count", logicCalculationCounter);
            this.#logger.timeEnd("execution time");
            this.#logger.groupEnd("GRAPH LOGIC EXECUTION");
        }
        return changes;
    }

    set(key, value) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC MEMORY CHANGE");
            this.#logger.log({[key]: value});
            this.#logger.groupEnd("GRAPH LOGIC MEMORY CHANGE");
        }
        this.#memoryIn.set(key, value);
        this.#dirty = true;
    }

    setAll(values) {
        if (this.#debug) {
            this.#logger.groupCollapsed("GRAPH LOGIC MEMORY CHANGE");
        }
        if (values instanceof Map) {
            for (const [k, v] of values) {
                if (this.#debug) {
                    this.#logger.log({[k]: v});
                }
                this.#memoryIn.set(k, v);
            }
        } else if (typeof values == "object" && !Array.isArray(values)) {
            for (const k in values) {
                const v = values[k];
                if (this.#debug) {
                    this.#logger.log({[k]: v});
                }
                this.#memoryIn.set(k, v);
            }
        }
        this.#dirty = true;
        if (this.#debug) {
            this.#logger.groupEnd("GRAPH LOGIC MEMORY CHANGE");
        }
    }

    get(ref) {
        if (this.#forcedReachables.has(ref)) {
            return true;
        }
        return this.#memoryOut.get(ref) ?? false;
    }

    getAll() {
        const obj = {};
        for (const [k, v] of this.#memoryOut) {
            obj[k] = v;
        }
        for (const k of this.#forcedReachables) {
            obj[k] = true;
        }
        return obj;
    }

    getMemory() {
        const obj = {};
        for (const [k, v] of this.#memoryIn) {
            obj[k] = v;
        }
        for (const [k, v] of this.#memoryOut) {
            obj[k] = v;
        }
        for (const k of this.#forcedReachables) {
            obj[k] = true;
        }
        return obj;
    }

    has(ref) {
        return this.#forcedReachables.has(ref) || this.#memoryOut.has(ref);
    }

    reset() {
        if (this.#debug) {
            this.#logger.log("GRAPH LOGIC MEMORY RESET");
        }
        this.#memoryIn.clear();
        this.#memoryOut.clear();
        this.#dirty = true;
    }

    isDirty() {
        return this.#dirty;
    }

}

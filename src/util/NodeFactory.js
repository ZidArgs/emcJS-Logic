class Node {

    #name;

    #edges = new Map();

    constructor(name) {
        this.#name = name;
    }

    getName() {
        return this.#name;
    }

    append(node, condition) {
        if (node instanceof Node) {
            this.#edges.set(node.getName(), new Edge(this, node, condition));
        } else {
            throw new TypeError("Expected type Node");
        }
    }

    remove(node) {
        if (node instanceof Node) {
            this.#edges.delete(node.getName());
        } else {
            throw new TypeError("Expected type Node");
        }
    }

    getTargets() {
        return this.#edges.keys();
    }

    getEdge(name) {
        return this.#edges.get(name);
    }

    toString() {
        return this.getName();
    }

}

class Edge {

    #source;

    #target;

    #condition;

    constructor(source, target, condition) {
        this.#source = source;
        this.#target = target;
        this.#condition = condition;
    }

    getCondition() {
        return this.#condition;
    }

    getTarget() {
        return this.#target;
    }

    getSource() {
        return this.#source;
    }

    toString() {
        return `${this.#source} => ${this.#target}`;
    }

}

/* node factory */
export default class NodeFactory {

    #nodes = new Map();

    reset() {
        this.#nodes.clear();
    }

    get(name) {
        if (this.#nodes.has(name)) {
            return this.#nodes.get(name);
        }
        const node = new Node(name);
        this.#nodes.set(name, node);
        return node;
    }

    getNames() {
        return this.#nodes.keys();
    }

}

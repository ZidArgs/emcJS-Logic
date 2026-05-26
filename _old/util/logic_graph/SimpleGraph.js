import NodeFactory from "./NodeFactory.js";

export default class AccessGraph {

    #nodeFactory = new NodeFactory();

    clearGraph() {
        this.#nodeFactory.reset();
    }

    load(config) {
        for (const cfg in config) {
            const children = config[cfg];
            const node = this.#nodeFactory.get(cfg);
            for (const child in children) {
                const condition = children[child];
                node.append(this.#nodeFactory.get(child), condition);
            }
        }
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

    /* broad search */
    traverse(startNode) {
        const reachableNodes = new Set();
        const start = this.#nodeFactory.get(startNode);
        if (start != null) {
            const queue = [];
            queue.push(start);
            while (queue.length) {
                const node = queue.shift();
                reachableNodes.add(node.getName());
                for (const ch in node.getTargets()) {
                    const child = node.getEdge(ch).getTarget();
                    if (!reachableNodes.has(ch)) {
                        queue.push(child);
                    }
                }
            }
        }
        return Array.from(reachableNodes);
    }

}

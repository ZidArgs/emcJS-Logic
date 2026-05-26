const TRANSPILERS = {
    /* literals */
    "true":     () => "1",
    "false":    () => "0",
    "string":   (logic) => escape(logic.value),
    "number":   (logic) => toNumber(logic.value),
    "value":    (logic) => `(val("${escape(logic.ref)}")||0)`,
    "state":    (logic) => `(val("${escape(logic.ref)}")||"")=="${escape(logic.value)}"`,

    /* operators */
    "and":      (logic) => `${multiElementOperation(logic.content, "&&")}`,
    "nand":     (logic) => `!${multiElementOperation(logic.content, "&&")}`,
    "or":       (logic) => `${multiElementOperation(logic.content, "||")}`,
    "nor":      (logic) => `!${multiElementOperation(logic.content, "||")}`,
    "not":      (logic) => `!(${buildLogic(logic.content)})`,
    "xor":      (logic) => `${twoElementOperation(logic.content, "^") || 1}`,
    "xnor":     (logic) => `!${twoElementOperation(logic.content, "^") || 1}`,

    /* restrictors */
    "min":      (logic) => `(${buildLogic(logic.content)}>=${escape(logic.value, 0)})`,
    "max":      (logic) => `(${buildLogic(logic.content)}<=${escape(logic.value, 0)})`,

    /* comparators */
    "eq":       (logic) => twoElementOperation(logic.content, "=="),
    "neq":      (logic) => twoElementOperation(logic.content, "!="),
    "lt":       (logic) => twoElementOperation(logic.content, "<"),
    "lte":      (logic) => twoElementOperation(logic.content, "<="),
    "gt":       (logic) => twoElementOperation(logic.content, ">"),
    "gte":      (logic) => twoElementOperation(logic.content, ">="),

    /* math */
    "add":      (logic) => mathMultiElementOperation(logic.content, "+"),
    "sub":      (logic) => mathMultiElementOperation(logic.content, "-"),
    "mul":      (logic) => mathMultiElementOperation(logic.content, "*"),
    "div":      (logic) => mathMultiElementOperation(logic.content, "/"),
    "mod":      (logic) => mathMultiElementOperation(logic.content, "%"),
    "pow":      (logic) => mathTwoElementOperation(logic.content, "**"),

    /* special */
    "at":       (logic) => logic.content ? `((val("${escape(logic.node)}")||0)&&${buildLogic(logic.content)})` : `(val("${escape(logic.node)}")||0)`,
    "mixin":    (logic) => `(val("${escape(logic.ref)}")||0)`
};

const dependencies = new Set();

/* STRINGS */
function escape(str, def = "") {
    if (typeof str != "string") {
        if (typeof str == "number" && !isNaN(str)) {
            return str;
        }
        return def;
    }
    const res = str.replace(/[\\"]/g, "\\$&");
    dependencies.add(res);
    return res;
}

/* ELEMENTS */
function twoElementOperation(els, join) {
    if (els.length == 0) {
        return 0;
    }
    if (els.length == 1) {
        return buildLogic(els[0]);
    }
    return `(${buildLogic(els[0])}${join}${buildLogic(els[1])})`;
}

function multiElementOperation(els, join) {
    if (els.length == 0) {
        return 0;
    }
    if (els.length == 1) {
        return buildLogic(els[0]);
    }
    return `(${els.map(buildLogic).join(join)})`;
}

/* MATH */
function toNumber(val) {
    return `(parseInt(${val})||0)`;
}

function mathTwoElementOperation(els, join) {
    if (els.length == 0) {
        return 0;
    }
    if (els.length == 1) {
        return buildLogic(els[0]);
    }
    return toNumber(`${buildLogic(toNumber(els[0]))}${join}${buildLogic(toNumber(els[1]))}`);
}

function mathMultiElementOperation(els, join) {
    if (els.length == 0) {
        return 0;
    }
    if (els.length == 1) {
        return buildLogic(els[0]);
    }
    return toNumber(`${els.map(buildLogic).map(toNumber).join(join)}`);
}

/* INITIATOR */
function buildLogic(logic) {
    if (typeof logic != "object") {
        logic = {type: logic};
    }
    if (TRANSPILERS[logic.type] != null) {
        return TRANSPILERS[logic.type](logic);
    }
    return 0;
}

class Compiler {

    compile(logic) {
        dependencies.clear();
        const buf = buildLogic(logic);
        const fn = new Function("val", `return ${buf}`);
        Object.defineProperty(fn, "requires", {value: dependencies});
        return fn;
    }

}

export default new Compiler();

const TRANSPILERS = {
    /* literals */
    "true":     () => "1",
    "false":    () => "0",
    "string":   (logic) => `${escapeString(logic.value)}`,
    "number":   (logic) => `${escapeNumber(logic.value)}`,
    "value":    (logic) => `(val(${escapeValue(logic.ref)})??0)`,
    "state":    (logic) => `((val(${escapeValue(logic.ref)})??0)==${escapeValue(logic.value)})`,

    /* operators */
    "and":      (logic) => `${multiElementOperation(logic.content, "&&")}`,
    "nand":     (logic) => `!${multiElementOperation(logic.content, "&&")}`,
    "or":       (logic) => `${multiElementOperation(logic.content, "||")}`,
    "nor":      (logic) => `!${multiElementOperation(logic.content, "||")}`,
    "not":      (logic) => `!(${buildLogic(logic.content)})`,
    "xor":      (logic) => `${twoElementOperation(logic.content, "^") || 1}`,
    "xnor":     (logic) => `!${twoElementOperation(logic.content, "^") || 1}`,

    /* restrictors */
    "min":      (logic) => `(${buildLogic(logic.content)}>=${escapeNumber(logic.value)})`,
    "max":      (logic) => `(${buildLogic(logic.content)}<=${escapeNumber(logic.value)})`,
    "regexp":   (logic) => `(/${logic.value}/.test(${buildLogic(logic.content)}))`,

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
    "pow":      (logic) => mathTwoElementOperation(logic.content, "**")
};

const dependencies = new Set();

/* STRINGS */
function escapeString(str) {
    if (typeof str !== "string") {
        if (typeof str === "number" && !isNaN(str)) {
            return `"${str}"`;
        }
        return `""`;
    }
    const res = str.replace(/[\\"]/g, "\\$&");
    return `"${res}"`;
}

/* VALUE */
function escapeValue(str) {
    if (typeof str !== "string") {
        if (typeof str === "number") {
            if (isNaN(str)) {
                return 0;
            }
            return str;
        }
        return 0;
    }
    const res = str.replace(/[\\"]/g, "\\$&");
    dependencies.add(res);
    return `"${res}"`;
}

/* ELEMENTS */
function twoElementOperation(els, join) {
    return multiElementOperation(els.slice(0, 2), join);
}

function multiElementOperation(els, join) {
    if (els.length === 0) {
        return 0;
    }
    return `(${els.map(buildLogic).join(join)})`;
}

/* MATH */
function escapeNumber(val) {
    val = parseInt(val);
    if (!isNaN(val)) {
        return val;
    }
    return 0;
}

function toNumber(val) {
    return `(parseInt(${val})||0)`;
}

function mathTwoElementOperation(els, join) {
    return mathMultiElementOperation(els.slice(0, 2), join);
}

function mathMultiElementOperation(els, join) {
    if (els.length === 0) {
        return 0;
    }
    return `${els.map(buildLogic).map(toNumber).join(join)}`;
}

/* INITIATOR */
function buildLogic(logic) {
    if (typeof logic !== "object") {
        logic = {type: logic};
    }
    if (TRANSPILERS[logic.type] != null) {
        return TRANSPILERS[logic.type](logic);
    }
    return 0;
}

/**
 * @deprecated
 */
class LogicCompiler {

    /**
     * @deprecated
     */
    compile(logic) {
        const buf = buildLogic(logic);
        const fn = new Function("val", `return ${buf}`);
        Object.defineProperty(fn, "requires", {value: dependencies});
        dependencies.clear();
        return fn;
    }

}

export default new LogicCompiler();

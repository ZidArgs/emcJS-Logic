function filterNull(input) {
    return input != null;
}

function filterTrue(input) {
    return input.type === "true";
}

function filterNoTrue(input) {
    return input.type !== "true";
}

function filterFalse(input) {
    return input.type === "false";
}

function filterNoFalse(input) {
    return input.type !== "false";
}

export function reduceLogic(input) {
    switch (input?.type) {
        case "and": {
            if (input.content.every(filterTrue)) {
                return {type: "true"};
            }
            const reducedLogic = input.content.map(reduceLogic).filter(filterNull);
            if (reducedLogic.length === 0) {
                return;
            }
            const resultLogic = reducedLogic.filter(filterNoTrue);
            if (resultLogic.length === 0) {
                return {type: "false"};
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic.some(filterFalse)) {
                return {type: "false"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "nand": {
            if (input.content.every(filterTrue)) {
                return {type: "false"};
            }
            const reducedLogic = input.content.map(reduceLogic).filter(filterNull);
            if (reducedLogic.length === 0) {
                return;
            }
            const resultLogic = reducedLogic.filter(filterNoTrue);
            if (resultLogic.length === 0) {
                return {type: "true"};
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic.some((e) => e.type === "false")) {
                return {type: "true"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "or": {
            if (input.content.every(filterFalse)) {
                return {type: "false"};
            }
            const reducedLogic = input.content.map(reduceLogic).filter(filterNull);
            if (reducedLogic.length === 0) {
                return;
            }
            const resultLogic = reducedLogic.filter(filterNoFalse);
            if (resultLogic.length === 0) {
                return {type: "true"};
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic.some((e) => e.type === "true")) {
                return {type: "true"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "nor": {
            if (input.content.every(filterFalse)) {
                return {type: "true"};
            }
            const reducedLogic = input.content.map(reduceLogic).filter(filterNull);
            if (reducedLogic.length === 0) {
                return;
            }
            const resultLogic = reducedLogic.filter(filterNoFalse);
            if (resultLogic.length === 0) {
                return {type: "false"};
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic.some((e) => e.type === "true")) {
                return {type: "false"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "xor": {
            const resultLogic = input.content.map(reduceLogic).filter(filterNull);
            if (resultLogic.length === 0) {
                return;
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic[0].type === "true" && resultLogic[1].type === "true" || resultLogic[0].type === "false" && resultLogic[1].type === "false") {
                return {type: "false"};
            }
            if (resultLogic[0].type === "false" && resultLogic[1].type === "true" || resultLogic[0].type === "true" && resultLogic[1].type === "false") {
                return {type: "true"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "xnor": {
            const resultLogic = input.content.map(reduceLogic).filter(filterNull);
            if (resultLogic.length === 0) {
                return;
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            if (resultLogic[0].type === "true" && resultLogic[1].type === "true" || resultLogic[0].type === "false" && resultLogic[1].type === "false") {
                return {type: "true"};
            }
            if (resultLogic[0].type === "false" && resultLogic[1].type === "true" || resultLogic[0].type === "true" && resultLogic[1].type === "false") {
                return {type: "false"};
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "add":
        case "sub":
        case "mul":
        case "div":
        case "mod":
        case "pow":
        case "eq":
        case "neq":
        case "gt":
        case "gte":
        case "lt":
        case "lte": {
            const resultLogic = input.content.map(reduceLogic).filter(filterNull);
            if (resultLogic.length === 0) {
                return;
            }
            if (resultLogic.length === 1) {
                return resultLogic[0];
            }
            return {
                type: input.type,
                content: resultLogic
            };
        }
        case "min":
        case "max": {
            const resultLogic = reduceLogic(input.content);
            if (resultLogic == null) {
                return;
            }
            return {
                type: input.type,
                content: resultLogic,
                value: input.value
            };
        }
        case "not": {
            const resultLogic = reduceLogic(input.content);
            if (resultLogic == null) {
                return;
            }
            if (resultLogic.type === "false") {
                return {type: "true"};
            }
            if (resultLogic.type === "true") {
                return {type: "false"};
            }
            if (resultLogic.type === "not") {
                return resultLogic.content;
            }
            return {
                type: "not",
                content: resultLogic
            };
        }
        default: {
            return input;
        }
    }
}

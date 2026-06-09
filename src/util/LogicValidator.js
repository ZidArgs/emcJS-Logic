import TypeGenerator from "@emcjs/core/util/type/TypeGenerator.js";
import TypeValidator from "@emcjs/core/util/type/TypeValidator.js";

class LogicValidator {

    #customValidators = new Map();

    registerCustomValidator(type, validator) {
        this.#customValidators.set(type, validator);
    }

    validate(logic, opts = {}) {
        const {
            label, throwErrors = false, allowEmpty = true
        } = opts;
        const currentLabel = typeof label === "string" && label !== "" ? `| ${label} |` : "|";

        const err = [];
        this.#validate(logic, !allowEmpty, [currentLabel], err);
        if (throwErrors && err.length > 0) {
            const msg = err.map((s) => s.split("\n").join("\n\t")).join("\n\t");
            throw new Error(`Error validating logic:\n\t${msg}`);
        }
        return err;
    }

    #validate(node, noEmpty, path, errors) {
        if (noEmpty && node == null) {
            errors.push(`node can not be null [ ${path.join(" > ")} ]`);
        } else if (typeof node !== "object" || Array.isArray(node)) {
            errors.push(`node has to be dictionary [ ${path.join(" > ")} ]`);
        } else if (!("type" in node)) {
            errors.push(`type missing [ ${path.join(" > ")} ]`);
        } else {
            const currentType = node["type"];
            if (typeof currentType !== "string") {
                errors.push(`type has to be a string [ ${path.join(" > ")} ]`);
            } else {
                this.#validateType(node, noEmpty, [...path, `${currentType}`], errors);
            }
        }
    }

    #validateType(node, noEmpty, path = [], errors = []) {
        const currentType = node["type"];
        switch (currentType) {
            case "value":
            case "param":
            case "paramvalue": {
                if (typeof node["ref"] !== "string") {
                    errors.push(`ref has to be a string [ ${path.join(" > ")} ]`);
                }
            } break;
            case "state": {
                if (typeof node["ref"] !== "string") {
                    errors.push(`ref has to be a string [ ${path.join(" > ")} ]`);
                }
                if (typeof node["value"] !== "string" && (typeof node["value"] !== "number" || isNaN(node["ref"]))) {
                    errors.push(`value has to be a string or a number [ ${path.join(" > ")} ]`);
                }
            } break;
            case "string": {
                if (typeof node["value"] !== "string") {
                    errors.push(`value has to be a string [ ${path.join(" > ")} ]`);
                }
            } break;
            case "number": {
                const val = parseInt(node["value"]);
                if (!isNaN(val)) {
                    errors.push(`value has to be a number [ ${path.join(" > ")} ]`);
                }
            } break;
            case "regexp": {
                this.#validate(node["content"], noEmpty, path, errors);
                if (typeof node["value"] !== "string") {
                    errors.push(`value has to be a string [ ${path.join(" > ")} ]`);
                }
            } break;
            case "and":
            case "nand":
            case "or":
            case "nor":
            case "add":
            case "sub":
            case "mul":
            case "div":
            case "mod": {
                if (!Array.isArray(node["content"]) || node["content"].length < 1) {
                    errors.push(`content has to be a list with at least one logic node [ ${path.join(" > ")} ]`);
                } else {
                    for (const key in node["content"]) {
                        const value = node["content"][key];
                        this.#validate(value, noEmpty, [...path, `{${key}}`], errors);
                    }
                }
            } break;
            case "not": {
                this.#validate(node["content"], noEmpty, path, errors);
            } break;
            case "xor":
            case "xnor":
            case "eq":
            case "neq":
            case "lt":
            case "lte":
            case "gt":
            case "gte":
            case "pow": {
                if (!Array.isArray(node["content"]) || node["content"].length < 1 || node["content"].length > 2) {
                    errors.push(`content has to be a list of exactly 2 logic nodes [ ${path.join(" > ")} ]`);
                } else {
                    for (const key in node["content"]) {
                        const value = node["content"][key];
                        this.#validate(value, noEmpty, [...path, `{${key}}`], errors);
                    }
                }
            } break;
            case "min":
            case "max": {
                this.#validate(node["content"], noEmpty, path, errors);
                const val = parseInt(node["value"]);
                if (isNaN(val)) {
                    errors.push(`value has to be a number [ ${path.join(" > ")} ]`);
                }
            } break;
            case "true":
            case "false": {
                // all ok
            } break;
            default: {
                if (!this.#customValidators.has(currentType)) {
                    errors.push(`unknown type "${currentType}" [ ${path.join(" > ")} ]`);
                    return;
                } else {
                    const validator = this.#customValidators.get(currentType);
                    const result = validator(node, (node, noEmpty, path, errors) => this.#validate(node, noEmpty, path, errors));
                    if (typeof result === "string") {
                        errors.push(`${result} [ ${path.join(" > ")} ]`);
                    }
                }
            } break;
        }
    }

}

const logicValidator = new LogicValidator();

export default logicValidator;

TypeValidator.registerCustomValidator("Logic", (value) => {
    if (typeof value !== "boolean") {
        if (typeof value !== "object" || Array.isArray(value)) {
            return ["boolean or logic definition expected"];
        } else {
            const logicErrors = logicValidator.validate(value, {allowEmpty: false});
            if (logicErrors.length > 0) {
                return logicErrors;
            }
        }
    }
});

TypeGenerator.registerCustomGenerator("Logic", (currentValue, definition) => {
    if (typeof currentValue === "boolean") {
        return currentValue;
    }
    if (logicValidator.validate(currentValue, {allowEmpty: false}).length <= 0) {
        return currentValue;
    }
    const defaultValue = definition.default;
    if (typeof defaultValue === "boolean") {
        return defaultValue;
    }
    if (logicValidator.validate(defaultValue, {allowEmpty: false}).length <= 0) {
        return defaultValue;
    }
    return false;
});

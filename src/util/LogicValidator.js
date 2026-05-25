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
            case "value": {
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
            default: {
                if (currentType !== "true" && currentType !== "false") {
                    errors.push(`unknown type "${currentType}" [ ${path.join(" > ")} ]`);
                }
            } break;
        }
    }

}

export default new LogicValidator();

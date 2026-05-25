import LogicStatement, {
    PARAM_STRING,
    VAL_STRING
} from "./LogicStatement.js";

export const EXEC_STRING = "exec";

// data = () => false
// at = () => false
export default class EdgeStatement extends LogicStatement {

    static get parameterString() {
        return `${VAL_STRING} = () => false, ${EXEC_STRING} = () => false, ${PARAM_STRING} = []`;
    }

}

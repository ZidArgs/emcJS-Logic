import {debounce} from "@emcjs/core/util/Debouncer.js";
import EventTargetManager from "@emcjs/core/util/event/EventTargetManager.js";
import StatementCompiler from "../compiler/StatementCompiler.js";

const EVENTS = [
    "load",
    "clear",
    "change"
];

export default class LogicHandler extends EventTarget {

    #source = null;

    #sourceEventManager = new EventTargetManager();

    #value = true;

    #logic = null;

    #data = new Map();

    constructor(source, logic = true, events = EVENTS) {
        if (!(source instanceof EventTarget)) {
            throw new TypeError("source must be an instance of EventTarget");
        }
        if (!Array.isArray(events)) {
            events = [];
        }
        super();
        this.#source = source;
        if (events.length > 0) {
            this.#sourceEventManager.set(events, () => {
                this.#update();
            });
        }
        this.#init(logic);
    }

    #init(logic) {
        if (typeof logic == "object") {
            this.#logic = StatementCompiler.compile(logic);
            this.#value = this.#execute();
            this.#sourceEventManager.switchTarget(this.#source);
        } else if (logic != null) {
            this.#logic = logic;
            this.#value = !!logic;
            this.#sourceEventManager.switchTarget();
        }
    }

    #getValue(key) {
        return this.#data.get(key) ?? this.#source.get?.(key);
    }

    #execute() {
        return !!this.#logic((key) => {
            return this.#getValue(key);
        });
    }

    #update = debounce(() => {
        if (typeof this.#logic == "function") {
            const value = this.#execute();
            if (this.#value != value) {
                this.#value = value;
                const event = new Event("change");
                event.value = value;
                this.dispatchEvent(event);
            }
        }
    });

    setLogic(logic) {
        this.#init(logic);
    }

    setDataValue(key, value) {
        const old = this.#data.get(key);
        if (old != value) {
            this.#data.set(key, value);
            this.#update();
        }
    }

    removeDataValue(key) {
        if (this.#data.has(key)) {
            this.#data.delete(key);
            this.#update();
        }
    }

    clearData() {
        this.#data.clear();
        this.#update();
    }

    get value() {
        return !!this.#value;
    }

}

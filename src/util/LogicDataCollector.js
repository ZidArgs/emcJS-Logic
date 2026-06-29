import EventMultiTargetManager from "@emcjs/core/util/event/EventMultiTargetManager.js";
import {
    debounce,
    debounceCacheData
} from "@emcjs/core/util/Debouncer.js";
import ObservableStorage from "@emcjs/core/data/storage/observable/ObservableStorage.js";
import AppStateStorageWrapper from "@emcjs/core/data/state/AppStateStorageWrapper.js";
import LogicDataStorage from "../data/LogicDataStorage.js";

export default class LogicDataCollector extends EventTarget {

    #storageRegister = new Map();

    #augments = new Set();

    #storage = new LogicDataStorage();

    #eventManager = new EventMultiTargetManager();

    constructor() {
        super();
        /* EVENTS */
        this.#eventManager.set(["load", "clear"], () => {
            this.init();
        });
        this.#eventManager.set("change", (event) => {
            const storage = event.target;
            const {
                prefix, postfix, precall
            } = this.#storageRegister.get(storage);
            const data = event.data;
            if (typeof precall === "function") {
                this.#changeData(this.#renameKeys(precall(data), prefix, postfix));
            } else {
                this.#changeData(this.#renameKeys(data, prefix, postfix));
            }
        });
    }

    init = debounce(() => {
        const logicData = {};
        for (const [storage, conf] of this.#storageRegister) {
            const {
                prefix, postfix, precall
            } = conf;
            const data = storage.getAll();
            if (typeof precall === "function") {
                this.#addRenameKeys(logicData, precall(data), prefix, postfix);
            } else {
                this.#addRenameKeys(logicData, data, prefix, postfix);
            }
        }
        // ---
        this.#storage.clear();
        this.#storage.setAll(logicData);

        this.#execAugments();

        const ev = new Event("load");
        ev.data = this.#storage.getAll();
        this.dispatchEvent(ev);

        this.#storage.flush();
    });

    #changeData = debounceCacheData((newData) => {
        const changes = {};
        for (const [data] of newData) {
            for (const [key, value] of Object.entries(data)) {
                const oldValue = this.#storage.get(key);
                if (oldValue != value) {
                    changes[key] = value;
                }
            }
        }

        if (Object.keys(changes).length > 0) {
            this.#storage.setAll(changes);

            this.#execAugments();

            const ev = new Event("change");
            ev.data = this.#storage.getAllChanges();
            this.dispatchEvent(ev);

            this.#storage.flush();
        }
    });

    get(key) {
        return this.#storage.getAugmented(key);
    }

    registerStorage(storage, prefix = "", postfix = "", precall = null) {
        if (!(storage instanceof ObservableStorage) && !(storage instanceof AppStateStorageWrapper)) {
            throw new TypeError("storage must be ObservableStorage or AppStateStorageWrapper");
        }
        this.#eventManager.addTarget(storage);
        this.#storageRegister.set(storage, {
            prefix,
            postfix,
            precall
        });
        this.init();
    }

    unregisterStorage(storage) {
        if (!(storage instanceof ObservableStorage) && !(storage instanceof AppStateStorageWrapper)) {
            throw new TypeError("storage must be ObservableStorage or AppStateStorageWrapper");
        }
        this.#eventManager.removeTarget(storage);
        this.#storageRegister.delete(storage);
        this.init();
    }

    registerAugment(augment) {
        if (typeof augment != "function") {
            throw new TypeError(`augment parameter must be of type "function" but was "${typeof ref}"`);
        }
        if (!this.#augments.has(augment)) {
            this.#augments.add(augment);
            this.init();
        }
    }

    unregisterAugment(augment) {
        if (typeof augment != "function") {
            throw new TypeError(`augment parameter must be of type "function" but was "${typeof ref}"`);
        }
        if (this.#augments.has(augment)) {
            this.#augments.delete(augment);
            this.init();
        }
    }

    #execAugments() {
        for (const augment of this.#augments) {
            augment(this.#storage.restricted);
        }
    }

    #renameKeys(src = {}, prefix = "", postfix = "") {
        const res = {};
        for (const [key, value] of Object.entries(src)) {
            res[`${prefix}${key}${postfix}`] = value;
        }
        return res;
    }

    #addRenameKeys(target = {}, source = {}, prefix = "", postfix = "") {
        for (const [key, value] of Object.entries(source)) {
            target[`${prefix}${key}${postfix}`] = value;
        }
        return target;
    }

}

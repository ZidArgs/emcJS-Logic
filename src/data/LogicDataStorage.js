export default class LogicDataStorage {

    #baseData = new Map();

    #changeData = new Map();

    #augmentData = new Map();

    set(key, value) {
        this.#changeData.set(key, value);
    }

    setAll(data = {}) {
        for (const [key, value] of Object.entries(data)) {
            this.#changeData.set(key, value);
        }
    }

    get(key) {
        return this.#changeData.get(key) ?? this.#baseData.get(key);
    }

    getBaseValue(key) {
        return this.#baseData.get(key);
    }

    hasChange(key) {
        return this.#changeData.has(key);
    }

    flush() {
        for (const [key, value] of this.#changeData) {
            this.#baseData.set(key, value);
        }
        this.#changeData.clear();
    }

    clear() {
        this.#baseData.clear();
        this.#changeData.clear();
        this.#augmentData.clear();
    }

    // ---

    setAugmented(key, value) {
        this.#augmentData.set(key, value);
    }

    deleteAugmented(key) {
        if (this.#augmentData.get(key)) {
            this.#augmentData.delete(key);
        }
    }

    getAugmented(key) {
        return this.#augmentData.get(key) ?? this.#changeData.get(key) ?? this.#baseData.get(key);
    }

    clearAugments() {
        this.#augmentData.clear();
    }

    // ---

    getAll() {
        const res = {};
        for (const [key, value] of this.#baseData) {
            res[key] = value;
        }
        for (const [key, value] of this.#changeData) {
            res[key] = value;
        }
        for (const [key, value] of this.#augmentData) {
            res[key] = value;
        }
        return res;
    }

    getAllChanges() {
        const res = {};
        for (const [key, value] of this.#changeData) {
            res[key] = value;
        }
        for (const [key, value] of this.#augmentData) {
            res[key] = value;
        }
        return res;
    }

    getAllAugments() {
        const res = {};
        for (const [key, value] of this.#augmentData) {
            res[key] = value;
        }
        return res;
    }

    // ---

    get restricted() {
        return {
            hasChange: this.hasChange.bind(this),
            get: this.get.bind(this),
            getBaseValue: this.getBaseValue.bind(this),
            setAugmented: this.setAugmented.bind(this),
            deleteAugmented: this.deleteAugmented.bind(this),
            getAugmented: this.getAugmented.bind(this),
            getAll: this.getAll.bind(this),
            getAllChanges: this.getAllChanges.bind(this),
            getAllAugments: this.getAllAugments.bind(this)
        };
    }

}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ClientStore {
    constructor(obj) {
        this.data = new Map();
        this.functionMap = new Map();
        this.set(obj);
    }
    set(obj, addFunc) {
        let unBindFunctions = [];
        for (let key in obj) {
            this.data.set(key, obj[key]);
            let functions = this.functionMap.get(key);
            if (functions) {
                functions.forEach(fn => fn({ [key]: obj[key] }));
            }
            if (addFunc) {
                if (functions) {
                    this.functionMap.set(key, [...functions, addFunc]);
                }
                else {
                    this.functionMap.set(key, [addFunc]);
                }
                unBindFunctions.push(() => {
                    this.unBind(key, addFunc);
                });
            }
        }
        return () => {
            unBindFunctions.forEach(f => f());
        };
    }
    get(obj) {
        let returnObj = {};
        for (let key in obj) {
            returnObj[key] = this.data.get(key) || obj[key];
        }
        return returnObj;
    }
    unBind(key, fnToUnbind) {
        const functions = this.functionMap.get(key);
        this.functionMap.set(key, functions.filter(fn => fn !== fnToUnbind));
    }
}
exports.ClientStore = ClientStore;
//# sourceMappingURL=RibStore.js.map
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
                addFunc({ [key]: obj[key] });
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
    bindToServerStore(ribInstance, serverStoreName) {
        ribInstance._socket.on(`RibStore_${serverStoreName}`, (obj) => {
            this.set(obj);
        });
        ribInstance._socket.emit(`RibStoreRequest_${serverStoreName}`);
    }
    unBind(key, fnToUnbind) {
        const functions = this.functionMap.get(key);
        this.functionMap.set(key, functions.filter(fn => fn !== fnToUnbind));
    }
}
exports.ClientStore = ClientStore;
class ServerStore {
    constructor(obj) {
        this.data = new Map();
        this.functionMap = new Map();
        this.availableSockets = new Map();
        this.storeName = null;
        this.isExposed = false;
        this.isPublicStore = true;
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
                addFunc({ [key]: obj[key] });
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
        if (this.isExposed) {
            if (this.isPublicStore) {
                this.ribInstance._nameSpace.emit(`RibStore_${this.storeName}`, obj);
            }
            else {
                this.availableSockets.forEach(socket => {
                    socket.emit(`RibStore_${this.storeName}`, obj);
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
    exposeStore(storeName, ribInstance, isPublicStore) {
        this.isExposed = true;
        this.storeName = storeName;
        this.isPublicStore = isPublicStore;
        this.ribInstance = ribInstance;
        if (this.isPublicStore) {
            this.ribInstance._nameSpace.on(`RibStoreRequest_${this.storeName}`, (socket) => {
                socket.emit(`RibStore_${this.storeName}`, this.getFullObject());
            });
        }
    }
    giveAccess(client) {
        if (!this.isPublicStore) {
            if (client && client._ribSocketId) {
                let socketId = client._ribSocketId;
                let socket = this.ribInstance._socketMap.get(socketId);
                if (socket) {
                    this.availableSockets.set(socketId, socket);
                    socket.on('disconnect', () => {
                        this.availableSockets.delete(socketId);
                    });
                    socket.on(`RibStoreRequest_${this.storeName}`, () => {
                        socket.emit(`RibStore_${this.storeName}`, this.getFullObject());
                    });
                }
            }
        }
    }
    getFullObject() {
        let allKeys = [...this.data.keys()];
        let fullStore = {};
        for (let key of allKeys) {
            fullStore[key] = this.data.get(key);
        }
        return fullStore;
    }
    unBind(key, fnToUnbind) {
        const functions = this.functionMap.get(key);
        this.functionMap.set(key, functions.filter(fn => fn !== fnToUnbind));
    }
}
exports.ServerStore = ServerStore;
//# sourceMappingURL=RibStore.js.map
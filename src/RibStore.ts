import RibServer, { SocketIORib } from 'rib-server'

export class ClientStore {
    private data = new Map<string, any>()
    private functionMap = new Map<string, ((value?: any) => void)[]>()

    constructor(obj: object) {
        this.set(obj)
    }

    set(obj: object, addFunc?: (value?: any) => void) {
        let unBindFunctions = []

        for (let key in obj) {
            this.data.set(key, obj[key])

            let functions = this.functionMap.get(key)
            
            if (functions) {
                functions.forEach(fn => fn({ [key]: obj[key] }))
            }

            if (addFunc) {
                if (functions) {
                    this.functionMap.set(key, [...functions, addFunc])
                } else {
                    this.functionMap.set(key, [addFunc])
                }

                unBindFunctions.push(() => {
                    this.unBind(key, addFunc)
                })
            }
        }

        return () => {
            unBindFunctions.forEach(f => f())
        }
    }

    get(obj : object) {
        let returnObj = {}
        for (let key in obj) {
            returnObj[key] = this.data.get(key) || obj[key]
        }
        return returnObj
    }

    private unBind(key: string, fnToUnbind: (value?: any) => void) {
        const functions = this.functionMap.get(key)
        this.functionMap.set(key, functions.filter(fn => fn !== fnToUnbind))
    }
}

export class ServerStore {
    private data = new Map<string, any>()
    private functionMap = new Map<string, ((value?: any) => void)[]>()
    private availableSockets = new Map<string, SocketIORib.Socket>()
    private ribInstance : RibServer
    private storeName = null
    private isExposed = false
    private isPublicStore = true

    constructor(obj: object) {
        this.set(obj)
    }

    set(obj: object, addFunc?: (value?: any) => void) {
        let unBindFunctions = []

        for (let key in obj) {
            this.data.set(key, obj[key])

            let functions = this.functionMap.get(key)
            
            if (functions) {
                functions.forEach(fn => fn({ [key]: obj[key] }))
            }

            if (addFunc) {
                if (functions) {
                    this.functionMap.set(key, [...functions, addFunc])
                } else {
                    this.functionMap.set(key, [addFunc])
                }

                unBindFunctions.push(() => {
                    this.unBind(key, addFunc)
                })
            } 
        }

        if (this.isExposed) {
            if (this.isPublicStore) {
                this.ribInstance._nameSpace.emit(`RibStore_${this.storeName}`, obj)
            } else {
                this.availableSockets.forEach(socket => {
                    socket.emit(`RibStore_${this.storeName}`, obj)
                })
            }
        }

        return () => {
            unBindFunctions.forEach(f => f())
        }
    }

    get(obj : object) {
        let returnObj = {}
        for (let key in obj) {
            returnObj[key] = this.data.get(key) || obj[key]
        }
        return returnObj
    }

    exposeStore(storeName: string, ribInstance: RibServer, isPublicStore?: boolean) {
        this.isExposed = true
        this.storeName = storeName
        this.isPublicStore = isPublicStore
        this.ribInstance = ribInstance
    }

    giveAccess(clients: any[]) {
        if (this.isPublicStore) {
            this.ribInstance._nameSpace.on(`RibStoreUpdate_${this.storeName}`, (obj: object) => {
                this.set(obj)
            })
        } else {
            for (let client of clients) {
                if (client && client._ribSocketId) {
                    let socketId = client._ribSocketId
                    let socket = this.ribInstance._socketMap.get(socketId)
                    if (socket) {
                        this.availableSockets.set(socketId, socket)
                        socket.on('disconnect', () => {
                            this.availableSockets.delete(socketId)
                        })

                        socket.on(`RibStoreUpdate_${this.storeName}`, (obj: object) => {
                            this.set(obj)
                        })
                    }
                }
            }
        }
    }

    private unBind(key: string, fnToUnbind: (value?: any) => void) {
        const functions = this.functionMap.get(key)
        this.functionMap.set(key, functions.filter(fn => fn !== fnToUnbind))
    }
}
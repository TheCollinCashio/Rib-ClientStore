import RibServer from 'rib-server';
import RibClient from 'rib-client';
export declare class ClientStore {
    private data;
    private functionMap;
    constructor(obj: object);
    set(obj: object, addFunc?: (value?: any) => void): () => void;
    get(obj: object): {};
    bindToServerStore(serverStoreName: string, ribInstance: RibClient): void;
    private unBind;
}
export declare class ServerStore {
    private data;
    private functionMap;
    private availableSockets;
    private ribInstance;
    private storeName;
    private isExposed;
    private isPublicStore;
    constructor(obj: object);
    set(obj: object, addFunc?: (value?: any) => void): () => void;
    get(obj: object): {};
    exposeStore(storeName: string, ribInstance: RibServer, isPublicStore?: boolean): void;
    giveAccess(client: any): void;
    private getFullObject;
    private unBind;
}

export default class RibStore {
    private data;
    private functionMap;
    constructor(obj: object);
    set(obj: object, addFunc?: (value?: any) => void): () => void;
    get(obj: object): {};
    private unBind;
}

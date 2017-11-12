export interface IObjectStore<T> {
	get(key: number): Promise<T>;
	getMultiple(keys: number[]): Promise<T[]>;
	getRange(indexName: string, low: string | string[], high: string | string[], limit?: number): Promise<T[]>;
	add(items: T[]): Promise<void>;
	put(items: T[]): Promise<void>;
	clear(): Promise<void>;
}

export class ObjectStore<T> implements IObjectStore<T> {

	constructor(
		private storeName: string,
		private db: IDBDatabase) {
	}

	/**
	 * Get a single object from store
	 * @param key primary key of object
	 */
	public get(key: number): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			let result: T | null = null;
			const txn = this.getTransaction((e) => resolve(result as T), (e) => reject(e));
			this.getObjectStore(txn).get(key).onsuccess = (e) => result = (e.target as IDBRequest).result as T;
		});
	}

	/**
	 * Get multiple objects from store
	 * @param keys collection of primery keys
	 */
	public getMultiple(keys: number[]): Promise<T[]> {
		return new Promise<T[]>((resolve, reject) => {
			const resultArray = new Array<T>();
			const txn = this.getTransaction((e) => resolve(resultArray), (e) => reject(e));
			const store = this.getObjectStore(txn);

			keys.forEach((key) => {
				const req = store.get(key);
				req.onsuccess = (e) => {
					const result = (e.target as IDBRequest).result as T;
					if (result) {
						resultArray.push(result);
					}
				};
			});
		});
	}

	/**
	 * Get multiple objects based on range of keys in index
	 * @param indexName index to use for range query
	 * @param low lower bound of keys of index
	 * @param high upper bound of keys of index
	 * @param limit? max number of records to fetch if specified
	 */
	public getRange(indexName: string, low: string | string[], high: string | string[], limit?: number): Promise<T[]> {
		return Promise.reject("Method not implemented");
	}

	/**
	 * add objects in store
	 * @param items objects which we want to store
	 */
	public add(items: T[]): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const txn = this.getTransaction((e) => resolve(), (e) => reject(e), /* isWriteMode */ true);
			const store = this.getObjectStore(txn);
			items.forEach((item) => store.add(item));
		});
	}

	/**
	 * upsert objects in store
	 * @param items objects which we want to store
	 */
	public put(items: T[]): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const txn = this.getTransaction((e) => resolve(), (e) => reject(e), /* isWriteMode */ true);
			const store = this.getObjectStore(txn);
			items.forEach((item) => store.put(item));
		});
	}

	/**
	 * Delete all objects from store
	 */
	public clear(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			const txn = this.getTransaction((e) => resolve(), (e) => reject(e), /* isWriteMode */ true);
			this.getObjectStore(txn).clear();
		});
	}

	private getObjectStore(txn: IDBTransaction): IDBObjectStore {
		return txn.objectStore(this.storeName);
	}

	private getTransaction(completeHandler: (e: Event) => void,
                        abortHandler: (e: Event) => void,
                        isWriteMode?: boolean): IDBTransaction {
		const txn = this.db.transaction([this.storeName], isWriteMode ? "readwrite" : "readonly");
		txn.oncomplete = (e) => completeHandler(e);
		txn.onabort = (e) => abortHandler(e);
		return txn;
	}
}

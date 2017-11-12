import { IObjectStore } from "../common/objectstore";
import { IReplyChain } from "../common/replychain";
import { SchemaDefinition } from "../common/schema";
import { Storage } from "../common/storage";
import { IStorageWrapper } from "../common/storage-wrapper";

export class ThreadStorage implements IStorageWrapper<IReplyChain> {
	private objectStore: IObjectStore<IReplyChain>;
	private storeReady = false;

	constructor(dbName: string) {
		const schema = new SchemaDefinition();
		const storage = new Storage(dbName, schema);
		storage.getObjectStore(schema.stores.replychains.name).then((store) => {
			this.objectStore = store;
			this.storeReady = true;
		});
	}

	/**
	 * Method which tells the storage initialization state
	 */
	public get isStoreReady(): boolean {
		return this.storeReady;
	}

	public get(key: number): Promise<IReplyChain> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.get(key);
	}

	public getMultiple(keys: number[]): Promise<IReplyChain[]> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.getMultiple(keys);
	}

	public getRange(indexName: string, low: string | string[], high: string | string[], limit?: number | undefined)
									: Promise<IReplyChain[]> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.getRange(indexName, low, high, limit);
	}

	public add(items: IReplyChain[]): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.add(items);
	}

	public put(items: IReplyChain[]): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.put(items);
	}

	public clear(): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.objectStore.clear();
	}
}

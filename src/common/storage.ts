import { IObjectStore, ObjectStore } from "./objectstore";
import { IReplyChain } from "./replychain";
import { ISchemaDefinition } from "./schema";

export class Storage {
	private db: IDBDatabase | null = null;
	private openRequestComplete = false;
	private schema: ISchemaDefinition;
	private pendingPromisesContext = new Array<(shouldReject: boolean, rejectionReason?: string) => void>();
	private objectStores: {[key: string]: IObjectStore<IReplyChain>} = {};

	constructor(dbName: string, schema: ISchemaDefinition) {
		this.schema = schema;
		const request = indexedDB.open(dbName, this.schema.version);
		request.onerror = this.openErrorHandler.bind(this);
		request.onupgradeneeded = this.upgradeHandler.bind(this);
		request.onsuccess = this.openHandler.bind(this);
	}

	/**
	 * Get object store from database
	 * @param name of the object-store
	 */
	public getObjectStore(name: string): Promise<IObjectStore<IReplyChain>> {
		const p = new Promise<IObjectStore<IReplyChain>>((resolve, reject) => {
			if (this.objectStores[name]) {
				resolve(this.objectStores[name]);
				return;
			}

			let storeDefinedInSchema = false;
			for (const key of Object.keys(this.schema.stores)) {
				if (name === this.schema.stores[key].name) {
					storeDefinedInSchema = true;
					break;
				}
			}

			const returnStore = (shouldRejct: boolean, rejectionReason?: string) => {
				if (shouldRejct) {
					reject(rejectionReason);
				} else {
					if (!this.objectStores[name]) {
						this.objectStores[name] = new ObjectStore<IReplyChain>(name, this.db as IDBDatabase);
					}
					resolve(this.objectStores[name]);
				}
			};

			if (!storeDefinedInSchema) {
				returnStore(true, "ObjectStore not defined in schema");
				return;
			}

			if (this.db) {
				returnStore(false);
			} else if (this.openRequestComplete) {
				returnStore(true, "Can't open database");
			} else {
				this.pendingPromisesContext.push(returnStore);
			}
		});

		return p;
	}

	/**
	 * create database based on schema if not already present
	 * @param e storage version change event
	 */
	private upgradeHandler(e: IDBVersionChangeEvent) {
		const transientDB = (e.target as IDBOpenDBRequest).result as IDBDatabase;
		for (const key of Object.keys(this.schema.stores)) {
			const storeSchema = this.schema.stores[key];

			// create ObjectStore
			const store = transientDB.createObjectStore(storeSchema.name,
																									{
																										keyPath: storeSchema.primaryKeyPath,
																										autoIncrement: storeSchema.autoIncrement,
																									});

			// create indexes
			if (storeSchema.indexes) {
				storeSchema.indexes.forEach((indexSchema) => {
					store.createIndex(indexSchema.name,
														indexSchema.keyPath,
														{unique: indexSchema.unique});
				});
			}
		}
	}

	private openHandler(e: Event) {
		this.db = (e.target as IDBOpenDBRequest).result as IDBDatabase;
		this.openRequestComplete = true;
		this.db.onerror = this.errorHandler.bind(this);
		while (this.pendingPromisesContext.length > 0) {
			const lastContext = this.pendingPromisesContext.pop();
			if (lastContext) {
				lastContext(false);
			}
		}
	}

	private errorHandler(e: Event) {
		console.error("Storage error: ", e.target);
	}

	private openErrorHandler(e: Event) {
		this.openRequestComplete = true;
		console.error("Database open error: ", e.target);
		while (this.pendingPromisesContext.length > 0) {
			const lastContext = this.pendingPromisesContext.pop();
			if (lastContext) {
				lastContext(true, "Can't open database");
			}
		}
	}
}

import { IReplyChain } from "../common/replychain";
import { IStorageWrapper } from "../common/storage-wrapper";
import { ICommand, IWorkerData, IWorkerResult } from "../common/transport-interfaces";

export class WorkerStorage implements IStorageWrapper<IReplyChain> {
	private nextCorrelationId = 1;
	private callbacks: {[key: number]: any} = {};
	private worker: Worker;
	private storeReady = false;

	constructor() {
		this.worker = new Worker("dist/worker-bundle.js");
		this.worker.addEventListener("error", (e) => console.error(e));
		this.worker.addEventListener("message", this.receiveMessageHandler.bind(this));
		this.probeStorageReadyState();
	}

	public get isStoreReady(): boolean {
		return this.storeReady;
	}

	public get(key: number): Promise<IReplyChain> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("get", [key]) as Promise<IReplyChain>;
	}

	public getMultiple(keys: number[]): Promise<IReplyChain[]> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("getMultiple", [keys]) as Promise<IReplyChain[]>;
	}

	public getRange(indexName: string, low: string | string[], high: string | string[], limit?: number | undefined)
					 : Promise<IReplyChain[]> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("getRange", [indexName, low, high, limit]) as Promise<IReplyChain[]>;
	}

	public add(items: IReplyChain[]): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("add", [items]) as Promise<void>;
	}

	public put(items: IReplyChain[]): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("put", [items]) as Promise<void>;
	}

	public clear(): Promise<void> {
		if (!this.storeReady) {
			return Promise.reject("Storage not ready yet.");
		}
		return this.fireRPC("clear", []) as Promise<void>;
	}

	private receiveMessageHandler(e: MessageEvent) {
		const data: IWorkerData = e.data;
		// console.log("received data: ", data);
		const id = data.correlationId;
		if (this.callbacks[id]) {
			this.callbacks[id](data.result);
			this.callbacks[id] = undefined;
		}
	}

	private fireRPC(procedure: ICommand["function"], parameters: any[]): Promise<IWorkerResult["value"]> {
		return new Promise<IWorkerResult["value"]>((resolve, reject) => {
			const command: ICommand = {
				correlationId: this.nextCorrelationId++,
				function: procedure,
				args: parameters,
			};

			this.callbacks[command.correlationId] = ((res, rej) => {
				return (result: IWorkerResult) => {
					if (result.isError) {
						rej(result.value);
					} else {
						res(result.value);
					}
				};
			})(resolve, reject);

			// console.log("firing command: ", command);
			// TODO: trasfer object ownership to worker for better performance
			this.worker.postMessage(command);
		});
	}

	private probeStorageReadyState() {
		this.fireRPC("isStoreReady", []).then((value) => {
			const isReady = value as boolean;
			if (isReady) {
				this.storeReady = true;
			} else {
				console.log("worker storage not yet ready.");
				setTimeout(this.probeStorageReadyState.bind(this), 100);
			}
		});
	}
}

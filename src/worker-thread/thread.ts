import { IReplyChain } from "../common/replychain";
import { IStorageWrapper } from "../common/storage-wrapper";
import { ThreadStorage } from "../common/thread-storage";
import { ICommand, IWorkerData, IWorkerResult } from "../common/transport-interfaces";

class Proxy {
	private threadStorage: IStorageWrapper<IReplyChain>;

	constructor(private worker: DedicatedWorkerGlobalScope) {
		this.threadStorage = new ThreadStorage("Worker");
		this.worker.addEventListener("message", this.receiveMessageHandler.bind(this));

	}

	private receiveMessageHandler(e: MessageEvent) {
		const command: ICommand = e.data;
		const data: IWorkerData = {
			correlationId: command.correlationId,
			result: {isError: false, value: undefined},
		};

		try {
			switch (command.function) {
				case "isStoreReady":
					this.postBack(data, false, this.threadStorage.isStoreReady);
					break;
				case "add":
				case "clear":
				case "get":
				case "getMultiple":
				case "getRange":
				case "put":
					(this.threadStorage[command.function].apply(this.threadStorage, command.args) as Promise<IWorkerResult["value"]>)
						.then((value) => {
							this.postBack(data, false, value);
						}).catch((reason) => {
							this.postBack(data, true, reason);
						});
					break;
				default:
					this.postBack(data, true, "Command Not Implemented");
					break;
			}
		} catch (error) {
			this.postBack(data, true, error);
		}
	}

	private postBack(data: IWorkerData, isError: boolean, value: IWorkerResult["value"]) {
		data.result.isError = isError;
		data.result.value = value;
		this.worker.postMessage(data);
	}
}

const _ = new Proxy(self as DedicatedWorkerGlobalScope);

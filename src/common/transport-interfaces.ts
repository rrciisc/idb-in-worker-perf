import { IReplyChain } from "./replychain";

export interface IWorkerResult {
	isError: boolean;
	value: IReplyChain[] | IReplyChain | boolean | string | undefined;
}

export interface IWorkerData {
	correlationId: number;
	result: IWorkerResult;
}

export interface ICommand {
	correlationId: number;
	function: "isStoreReady" | "get" | "getMultiple" | "getRange" | "add" | "put" | "clear";
	args: any[];
}

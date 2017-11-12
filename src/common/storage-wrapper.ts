import { IObjectStore } from "./objectstore";

export interface IStorageWrapper<T> extends IObjectStore<T> {
	readonly isStoreReady: boolean;
}

import { IObjectStore } from "../common/objectstore";
import { IReplyChain } from "../common/replychain";
import { SchemaDefinition } from "../common/schema";
import { Storage } from "../common/storage";
import { generateMockChains } from "./mock-data";

const storageSchema = new SchemaDefinition();
const storage = new Storage("Main", storageSchema);
const objectStore = storage.getObjectStore(storageSchema.stores.replychains.name);
const BATCH_SIZE = 1000;
const GET_PERCENTAGE = 25;

Promise.all([objectStore]).then((values) => {
	const os = values[0] as IObjectStore<IReplyChain>;

	// buttons
	const buttonsList = ["cleanDataButton", "insertDataButton", "updateDataButton", "getDataButton", "scenarioButton"];
	buttonsList.forEach((buttonId) => {
		const btn = document.getElementById(buttonId) as HTMLButtonElement;
		btn.disabled = false;
	});
	let indexId = 1;

	const toggleButtonsState = () => {
		buttonsList.forEach((buttonId) => {
			const btn = document.getElementById(buttonId) as HTMLButtonElement;
			btn.disabled = !btn.disabled;
		});
	};

	// logs
	const logElement = document.getElementById("logTA") as HTMLTextAreaElement;

	const instrumentedButtonAction = (action: string,
                                   func: () => Promise<void | IReplyChain[]>)
                                  : Promise<void | IReplyChain[]> => {
		toggleButtonsState();
		const tStart = performance.now();
		return func().then((response) => {
			const tEnd = performance.now();
			logElement.value += `action: '${action}' ; time: ${(tEnd - tStart).toFixed(2)} msec.\n`;
			toggleButtonsState();
			return response;
		});
	};

	const cleanButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
		(document.getElementById("getDataButton") as HTMLButtonElement).disabled = true;
		return instrumentedButtonAction("Clean Data", (): Promise<void> => {
			indexId = 1;
			return os.clear();
		});
	};

	const insertButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
		return new Promise<void>((resolve, reject) => {
			generateMockChains(BATCH_SIZE, indexId).then((chains) => {
				indexId += BATCH_SIZE;
				(document.getElementById("getDataButton") as HTMLButtonElement).disabled = false;
				return instrumentedButtonAction("Insert Data", (): Promise<void> => {
					return os.add(chains);
				}).then(() => resolve());
			});
		});
	};

	const updateButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
		return new Promise<void>((resolve, reject) => {
			generateMockChains(BATCH_SIZE).then((chains) => {
				(document.getElementById("getDataButton") as HTMLButtonElement).disabled = false;
				instrumentedButtonAction("Update Data", (): Promise<void> => {
					return os.put(chains);
				}).then(() => resolve());
			});
		});
	};

	const getDataButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
		const keysNeeded = BATCH_SIZE * GET_PERCENTAGE / 100;
		const keys: number[] = [];
		while (keys.length < keysNeeded) {
			const randNum = Math.ceil(Math.random() * indexId);
			if (keys.indexOf(randNum) === -1) {
				keys.push(randNum);
			}
		}

		return instrumentedButtonAction("Get Data", (): Promise<IReplyChain[]> => {
			return os.getMultiple(keys);
		}).then((chains: void | IReplyChain[]) => {
			console.log(chains);
		});
	};

	(document.getElementById("cleanDataButton") as HTMLButtonElement).addEventListener("click", cleanButtonClickHandler);
	(document.getElementById("insertDataButton") as HTMLButtonElement).addEventListener("click", insertButtonClickHandler);
	(document.getElementById("updateDataButton") as HTMLButtonElement).addEventListener("click", updateButtonClickHandler);
	(document.getElementById("getDataButton") as HTMLButtonElement).addEventListener("click", getDataButtonClickHandler);

	(document.getElementById("scenarioButton") as HTMLButtonElement).addEventListener("click", (e) => {
		logElement.value += `* Scenario Start\n`;
		const t1 = performance.now();
		cleanButtonClickHandler(e).then(() => {
			insertButtonClickHandler(e).then(() => {
				updateButtonClickHandler(e).then(() => {
					getDataButtonClickHandler(e).then(() => {
						insertButtonClickHandler(e).then(() => {
							updateButtonClickHandler(e).then(() => {
								getDataButtonClickHandler(e).then(() => {
									Promise.all([
										updateButtonClickHandler(e),
										updateButtonClickHandler(e),
										getDataButtonClickHandler(e),
										getDataButtonClickHandler(e),
									]).then((parallelResponses) => {
										Promise.all([
											getDataButtonClickHandler(e),
											getDataButtonClickHandler(e),
											getDataButtonClickHandler(e),
											getDataButtonClickHandler(e),
										]).then(() => {
											const t2 = performance.now();
											logElement.value += `* Sceanrio End\n`;
											logElement.value += `** Total Scenario Execution time: ${(t2 - t1).toFixed(2)} msec.\n`;
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
});

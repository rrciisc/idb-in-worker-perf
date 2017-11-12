import { IReplyChain } from "../common/replychain";
import { IStorageWrapper } from "../common/storage-wrapper";
import { ThreadStorage } from "../common/thread-storage";
import { generateMockChains } from "./mock-data";
import { WorkerStorage } from "./worker-storage";

const mainThreadStore = new ThreadStorage("Main");
const workerThreadStore = new WorkerStorage();
let store: IStorageWrapper<IReplyChain> = mainThreadStore;
let indexId = 1;
let BATCH_SIZE = 1000;
const GET_PERCENTAGE = 25;
let scenarioCounter = 0;

const buttonsList = [
	"cleanDataButton",
	"insertDataButton",
	"updateDataButton",
	"getDataButton",
	"basicScenarioButton",
	"scenarioButton",
];
const logElement = document.getElementById("logTA") as HTMLTextAreaElement;

setTimeout(function checkStoreState() {
	if (mainThreadStore.isStoreReady && workerThreadStore.isStoreReady) {
		buttonsList.forEach((buttonId) => {
			const btn = document.getElementById(buttonId) as HTMLButtonElement;
			btn.disabled = false;
		});
		logElement.value += `Storage ready to serve\n`;
	} else {
		setTimeout(checkStoreState, 100);
	}
}, 100);

(document.getElementById("storeSelector") as HTMLSelectElement).addEventListener("change", (e) => {
	const select = document.getElementById("storeSelector") as HTMLSelectElement;
	const value = select.options[select.selectedIndex].value;
	switch (value) {
		case "main":
			store = mainThreadStore;
			logElement.value += `** Now using main-thread storage **\n`;
			break;
		case "worker":
			store = workerThreadStore;
			logElement.value += `** Now using worker-thread storage **\n`;
			break;
	}
});

(document.getElementById("batchSizeSelector") as HTMLSelectElement).addEventListener("change", (e) => {
	const select = document.getElementById("batchSizeSelector") as HTMLSelectElement;
	const value = select.options[select.selectedIndex].value;
	BATCH_SIZE = +value;
	logElement.value += `* Batch Size changed to: ${BATCH_SIZE} *\n`;
});

const toggleButtonsState = () => {
	buttonsList.forEach((buttonId) => {
		const btn = document.getElementById(buttonId) as HTMLButtonElement;
		btn.disabled = !btn.disabled;
	});
};

const instrumentedButtonAction = (action: string,
                                  func: () => Promise<void | IReplyChain[]>)
                                : Promise<void | IReplyChain[]> => {
	toggleButtonsState();
	const tStart = performance.now();
	return func().then((response) => {
		const tEnd = performance.now();
		scenarioCounter += tEnd - tStart;
		logElement.value += `action: '${action}' ; time: ${(tEnd - tStart).toFixed(2)} msec.\n`;
		toggleButtonsState();
		return response;
	});
};

const cleanButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
	(document.getElementById("getDataButton") as HTMLButtonElement).disabled = true;
	return instrumentedButtonAction("Clean Data", (): Promise<void> => {
		indexId = 1;
		return store.clear();
	});
};

const insertButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
	return new Promise<void>((resolve, reject) => {
		generateMockChains(BATCH_SIZE, indexId).then((chains) => {
			indexId += BATCH_SIZE;
			(document.getElementById("getDataButton") as HTMLButtonElement).disabled = false;
			return instrumentedButtonAction("Insert Data", (): Promise<void> => {
				return store.add(chains);
			}).then(() => resolve());
		});
	});
};

const updateButtonClickHandler = (e: MouseEvent): Promise<void | IReplyChain[]> => {
	return new Promise<void>((resolve, reject) => {
		generateMockChains(BATCH_SIZE).then((chains) => {
			(document.getElementById("getDataButton") as HTMLButtonElement).disabled = false;
			instrumentedButtonAction("Update Data", (): Promise<void> => {
				return store.put(chains);
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
		return store.getMultiple(keys);
	});
};

(document.getElementById("cleanDataButton") as HTMLButtonElement).addEventListener("click", cleanButtonClickHandler);
(document.getElementById("insertDataButton") as HTMLButtonElement).addEventListener("click", insertButtonClickHandler);
(document.getElementById("updateDataButton") as HTMLButtonElement).addEventListener("click", updateButtonClickHandler);
(document.getElementById("getDataButton") as HTMLButtonElement).addEventListener("click", getDataButtonClickHandler);

(document.getElementById("basicScenarioButton") as HTMLButtonElement).addEventListener("click", (e) => {
	logElement.value += `\n* Basic Scenario Start\n`;
	const t1 = performance.now();
	scenarioCounter = 0;
	cleanButtonClickHandler(e).then(() => {
		insertButtonClickHandler(e).then(() => {
			updateButtonClickHandler(e).then(() => {
				getDataButtonClickHandler(e).then(() => {
					insertButtonClickHandler(e).then(() => {
						updateButtonClickHandler(e).then(() => {
							getDataButtonClickHandler(e).then(() => {
								const t2 = performance.now();
								logElement.value += `* Basic Sceanrio End TOTAL(${scenarioCounter.toFixed(2)} msec)\n\n`;
								logElement.value += `** Total Scenario Execution time: ${(t2 - t1).toFixed(2)} msec.\n\n`;
							});
						});
					});
				});
			});
		});
	});
});

(document.getElementById("scenarioButton") as HTMLButtonElement).addEventListener("click", (e) => {
	logElement.value += `\n* Full Scenario Start\n`;
	const t1 = performance.now();
	scenarioCounter = 0;
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
										logElement.value += `* Full Sceanrio End TOTAL(${scenarioCounter.toFixed(2)} msec)\n\n`;
										logElement.value += `** Total Scenario Execution time: ${(t2 - t1).toFixed(2)} msec.\n\n`;
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

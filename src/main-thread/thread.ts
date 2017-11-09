import { IReplyChain } from "../common/replychain";
import { generateMockChains } from "./mock-data";

generateMockChains(20).then((chains) => {
	console.log(chains);
});

import { mocker } from "../../node_modules/mocker-data-generator/build/main/index";
import { IReplyChain } from "../common/replychain";

const messageSchema = {
	id: { chance: "guid" },
	content: { faker: "lorem.paragraph" },
	// @ts-ignore: TS2683
	creator: {
		// @ts-ignore: TS7024
		// tslint:disable-next-line:object-literal-shorthand
		function: function() {
			// @ts-ignore: TS2339
			return "8:orgid:" + this.object.id;
		// tslint:disable-next-line:trailing-comma
		}
	},
	email: { faker: "internet.email" },
	parentMessageId: { faker: 'random.number({"min": 12, "max": 17})' },
	// tslint:disable-next-line:trailing-comma
	version: { faker: "date.past" }
};

const replyChainSchema = {
	id: { incrementalId: 1 },
	conversationId: { randexp: /(41|42|43|44|45|46|47|48|49|50):notifications/ },
	parentMessageId: { chance: "guid" },
	latestDeliveryTime: { faker: "date.past" },
	messages: {
		hasMany: "messages",
		max: 10,
		min: 5,
	// tslint:disable-next-line:trailing-comma
	}
};

export function generateMockChains(size: number): Promise<IReplyChain[]> {
	return new Promise<IReplyChain[]>((resolve, reject) => {
		mocker()
		.schema("messages", messageSchema, 100)
		.schema("replychains", replyChainSchema, size)
		.build()
		.then((data) => {
			resolve(data.replychains as IReplyChain[]);
		});
	});
}

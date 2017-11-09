export interface IMessage {
	content: string;
	creator: string;
	email: string;
	id: string;
	parentMessageId: string;
	version: string;
}

export interface IReplyChain {
	id?: number;
	conversationId: string;
	parentMessageId: string;
	latestDeliveryTime: string;
	messages: IMessage[];
}

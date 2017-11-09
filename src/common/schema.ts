export interface IndexSchema {
	name: string;
	keyPath: string | string[];
	unique?: boolean;
}

export interface IStoreSchema {
	name: string;
	primaryKeyPath: string;
	autoIncrement: boolean;
	indexes?: IndexSchema[];
}

export interface ISchemaDefinition {
	version: number;
	stores: {[name: string]: IStoreSchema};
}

export class SchemaDefinition implements ISchemaDefinition {
	public version = 1;
	public stores = {
		replychains: {
			name: "replychains",
			primaryKeyPath: "id",
			autoIncrement: true,
			indexes: [{
				name: "latestdeliverytime",
				keyPath: ["conversationId", "latestDeliveryTime"],
				unique: false,
			}],
		},
	};
}

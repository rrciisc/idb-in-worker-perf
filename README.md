# Performance characteristics of indexedDB access in main-thread vs web-worker

## Project Setup

```cmd
> git init
> yarn init
> yarn add typescript tslint --dev
> yarn add http-server
> cd src\main-thread
> ..\..\node_modules\.bin\tsc --init
> ..\..\node_modules\.bin\tslint --init

> cd src\worker-thread
> ..\..\node_modules\.bin\tsc --init
> ..\..\node_modules\.bin\tslint --init
```

## Build Steps

> yarn run build
> browserify --entry dist\main-thread\thread.js -o dist\main-bundle.js
> yarn run http-server

## Object Store structure

ObjectStore: ReplyChains
	id -> 
	conversationId -> [48:notifications, 41:notifications]
	parentMessageId -> unix-time
	latestDeliveryTime -> unix-time
	messages -> [
		content:
		creator: "8:orgid:guid"
		id: unix-time long random
		parentMessageId: unix-time long random
		version:
	]

index: latestDeliveryTime
	key: [conversationid, startTimeIndex]



### Code structure in WebClient
1. MessageStore.ts (is angular service)
2. ClientDatabase.ts (registers database factory)
3. IndexedDbProvider.ts (ts class)

Probable Execution Plan
-----------------------
1. IndexedDB provider to worker
2. long poll to same worker
3. Northstar -> move everything to worker (except UI/react interaction code)
 [best part: if we think too much code on worker; worker not able to breathe; spawn one more; Use long-test english strategy divide-and-conquer/rule]


 -t [babelify --extensions ['.ts', '.js']]
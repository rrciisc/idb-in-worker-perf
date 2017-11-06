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
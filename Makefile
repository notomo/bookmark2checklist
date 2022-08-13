MAIN := ./src/popup.ts
DENO_ARGS:= --importmap=import_map.json

build:
	deno bundle ${DENO_ARGS} ${MAIN} -- ./dist/popup.js

check:
	deno fmt --check
	deno check ${DENO_ARGS} ${MAIN}
	deno lint
.PHONY: check

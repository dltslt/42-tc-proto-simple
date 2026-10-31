# Prototype basis. The installer is pnpm.
# node_modules, .nuxt, .output, and .data are generated. They are not part of
# the shared copy. make setup installs and, in a run directory, builds the
# SQLite file. It does not start the server. make dev does, on port 3000+N.
# Nuxt serves this slice. A separate backend is not chosen here.
#
# A run directory name ends in -N, where N is a number (for example -06).
# This directory is named template, so make dev refuses to start the server
# here. make setup here only installs. There is no run number, so no database.

.PHONY: setup dev

setup:
	pnpm install
	node ../scripts/prepare-db.mjs

dev:
	@suffix=$$(basename "$$(pwd)" | sed -n 's/.*-\([0-9][0-9]*\)$$/\1/p'); \
	if [ -z "$$suffix" ]; then \
		echo "Copy this template to a directory whose name ends in -N, where N is a number (for example -7, -001, or -123). The server listens on port 3000+N." >&2; \
		exit 1; \
	fi; \
	port=$$((3000 + 10#$$suffix)); \
	if [ "$$port" -lt 1 ] || [ "$$port" -gt 65535 ]; then \
		echo "Port $$port is outside 1-65535. Use a smaller suffix." >&2; \
		exit 1; \
	fi; \
	pnpm exec nuxt dev --port "$$port"

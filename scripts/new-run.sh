#!/usr/bin/env bash
# Creates one run directory: copies template/ to run-NN/, then runs make setup
# there. node_modules is not copied. make setup installs the modules and builds
# the SQLite file. It does not start the server.
# The copy is the Nuxt app only. Briefs, AGENTS.md, the spec, and the seed
# script stay at the repository root. This does not create a git repository.
#
# Usage: ./scripts/new-run.sh <NN>
# Example: ./scripts/new-run.sh 06
# The dev server port is 3000+NN. The server is not running.
# Start it with: cd run-NN && make dev
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
num="${1:?run number, for example 06}"
case "$num" in
  ''|*[!0-9]*) echo "Run number must be digits, for example 06." >&2; exit 1 ;;
esac
if [ "${#num}" -ne 2 ]; then
  echo "The run number must always contain two digits. A single digit needs a leading zero: 01, not 1." >&2
  exit 1
fi
run="$root/run-$num"

[ -e "$run" ] && { echo "Already exists: $run" >&2; exit 1; }

rsync -a --exclude node_modules --exclude .nuxt --exclude .output --exclude .data \
  "$root/template/" "$run/"
make -C "$run" setup
echo ">>> run-$num: port $((3000 + 10#$num))"
echo ">>> The server is not running."
echo ">>> Start it with: make -C run-$num dev"

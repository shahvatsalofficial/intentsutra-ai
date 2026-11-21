#!/usr/bin/env sh
set -eu
node "$(dirname "$0")/../packages/cli/index.mjs" doctor
printf 'Use node packages/cli/index.mjs install-ide --target <path> --host <name> for project-local installation.\n'

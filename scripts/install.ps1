$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot '../packages/cli/index.mjs') doctor
Write-Host 'Use node packages/cli/index.mjs install-ide --target <path> --host <name> for project-local installation.'

Set-Location -LiteralPath $PSScriptRoot
npm.cmd run dev:h5 -- --host 0.0.0.0 *> (Join-Path $PSScriptRoot "dev-server.log")

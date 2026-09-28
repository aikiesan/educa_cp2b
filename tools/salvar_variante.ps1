param([int]$Numero, [string]$Origem)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot 'entrada/imagens/variantes_metaninho_cp2b/manifesto.json'
$variantList = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
$entry = $variantList | Where-Object { $_.number -eq $Numero }
if (-not $entry) { throw 'Variante não encontrada' }
$destination = Join-Path $projectRoot $entry.path
if (Test-Path -LiteralPath $destination) { throw "Destino já existe: $destination" }
Copy-Item -LiteralPath $Origem -Destination $destination
$entry.status = 'generated'
$entry | Add-Member -NotePropertyName source -NotePropertyValue $Origem -Force
$variantList | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Write-Output "Saved variant $Numero"

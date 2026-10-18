param(
    [string]$BaseUrl = "http://127.0.0.1:20128"
)

$ErrorActionPreference = "Stop"

function Invoke-ChatProbe([string]$Model) {
    $json = @{
        model = $Model
        messages = @(
            @{ role = "user"; content = "Reply only with RHB_OK" }
        )
        max_tokens = 24
    } | ConvertTo-Json -Depth 8 -Compress

    try {
        $params = @{
            Method = "Post"
            Uri = "$BaseUrl/v1/chat/completions"
            ContentType = "application/json; charset=utf-8"
            Body = [Text.Encoding]::UTF8.GetBytes($json)
            TimeoutSec = 60
            UseBasicParsing = $true
        }
        $r = Invoke-WebRequest @params
        return [pscustomobject]@{
            Model = $Model
            Http = [int]$r.StatusCode
            Body = [string]$r.Content
        }
    }
    catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        $code = 0
        $body = ""
        if ($resp) {
            try { $code = [int]$resp.StatusCode } catch {}
            try {
                $reader = New-Object IO.StreamReader($resp.GetResponseStream())
                try { $body = $reader.ReadToEnd() } finally { $reader.Dispose() }
            } catch {}
        }
        if (-not $body) { $body = $_.Exception.Message }

        return [pscustomobject]@{
            Model = $Model
            Http = $code
            Body = $body
        }
    }
    catch {
        return [pscustomobject]@{
            Model = $Model
            Http = 0
            Body = $_.Exception.Message
        }
    }
}

Write-Host "=== RHB STUDIO - OmniRoute model-path matrix ===" -ForegroundColor Cyan

$health = Invoke-RestMethod "$BaseUrl/api/monitoring/health" -TimeoutSec 8
Write-Host "Health: $($health.status)"
if ($health.status -ne "healthy") { throw "OmniRoute is not healthy." }

$models = @(
    "ddgw/gpt-5.6-luna",
    "auto/best-free",
    "cxa/gpt-5.6-sol",
    "cx/gpt-5.6-sol",
    "auto/best-coding"
)

$results = @()
foreach ($model in $models) {
    Write-Host ""
    Write-Host "Testing: $model" -ForegroundColor Cyan
    $r = Invoke-ChatProbe $model
    $results += $r

    $display = [string]$r.Body
    if ($display.Length -gt 2200) { $display = $display.Substring(0,2200) + "...<truncated>" }

    Write-Host "HTTP: $($r.Http)"
    if ($display) { Write-Host $display }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
$results | Select-Object Model,Http,@{N="Result";E={
    $b = [string]$_.Body
    if ($b -match "RHB_OK") { "OK" }
    elseif ($b -match "401|Unauthorized|unauthorized|authentication|auth") { "AUTH" }
    elseif ($b -match "403|Forbidden") { "FORBIDDEN" }
    elseif ($b -match "404|not found") { "NOT_FOUND" }
    elseif ($_.Http -ge 200 -and $_.Http -lt 300) { "OK" }
    else { "ERROR" }
}} | Format-Table -AutoSize

$freeOk = $results | Where-Object {
    $_.Model -in @("ddgw/gpt-5.6-luna","auto/best-free") -and
    $_.Http -ge 200 -and $_.Http -lt 300
} | Select-Object -First 1

$cxaOk = $results | Where-Object {
    $_.Model -eq "cxa/gpt-5.6-sol" -and
    $_.Http -ge 200 -and $_.Http -lt 300
} | Select-Object -First 1

Write-Host ""
if ($cxaOk) {
    Write-Host "CLASSIFICATION: CODEX_APP_SERVER_OK" -ForegroundColor Green
    Write-Host "Preferred OpenDots model can be cxa/gpt-5.6-sol."
    exit 0
}

if ($freeOk) {
    Write-Host "CLASSIFICATION: OMNIROUTE_CORE_OK_CODEX_AUTH_BROKEN" -ForegroundColor Yellow
    Write-Host "Base inference works. Repair/sign in Codex App-Server next."
    Write-Host "Temporary validation model: $($freeOk.Model)"
    exit 20
}

Write-Host "CLASSIFICATION: GENERAL_INFERENCE_PATH_BROKEN" -ForegroundColor Red
Write-Host "No known no-auth/free path produced a successful chat response."
exit 21

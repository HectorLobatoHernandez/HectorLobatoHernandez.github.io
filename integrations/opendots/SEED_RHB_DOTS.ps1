param(
    [string]$ApiBase = "http://127.0.0.1:4310/api",
    [string]$OwnerToken = "",
    [switch]$ForceUpdate
)

$ErrorActionPreference = "Stop"

$headers = @{}
if ($OwnerToken) { $headers.Authorization = "Bearer $OwnerToken" }

function Invoke-OD([string]$Method, [string]$Path, $Body = $null) {
    $params = @{
        Method = $Method
        Uri = "$ApiBase$Path"
        Headers = $headers
        TimeoutSec = 15
    }
    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 12)
    }
    Invoke-RestMethod @params
}

$workspace = Invoke-OD "GET" "/workspace"

$spaceSpecs = @(
    @{ Name = "RHB STUDIO"; Description = "Dirección técnica, negocio, proyectos y coordinación general de RHB STUDIO." },
    @{ Name = "GAZA Operations"; Description = "Operaciones, fábrica, logística, rutas, digital twin y evolución de GAZA." },
    @{ Name = "Engineering & CAD"; Description = "Survey, Photo2CAD, CAD Master, fabricación, planos y documentación técnica." },
    @{ Name = "Research & Strategy"; Description = "Investigación técnica, normativa, mercado, software, IA y estrategia." },
    @{ Name = "System Operations"; Description = "OmniRoute, OpenClaw, NEXO CORE, servicios, agentes, automatización y observabilidad." }
)

$spaces = @{}
foreach ($spec in $spaceSpecs) {
    $existing = $workspace.spaces | Where-Object { $_.name -eq $spec.Name } | Select-Object -First 1
    if (-not $existing) {
        $existing = Invoke-OD "POST" "/spaces" $spec
        Write-Host "Created Space: $($spec.Name)"
    } else {
        Write-Host "Space exists: $($spec.Name)"
    }
    $spaces[$spec.Name] = $existing.id
}

# Refresh after Space creation.
$workspace = Invoke-OD "GET" "/workspace"

$dotSpecs = @(
    @{
        Name = "RHB CORE"
        DefaultSpace = "RHB STUDIO"
        Spaces = @("RHB STUDIO","GAZA Operations","Engineering & CAD","Research & Strategy","System Operations")
        Research = $true
        Memory = $true
        Instructions = "Act as the technical and operational orchestrator for RHB STUDIO. Break complex work into subsystems, verify assumptions, distinguish confirmed data from estimates, and prioritize maintainable architecture. Coordinate engineering, business, automation, CAD, GAZA operations and system integration. Use the authorized Spaces as the source of project context. Never treat temporary CopilotKit thread history as the sole system of record; preserve durable project conclusions in RHB/NEXO-compatible artifacts."
    },
    @{
        Name = "GAZA OPS"
        DefaultSpace = "GAZA Operations"
        Spaces = @("GAZA Operations","Research & Strategy","System Operations")
        Research = $true
        Memory = $true
        Instructions = "Specialist for GAZA operations. Work on factory and campus mapping, realistic road and truck flows, logistics, common routes, departments, operational data, software integration, digital-twin design and real-time observability. Prefer verified geographic and technical data. Clearly label simulated, inferred and live information. Coordinate with System Operations for external services and with RHB CORE for architecture decisions."
    },
    @{
        Name = "CAD ENGINEER"
        DefaultSpace = "Engineering & CAD"
        Spaces = @("Engineering & CAD","RHB STUDIO","GAZA Operations")
        Research = $false
        Memory = $true
        Instructions = "Engineering/CAD specialist for RHB STUDIO. Focus on Photo2CAD, survey normalization, dimensional control, fabrication drawings, BOMs, tolerances, coordinate systems, revision control and technical documentation. Preserve the canonical RHB STUDIO V6 workflow: Photo2CAD -> Survey Master -> CAD Master -> CAD Agent. Do not invent dimensions; mark missing measurements and confidence."
    },
    @{
        Name = "SYSTEMS OPS"
        DefaultSpace = "System Operations"
        Spaces = @("System Operations","RHB STUDIO","GAZA Operations")
        Research = $true
        Memory = $true
        Instructions = "Systems integration and operations specialist. Maintain the RHB service topology: OmniRoute model router on 127.0.0.1:20128, OpenClaw on 127.0.0.1:18789, and NEXO CORE on 127.0.0.1:20800 as the read-only integration layer. Diagnose ports, APIs, logs, model routing, authentication, startup scripts and agent interoperability. Prefer reversible changes, health checks and explicit rollback paths."
    },
    @{
        Name = "RESEARCH"
        DefaultSpace = "Research & Strategy"
        Spaces = @("Research & Strategy","RHB STUDIO","GAZA Operations","Engineering & CAD","System Operations")
        Research = $true
        Memory = $true
        Instructions = "Research specialist for technical, product, software, regulatory and market questions. Prefer official documentation, manufacturers, standards and primary sources. Record dates and versions for volatile information. Separate confirmed facts, estimates and hypotheses, and return evidence suitable for engineering or business decisions."
    }
)

foreach ($spec in $dotSpecs) {
    $existing = $workspace.dots | Where-Object { $_.name -eq $spec.Name } | Select-Object -First 1
    $spaceIds = @($spec.Spaces | ForEach-Object { $spaces[$_] })
    $payload = @{
        name = $spec.Name
        instructions = $spec.Instructions
        researchAllowed = [bool]$spec.Research
        memoryAllowed = [bool]$spec.Memory
        spaceId = $spaces[$spec.DefaultSpace]
        spaceIds = $spaceIds
        skillDeliveryEnabled = $false
    }

    if (-not $existing) {
        Invoke-OD "POST" "/dots" $payload | Out-Null
        Write-Host "Created Dot: $($spec.Name)"
    } elseif ($ForceUpdate) {
        $update = @{
            name = $spec.Name
            instructions = $spec.Instructions
            researchAllowed = [bool]$spec.Research
            memoryAllowed = [bool]$spec.Memory
            spaceIds = $spaceIds
            skillDeliveryEnabled = $false
        }
        Invoke-OD "PUT" ("/dots/" + $existing.id) $update | Out-Null
        Write-Host "Updated Dot: $($spec.Name)"
    } else {
        Write-Host "Dot exists: $($spec.Name)"
    }
}

$state = Invoke-OD "GET" "/state"
$memorySeeds = @(
    "RHB STUDIO canonical local services: OmniRoute 127.0.0.1:20128; OpenClaw 127.0.0.1:18789; NEXO CORE 127.0.0.1:20800. NEXO CORE is currently the read-only integration layer.",
    "RHB STUDIO canonical CAD workflow: Photo2CAD -> Survey Master -> CAD Master -> CAD Agent.",
    "OpenDots is an interface/agent workspace layer. Durable RHB/GAZA project state must not depend only on CopilotKit Thread retention."
)

foreach ($m in $memorySeeds) {
    if (-not ($state.memories | Where-Object { $_.text -eq $m })) {
        Invoke-OD "POST" "/memories" @{ text = $m } | Out-Null
        Write-Host "Seeded memory."
    }
}

Write-Host ""
Write-Host "RHB/GAZA OpenDots seed complete."
Write-Host "Open: http://127.0.0.1:5173"

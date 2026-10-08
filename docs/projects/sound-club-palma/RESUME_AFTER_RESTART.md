# SOUND CLUB — Resume after restart

This file is the human-readable restart checkpoint for the current SOUND CLUB work.

## Current status

- Registered master: `CLUB_DEL_MAR_12_02_2026_3.skp`
- Master SHA-256: `ae95307c724ec36a3887c3660f4e53e6dbe31ffa1b28701d9888c81217685665`
- Candidate GLB successfully created locally.
- Candidate GLB SHA-256: `0fc257b69448ed23739dceada7798113cc4dcdc457ec86efd8661902b9604135`
- Candidate exceeds 95 MiB.
- Candidate remains local / gitignored.
- Public promotion has NOT been performed.
- Next operation is QA, not reconversion.

## Resume commands

```powershell
cd "$env:USERPROFILE\Desktop\HectorLobatoHernandez.github.io"
git pull origin main
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

Get-Content ".\assets\models\sound-club\_candidate\venue-master.qa.json" -Raw
```

Then:

```powershell
python -m http.server 8000
```

Browser:

```text
http://localhost:8000/projects/sound-club-palma.html?candidate=1
```

Do **not** reconvert or promote until the QA report and visual candidate have been reviewed.

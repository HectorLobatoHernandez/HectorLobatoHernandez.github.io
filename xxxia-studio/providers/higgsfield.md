# Provider adapter — Higgsfield

## Role in XXXIA
Optional motion/image provider. XXXIA STUDIO owns the production brief, storyboard, prompt and archive contract; the provider can be replaced without changing project structure.

## Free-only rule
When the user requests no-cost generation:
- use only an explicitly confirmed free entitlement;
- pass the provider's free-generation flag;
- never fall back to paid credits;
- store `creditsSpent: 0`;
- if the free job fails, record the failure instead of auto-retrying as paid.

## Job record
Store:
- provider job id
- model
- input references
- resolution / duration
- status
- result URL when returned
- archive status
- classification

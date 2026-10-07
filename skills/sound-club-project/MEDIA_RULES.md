# Sound Club Media Rules

## Use in public pages

Every media item requires:

- logical id;
- title;
- kind;
- classification;
- source / provenance;
- public-safe flag;
- archive status.

## Heavy media

MP4 and large generated renders may be stored through a connected media provider. GitHub stores the metadata and UI contract.

The public page must never depend on an expiring presigned upload URL. Only use the confirmed permanent media URL returned after upload/confirmation.

## Video

- Use controls.
- Do not autoplay audio.
- Prefer preload="metadata".
- Provide a textual caption that states whether the footage is documented reference or generated motion.
- Keep the original long source out of Git when a connected media store is available.

## Diagrams

SVG diagrams are preferred because they are:
- versionable;
- searchable;
- accessible;
- scriptable from React;
- suitable for layer highlighting.

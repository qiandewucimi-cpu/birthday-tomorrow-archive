# Productization workspace

This repository is an isolated, private-first product workspace. It contains no source material from the preserved personal site.

## Protection rules

- All reusable engine, schema, instance, and example work happens in this repository.
- Personal originals and backups remain outside this repository and are never addressed by product scripts.
- Only fictional demonstrations may be stored under `instances/`.
- Real project JSON and all related media must stay outside the repository.
- External JSON is selected temporarily with `MEMORY_INSTANCE_FILE`; image-bearing instances also require an external `MEMORY_INSTANCE_ASSETS` directory.
- External projects may only build with `MEMORY_PRODUCT_MODE=recipient`.
- Recipient mode removes the authoring surface, but its static passphrase is not authentication.
- No change is copied into any preserved personal project automatically. Any future backport requires an explicit review and user confirmation.

## Completion gate

- Instances with different people and chapter counts build without editing reusable React components.
- Each built-in demo copies only its own declared asset directory.
- Distribution checks prove that no foreign instance marker or asset directory is present.
- Temporary generated source is removed automatically; a private `dist/` is cleaned after delivery.

## Current commands

- `pnpm validate:instances` validates every built-in fictional demonstration.
- `pnpm test` runs schema and isolation tests.
- `pnpm privacy:check` scans unignored working files, media metadata, and all reachable Git history.
- `pnpm build` builds the default `demo-afterglow` instance.
- Set `MEMORY_INSTANCE=demo-starlight` or `MEMORY_INSTANCE=demo-lantern` to build another fictional demonstration.
- `pnpm build` runs distribution isolation checks before it succeeds.
- For an external private build, point `MEMORY_INSTANCE_FILE` and, when images are declared, `MEMORY_INSTANCE_ASSETS` to paths outside the repository and set `MEMORY_PRODUCT_MODE=recipient`.

See `README.md`, `docs/INSTANCE_FORMAT.md`, `docs/PRIVACY_BOUNDARY.md`, and `docs/RELEASE_CHECKLIST.md` before adding or delivering an instance.

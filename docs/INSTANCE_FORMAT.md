# Instance format

Each built-in fictional demonstration lives at `instances/<instance-id>/project.json`. Its optional isolated assets live below `instances/<instance-id>/public/` and are copied only when that instance is selected.

The build selects `demo-afterglow` by default. Set `MEMORY_INSTANCE` to `demo-starlight` or `demo-lantern` to build another built-in demonstration.

## Required data

- project identity, description, version, and unique storage namespace;
- sender and recipient display names;
- access prompt, placeholder, and a client-side demonstration passphrase;
- opening copy with exactly two title lines;
- 1 to 30 sequential chapters;
- finale copy.

The project may also declare a `socialImage`. The opening, each chapter, and the finale may declare an `image`.

Image values must be root-relative local paths such as `/demo-afterglow/cover.webp`. Remote URLs, query strings, traversal, backslashes, and unsupported file extensions are rejected. Every declared image must exist inside the selected isolated asset directory, and that directory may not contain undeclared extra files or symbolic links.

## Product modes

- `demo` is the default for built-in fictional instances and includes the product link to `/studio`.
- `studio` is for local authoring and preview.
- `recipient` is required for an external instance and does not provide the studio interface.

Recipient mode is a packaging boundary, not authentication. The passphrase is present in browser code and can be recovered by anyone who receives the static files.

## External instance and media

Your own story must keep both its JSON and every related asset outside this repository:

```powershell
$env:MEMORY_INSTANCE_FILE = "D:\my-story\project.json"
$env:MEMORY_INSTANCE_ASSETS = "D:\my-story\public"
$env:MEMORY_PRODUCT_MODE = "recipient"
pnpm build
```

If the JSON declares `/story/cover.webp`, the external asset root must contain `story/cover.webp`. Omit `MEMORY_INSTANCE_ASSETS` only when the instance declares no images. The build rejects repository-internal paths and symbolic-link asset roots.

Generated files under `src/generated/` are removed automatically after builds. The ignored `dist/` output is not encrypted; after delivery is verified, preview and clean it with the explicit commands in `docs/PRIVACY_BOUNDARY.md`.

Run `pnpm validate:instances` before committing a fictional demonstration. Every build validates the selected instance automatically.

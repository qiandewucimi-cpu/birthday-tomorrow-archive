# Privacy boundary

## Repository-safe data

- fully fictional demonstrations;
- reusable UI, schema, validation, test, and build code;
- generic visual or sound assets with documented rights;
- empty templates and field documentation.

## Data that must never enter the repository

- real names, relationship details, dates, addresses, routes, statistics, private answers, letters, or chat exports;
- customer photos, video, voice recordings, music, fonts, or source documents;
- access secrets, unpublished or published private URLs, authentication cookies, and service credentials;
- screenshots or logs that reveal customer data, account notifications, or local user paths.

These restrictions apply to commits, branches, tags, Issue and PR bodies, review comments, CI logs, caches, Actions artifacts, Releases, Wikis, and copied example data—not only to the current working tree.

## External build boundary

Real project JSON must be selected with `MEMORY_INSTANCE_FILE`. If it declares images, its isolated external media root must be selected with `MEMORY_INSTANCE_ASSETS`. Both paths must resolve outside this repository. External projects may only use `MEMORY_PRODUCT_MODE=recipient`.

The asset directory must mirror the root-relative paths declared by the JSON. The build rejects missing assets, undeclared extra files, symbolic links, and files that resolve outside the isolated root.

Recipient mode removes the authoring interface from the intended delivery surface, but it does not provide authentication or encryption. The static passphrase is readable from the delivered browser code. Real hosted content requires service-side access control.

## Local data and cleanup

The studio stores time-limited drafts in browser `localStorage`. Build output is written to `dist/` and remains unencrypted. Temporary TypeScript under `src/generated/` is removed automatically when the build or development runner exits.

After a private delivery, first preview the ignored targets:

```powershell
git clean -ndX -- dist
```

After confirming the paths, remove only those explicit ignored targets:

```powershell
git clean -fdX -- dist
```

Also clear the studio's browser site data on shared devices and remove temporary hosting artifacts according to the provider's retention controls.

## Release gate

Before any deployment:

- run `pnpm privacy:check`;
- verify the selected build and its declared assets;
- require the distribution isolation check embedded in `pnpm build` to pass;
- confirm that no other instance is present in the output;
- verify consent, media rights, retention, deletion, and access-control requirements;
- keep public deployments limited to fictional demos until server-side authorization exists.

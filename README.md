# astro-nice-asset-filenames

[![npm](https://img.shields.io/npm/v/astro-nice-asset-filenames.svg)](https://www.npmjs.com/package/astro-nice-asset-filenames)

Astro integration for short, readable asset URLs.

**Before:**

By default, Astro's static build emits client-script chunks named after the synthetic module ID, with all the URL boilerplate replaced by underscores:

```
_assets/ThemeToggle.astro_astro_type_script_index_0_lang.BhEhlh7m.js
_assets/BaseLayout.Pt3ADYuj.css
```

**After:**

This integration shortens the script-block boilerplate and converts `PascalCase` to `snake_case` (or `kebab-case`):

```
_assets/theme_toggle.BhEhlh7m.js
_assets/base_layout.Pt3ADYuj.css
```

## Contents

- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [What it does](#what-it-does)
- [Compatibility](#compatibility)
- [Development](#development)
- [License](#license)

## Install

```sh
npm install astro-nice-asset-filenames
# or: bun add, pnpm add, yarn add
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import niceAssetFilenames from "astro-nice-asset-filenames";

export default defineConfig({
  integrations: [
    niceAssetFilenames()
  ],
});
```

## Options

| Option      | Type      | Default | Description                                                                                            |
| ----------- | --------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `enabled`   | `boolean` | `true`  | When `false`, the integration is a no-op. Handy for env-flag toggling while debugging.                 |
| `separator` | `string`  | `"_"`   | Separator passed to [`decamelize`](https://github.com/sindresorhus/decamelize). Use `"-"` for kebab.   |

```js
niceAssetFilenames({
  enabled: process.env.NICE_FILENAMES !== "0",
  separator: "-",
});
```

## What it does

Three transforms, layered:

1. **Strips Astro's script-block URL boilerplate.** `<File>.astro?astro&type=script&index=N&lang.ts` becomes just `<File>`—no more `_astro_type_script_index_0_lang` in the filename.
2. **Snake_cases (or kebab-cases) the basename.** `ThemeToggle` → `theme_toggle` via [`decamelize`](https://github.com/sindresorhus/decamelize), which handles acronym-heavy names correctly: `OAuth2Client` → `o_auth_2_client`, `HTMLParser` → `html_parser`.
3. **Preserves the script-block index when it matters.** A `.astro` file with multiple `<script>` blocks emits separate chunks. `index=0` is dropped (the common case); `index >= 1` is appended as `-N` so the filenames remain distinguishable: `foo.HASH.js`, `foo-1.HASH.js`, `foo-2.HASH.js`.

It also flips `cssCodeSplit: true` (Vite's default) so per-component CSS actually emerges as named chunks instead of a single `style.HASH.css` bundle, otherwise the rename has nothing to rename.

## Compatibility

- Astro 6+ (the integration relies on Vite's Environment API, which Astro adopted in 6.0)
- Node ≥ 18

Tested against static builds on rather simple websites; be wary.

Server-output (SSR) and prerender-only builds should work the same way; if you run into edge cases, you can open an issue.

## Development

```sh
npm test
```

Tests run against `src/` directly via Node's built-in test runner.

## License

MIT.

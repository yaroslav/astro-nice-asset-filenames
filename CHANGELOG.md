## [Unreleased]

### Fixed

- Shared and lazy-loaded client JS chunks are now renamed too ([#2]). Only
  entry chunks were renamed before, so a component that is both an island
  and imported by another island, or one loaded via `React.lazy()`/dynamic
  `import()`, kept Astro's default name (`_astro/Clickable.HASH.js` instead
  of `_astro/clickable.HASH.js`). Verified against Astro 6.4, 7.2 and 7.3.

[#2]: https://github.com/yaroslav/astro-nice-asset-filenames/issues/2

## [0.2.0] - 2026-08-14

### Fixed

- Astro 7 support. Astro 7 names SSR-emitted page CSS after the page module,
  which embeds the internal `@_@` extension marker (`index.astro` →
  `index@_@astro.css`); the marker leaked into emitted filenames
  (`_astro/index@_@astro.HASH.css`). It is now stripped before decamelizing.

### Changed

- `astro` peer dependency widened from `^6` to `>=6`, fixing `npm install`
  ERESOLVE failures alongside Astro 7. Verified against Astro 6.x and 7.2.
- Known limitation on Astro 7: CSS emitted purely by the client environment
  (rather than the prerender/SSR pass) may fall back to Astro's default
  naming, because Astro 7's client-environment `assetFileNames` default takes
  precedence over the integration's top-level override.

## [0.1.5] - 2026-05-09

No user-facing changes.

## [0.1.4] - 2026-05-08

### Changed

- Minimum Node version bumped to 22.12.0 to match Astro 6's own minimum.

## [0.1.3] - 2026-05-07

No user-facing changes.

## [0.1.2] - 2026-05-07

- Removed explicit `vite.build.cssCodeSplit = true` override (initially a bug).

## [0.1.1] - 2026-05-07

No user-facing changes.

## [0.1.0] - 2026-05-07

Initial public release.

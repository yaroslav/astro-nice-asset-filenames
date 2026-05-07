import type { AstroIntegration } from "astro";

export interface NiceAssetFilenamesOptions {
  /**
   * When `false`, the integration is a no-op. Useful for toggling the
   * rename behind an env flag while debugging or comparing output.
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Separator passed to [`decamelize`](https://github.com/sindresorhus/decamelize).
   * Set to `"-"` for kebab-case output.
   *
   * @default "_"
   */
  separator?: string;
}

/**
 * Compute the human-readable basename for a JS entry chunk. Exported for
 * unit tests.
 */
export function entryName(
  chunkInfo: { facadeModuleId?: string | null; name?: string },
  options?: { separator?: string },
): string;

/**
 * Compute the human-readable basename for a CSS asset chunk. Returns
 * `null` for non-CSS assets so the caller can fall through to the default
 * Rollup template.
 */
export function assetName(
  assetInfo: { names?: string[] },
  options?: { separator?: string },
): string | null;

export default function niceAssetFilenames(
  options?: NiceAssetFilenamesOptions,
): AstroIntegration;

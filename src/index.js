import decamelize from "decamelize";

const SCRIPT_BLOCK_RE = /\/([^/]+)\.astro\?astro&type=script(?:&index=(\d+))?/;
const UNSAFE_CHUNK_CHAR_RE = /[^\w.\-/]/g;

/**
 * Compute the human-readable basename for a JS entry chunk. Exported for
 * tests; integrations should consume the default export.
 */
export function entryName(chunkInfo, { separator = "_" } = {}) {
  const match = chunkInfo.facadeModuleId?.match(SCRIPT_BLOCK_RE);
  if (match) {
    const [, name, index] = match;
    const suffix = index && index !== "0" ? `-${index}` : "";
    return `${decamelize(name, { separator })}${suffix}`;
  }
  // Non-script chunk: sanitize URL boilerplate the way Astro's cleanChunkName
  // does, then decamelize. Falls back to "" when no name is available.
  const safe = (chunkInfo.name ?? "").replace(UNSAFE_CHUNK_CHAR_RE, "_");
  return decamelize(safe, { separator });
}

/**
 * Compute the human-readable basename for a CSS asset chunk. Returns null
 * for non-CSS assets to signal that the caller should fall through to the
 * default Rollup template.
 */
export function assetName(assetInfo, { separator = "_" } = {}) {
  const name = assetInfo.names?.[0] ?? "";
  if (!name.endsWith(".css")) return null;
  return decamelize(name.slice(0, -4), { separator });
}

/**
 * @param {{ enabled?: boolean; separator?: string }} [options]
 */
export default function niceAssetFilenames(options = {}) {
  const { enabled = true, separator = "_" } = options;

  return {
    name: "astro-nice-asset-filenames",
    hooks: {
      "astro:config:setup": ({ config, updateConfig }) => {
        if (!enabled) return;
        const dir = config.build.assets;

        updateConfig({
          vite: {
            build: {
              // Per-component CSS chunks need to exist before they can be
              // renamed; the alternative is a single style.HASH.css bundle.
              cssCodeSplit: true,
              // Top-level slot: Astro's prerender pass emits CSS through
              // here via ssrEmitAssets, and the user-config spread happens
              // before the defaults are frozen, so this override wins.
              rollupOptions: {
                output: {
                  assetFileNames: (info) => {
                    const transformed = assetName(info, { separator });
                    if (transformed === null) {
                      return `${dir}/[name].[hash][extname]`;
                    }
                    return `${dir}/${transformed}.[hash].css`;
                  },
                },
              },
            },
            // Client-environment slot: Astro hard-sets entryFileNames at
            // the top level after the user spread, so the override has to
            // live here (where the spread happens last).
            environments: {
              client: {
                build: {
                  rollupOptions: {
                    output: {
                      entryFileNames: (chunk) =>
                        `${dir}/${entryName(chunk, { separator })}.[hash].js`,
                    },
                  },
                },
              },
            },
          },
        });
      },
    },
  };
}

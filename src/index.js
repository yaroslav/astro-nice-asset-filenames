import decamelize from "decamelize";

const SCRIPT_BLOCK_RE = /\/([^/]+)\.astro\?astro&type=script(?:&index=(\d+))?/;
const UNSAFE_CHUNK_CHAR_RE = /[^\w.\-/]/g;
// Astro 7 names SSR-emitted page CSS after the page module, embedding the
// route file's extension behind this marker (ASTRO_PAGE_EXTENSION_POST_PATTERN,
// not publicly exported): index.astro -> "index@_@astro.css". Astro's default
// assetFileNames splits on it; so must we.
const PAGE_EXTENSION_MARKER = "@_@";

/**
 * Compute the human-readable basename for a client JS chunk (entry, shared,
 * or lazy-loaded). Exported for tests; integrations should consume the
 * default export.
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
  const base = name.slice(0, -4).split(PAGE_EXTENSION_MARKER)[0];
  return decamelize(base, { separator });
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
        const jsFileName = (chunk) =>
          `${dir}/${entryName(chunk, { separator })}.[hash].js`;
        const assetFileName = (info) => {
          const transformed = assetName(info, { separator });
          if (transformed === null) {
            return `${dir}/[name].[hash][extname]`;
          }
          return `${dir}/${transformed}.[hash].css`;
        };

        updateConfig({
          vite: {
            build: {
              // Top-level slot: Astro's prerender pass emits CSS through
              // here via ssrEmitAssets, and the user-config spread happens
              // before the defaults are frozen, so this override wins.
              rollupOptions: {
                output: {
                  assetFileNames: assetFileName,
                },
              },
            },
            // Client-environment slot: Astro hard-sets entryFileNames at
            // the top level after the user spread, so the override has to
            // live here (where the spread happens last). chunkFileNames
            // covers shared and lazy-loaded chunks (e.g. a component that
            // is both an island and imported by another island). It must
            // not move to the top level, which names server chunks.
            // Astro also sets a client-env assetFileNames that beats the
            // top-level one, so CSS only the client build sees (a
            // client:only component's styles) needs the override here too.
            environments: {
              client: {
                build: {
                  rollupOptions: {
                    output: {
                      entryFileNames: jsFileName,
                      chunkFileNames: jsFileName,
                      assetFileNames: assetFileName,
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

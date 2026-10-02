import { test } from "node:test";
import assert from "node:assert/strict";
import niceAssetFilenames from "../src/index.js";

// Run the integration's config hook and return the Rollup output options it
// sets for Astro's client environment.
function clientOutput(options) {
  let vite;
  niceAssetFilenames(options).hooks["astro:config:setup"]({
    config: { build: { assets: "_astro" } },
    updateConfig: (cfg) => {
      vite = cfg.vite;
    },
  });
  return vite.environments.client.build.rollupOptions.output;
}

// chunkInfo shapes captured from a real Astro 7.3 build with React islands.
const chunkCases = [
  {
    what: "shared chunk (component imported by an island and also hydrated on its own)",
    info: { name: "Clickable", isEntry: false, isDynamicEntry: false, facadeModuleId: null },
    want: "_astro/clickable.[hash].js",
  },
  {
    what: "lazy-loaded chunk (React.lazy / dynamic import)",
    info: {
      name: "LazyChart",
      isEntry: false,
      isDynamicEntry: true,
      facadeModuleId: "/x/src/components/LazyChart.jsx",
    },
    want: "_astro/lazy_chart.[hash].js",
  },
  {
    what: "vendor chunk keeps its already-clean name",
    info: { name: "jsx-runtime", isEntry: false, isDynamicEntry: false, facadeModuleId: null },
    want: "_astro/jsx-runtime.[hash].js",
  },
];

for (const { what, info, want } of chunkCases) {
  test(`client chunkFileNames: ${what}`, () => {
    assert.equal(clientOutput().chunkFileNames?.(info), want);
  });
}

test("client chunkFileNames: respects custom separator", () => {
  const info = { name: "LazyChart", isEntry: false, isDynamicEntry: true, facadeModuleId: "/x/src/components/LazyChart.jsx" };
  assert.equal(
    clientOutput({ separator: "-" }).chunkFileNames?.(info),
    "_astro/lazy-chart.[hash].js",
  );
});

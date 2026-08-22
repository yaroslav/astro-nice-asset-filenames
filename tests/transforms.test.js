import { test } from "node:test";
import assert from "node:assert/strict";
import niceAssetFilenames, { entryName, assetName } from "../src/index.js";

test("entryName: single-script .astro chunk → snake_case basename", () => {
  const info = {
    facadeModuleId: "/x/ThemeToggle.astro?astro&type=script&index=0&lang.ts",
    name: "ThemeToggle",
  };
  assert.equal(entryName(info), "theme_toggle");
});

test("entryName: index >= 1 gets a -N suffix", () => {
  const info = {
    facadeModuleId: "/x/Foo.astro?astro&type=script&index=2&lang.ts",
    name: "Foo",
  };
  assert.equal(entryName(info), "foo-2");
});

test("entryName: index=0 produces no suffix", () => {
  const info = {
    facadeModuleId: "/x/Foo.astro?astro&type=script&index=0&lang.ts",
    name: "Foo",
  };
  assert.equal(entryName(info), "foo");
});

test("entryName: missing index in URL is treated as no suffix", () => {
  const info = {
    facadeModuleId: "/x/Foo.astro?astro&type=script&lang.ts",
    name: "Foo",
  };
  assert.equal(entryName(info), "foo");
});

test("entryName: handles acronym-prefixed names via decamelize", () => {
  const info = {
    facadeModuleId: "/x/HTMLParser.astro?astro&type=script&index=0",
    name: "HTMLParser",
  };
  assert.equal(entryName(info), "html_parser");
});

test("entryName: handles trailing-acronym names", () => {
  const info = {
    facadeModuleId: "/x/MyComponentIsAwesome.astro?astro&type=script&index=0",
    name: "MyComponentIsAwesome",
  };
  assert.equal(entryName(info), "my_component_is_awesome");
});

test("entryName: non-script chunk falls back to sanitized name", () => {
  const info = { facadeModuleId: null, name: "SharedVendor" };
  assert.equal(entryName(info), "shared_vendor");
});

test("entryName: sanitizes URL-unsafe chars in fallback name", () => {
  const info = {
    facadeModuleId: null,
    name: "Foo.astro?astro&pageScript",
  };
  // Astro's cleanChunkName replaces unsafe chars with _; we then decamelize.
  // Resulting name is messy but contains no URL chars.
  const out = entryName(info);
  assert.match(out, /^[\w.\-/]+$/);
});

test("entryName: respects custom separator", () => {
  const info = {
    facadeModuleId: "/x/MyComponent.astro?astro&type=script&index=0",
    name: "MyComponent",
  };
  assert.equal(entryName(info, { separator: "-" }), "my-component");
});

test("assetName: CSS gets snake_cased basename", () => {
  assert.equal(assetName({ names: ["Layout.css"] }), "layout");
});

test("assetName: nested PascalCase CSS handled", () => {
  assert.equal(assetName({ names: ["MyComponentIsAwesome.css"] }), "my_component_is_awesome");
});

test("assetName: strips Astro 7 page-extension marker", () => {
  // Astro 7 names SSR-emitted page CSS after the page module, which embeds
  // the internal extension marker: src/pages/index.astro -> index@_@astro.css
  assert.equal(assetName({ names: ["index@_@astro.css"] }), "index");
});

test("assetName: decamelizes the page name in front of the marker", () => {
  assert.equal(assetName({ names: ["MyFancyPage@_@astro.css"] }), "my_fancy_page");
});

test("assetName: handles non-astro page extensions in the marker", () => {
  // Markdown pages carry their own extension after the marker.
  assert.equal(assetName({ names: ["some-post@_@md.css"] }), "some-post");
});

test("assetName: non-CSS returns null (signal: skip)", () => {
  assert.equal(assetName({ names: ["icon.png"] }), null);
});

test("assetName: missing names array returns null", () => {
  assert.equal(assetName({}), null);
});

test("assetName: respects custom separator for CSS", () => {
  assert.equal(
    assetName({ names: ["MyComponent.css"] }, { separator: "-" }),
    "my-component",
  );
});

test("client config: entryFileNames and chunkFileNames both get entryName()", () => {
  const integration = niceAssetFilenames();
  let vite;
  integration.hooks["astro:config:setup"]({
    config: { build: { assets: "_astro" } },
    updateConfig: (cfg) => {
      vite = cfg.vite;
    },
  });
  const { entryFileNames, chunkFileNames } =
    vite.environments.client.build.rollupOptions.output;
  assert.equal(
    entryFileNames({ name: "ThemeToggle", facadeModuleId: null }),
    "_astro/theme_toggle.[hash].js",
  );
  assert.equal(
    chunkFileNames({ name: "Clickable", facadeModuleId: null }),
    "_astro/clickable.[hash].js",
  );
});

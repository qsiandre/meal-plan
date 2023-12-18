import {relay} from "./plugins/relayPlugin.ts";

const result = await Bun.build({
  entrypoints: ['./src/app.tsx'],
  outdir: './build',
  plugins: [relay],
  target: "browser",
  sourcemap: "external",
});

if (!result.success ) {
  console.log(result);
}
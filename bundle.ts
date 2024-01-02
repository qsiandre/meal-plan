import { relay } from "./plugins/relayPlugin.ts";
import { watch } from "fs";

async function build() {
  const result = await Bun.build({
    entrypoints: ["./src/app.tsx", "./src/playground.tsx"],
    outdir: "./build",
    plugins: [relay],
    target: "browser",
    sourcemap: "external",
  });
  if (!result.success) {
    console.log(result);
  }
  return result;
}

if (Bun.argv.indexOf("--watch") !== -1) {
  const watcher = watch(
    `${import.meta.dir}/src`,
    { recursive: true },
    (event, filename) => {
      build();
      console.log(`Detected ${event} in ${filename} (src)`);
    }
  );

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
} else {
  await build();
}

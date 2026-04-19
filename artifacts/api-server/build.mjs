import esbuild from "esbuild";
import { pinoESBuild } from "esbuild-plugin-pino";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rm } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = __dirname;

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild.build({
    entryPoints: [path.resolve(artifactDir, "src/index.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile: path.resolve(distDir, "index.mjs"),
    sourcemap: true,
    minify: false,
    external: ["@workspace/db", "drizzle-orm", "pg"], // Keep these as external if needed, but for Railway we can bundle them too
    plugins: [
      pinoESBuild({
        transports: ["pino-pretty"],
      }),
    ],
    banner: {
      js: "import { createRequire as __bannerCrReq } from 'node:module'; const require = __bannerCrReq(import.meta.url);",
    },
  });

  console.log("✅ Railway Build Success (dist/index.mjs created)");
}

buildAll().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});

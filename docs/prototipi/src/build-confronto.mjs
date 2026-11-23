// Genera docs/prototipi/confronto-personaggi.html dal motore dell'app (figure.js + flat.js).
// Uso: node docs/prototipi/src/build-confronto.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const strip = f => readFileSync(join(root, f), "utf8").replace(/^\/\/ @ts-nocheck\n/, "").replace(/^export \{[^}]*\};?\s*$/m, "");
const engine = strip("app/src/engine/figure.js");
const flat = strip("app/src/engine/flat.js");
const tpl = readFileSync(join(root, "docs/prototipi/src/confronto.template.html"), "utf8");
const css = readFileSync(join(root, "app/src/index.css"), "utf8").match(/:root \{[\s\S]*?\n\}\n@media \(prefers-color-scheme: dark\) \{[\s\S]*?\n\}\n/)[0];
writeFileSync(join(root, "docs/prototipi/confronto-personaggi.html"),
  tpl.replace("/*TOKENS*/", () => css).replace("/*ENGINE*/", () => `(()=>{${engine}\nconst heroFlat=(()=>{${flat}\nreturn heroFlat;})();\nwindow.ENG={FIG,PROP,skel,lerp,hero,heroFlat};})();`));
console.log("ok");

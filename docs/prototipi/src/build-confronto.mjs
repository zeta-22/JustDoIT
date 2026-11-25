// Genera le pagine di prototipo (confronto personaggi, revisione animazioni) dal motore dell'app (figure.js + flat.js).
// Uso: node docs/prototipi/src/build-confronto.mjs [template] [uscita]
//   es. node docs/prototipi/src/build-confronto.mjs revisione revisione-animazioni-1
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const strip = f => readFileSync(join(root, f), "utf8").replace(/^\/\/ @ts-nocheck\n/, "").replace(/^export \{[^}]*\};?\s*$/m, "");
const engine = strip("app/src/engine/figure.js");
const flat = strip("app/src/engine/flat.js");
const back = strip("app/src/engine/back.js").replace(/^export (function|const) /gm, "$1 ");
const front = strip("app/src/engine/front.js").replace(/^export (function|const) /gm, "$1 ");
const tpl = readFileSync(join(root, "docs/prototipi/src/" + (process.argv[2] || "confronto") + ".template.html"), "utf8");
const css = readFileSync(join(root, "app/src/index.css"), "utf8").match(/:root \{[\s\S]*?\n\}\n@media \(prefers-color-scheme: dark\) \{[\s\S]*?\n\}\n/)[0];
writeFileSync(join(root, "docs/prototipi/" + (process.argv[3] || "confronto-personaggi") + ".html"),
  tpl.replace("/*TOKENS*/", () => css).replace("/*ENGINE*/", () => `(()=>{${engine}\nconst heroFlat=(()=>{${flat}\nreturn heroFlat;})();\nconst BACK=(()=>{${back}\nreturn {FIGB,renderBack};})();\nconst FRONT=(()=>{${front}\nreturn {FIGF,renderFront};})();\nwindow.ENG={FIG,PROP,skel,lerp,hero,heroFlat,FIGB:BACK.FIGB,renderBack:BACK.renderBack,FIGF:FRONT.FIGF,renderFront:FRONT.renderFront};})();`));
console.log("ok");

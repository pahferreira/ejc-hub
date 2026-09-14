#!/usr/bin/env bash
# Rebuilds everything design-sync consumes from this repo:
#   1. the component barrels (bundle entry + declaration entry)
#   2. the .d.ts tree that gives the design agent real prop contracts
#   3. the reference storybook used as the fidelity oracle
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/app"

# 1. barrels — every non-story .tsx under src/components
node -e '
const fs=require("fs"),path=require("path");
const root=path.resolve("src/components"); const out=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:1)){
  const p=path.join(d,e.name);
  if(e.isDirectory())walk(p);
  else if(/\.tsx$/.test(e.name)&&!/\.(stories|test|spec)\./.test(e.name))out.push(p);}})(root);
fs.mkdirSync(".ds-entry",{recursive:true});
const rel=p=>"../"+path.relative(path.resolve("."),p).replace(/\.tsx$/,"").split(path.sep).join("/");
fs.writeFileSync(".ds-entry/index.ts", out.map(p=>`export * from ${JSON.stringify(rel(p))};`).join("\n")+"\n");
fs.writeFileSync(".ds-entry.mjs",     out.map(p=>`export * from ${JSON.stringify(p)};`).join("\n")+"\n");
console.error("  barrel: "+out.length+" component modules");
'

# 2. declarations (emit-only; pre-existing strict errors in src/hooks are non-fatal here)
rm -rf dist-ds
npx tsc -p tsconfig.ds.json || true
echo 'export * from "./dist-ds/app/.ds-entry/index";' > index.d.ts

# 3. reference storybook (the compare oracle)
npx storybook build -c .storybook -o "$ROOT/.design-sync/sb-reference"

#!/usr/bin/env bash
# Smoke-test static app assets (local dir or GitHub Pages base URL).
set -euo pipefail

BASE="${1:-http://localhost:8765}"
BASE="${BASE%/}"

paths=(
  index.html
  index-flux.html
  index-ltx.html
  index-r.html
  index-nsfw.html
  config/flux.json
  config/ltx.json
  config/nsfw.json
  config/r-rated.json
  edition-local.js
  edition.js
  prompt-engine.js
  packs.js
  icons.js
  ui-shared.js
  ui-builder-tab.js
  ui-sequence-tab.js
  ui-logger-tab.js
  ui-resources-tab.js
  ui-local-shared.js
  ui-local-settings.js
  ui-local-output.js
  ui-local-builder.js
  ui-local-sequence.js
  ui-local-logger.js
  ui-local-resources.js
  app.js
  master-pack-full.json
  master-pack-r-rated.json
  packs/manifest.json
  packs/flux-starter.json
  packs/ltx-starter.json
  packs/my-pack.example.json
  packs/schema.json
  docs/prompting-flux-ltx.md
  docs/pack-schema.md
)

echo "Smoke test: $BASE"
failed=0
for path in "${paths[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$path")
  if [[ "$code" != "200" ]]; then
    echo "FAIL $code $path"
    failed=1
  else
    echo "OK   $code $path"
  fi
done

python3 - "$BASE" <<'PY'
import json
import sys
import urllib.request

base = sys.argv[1].rstrip("/")

def fetch(path):
    with urllib.request.urlopen(f"{base}/{path}") as resp:
        return resp.read()

nsfw = json.loads(fetch("config/nsfw.json"))
rated = json.loads(fetch("config/r-rated.json"))
flux = json.loads(fetch("config/flux.json"))
ltx = json.loads(fetch("config/ltx.json"))
full = json.loads(fetch("master-pack-full.json"))
rr = json.loads(fetch("master-pack-r-rated.json"))
flux_pack = json.loads(fetch("packs/flux-starter.json"))
ltx_pack = json.loads(fetch("packs/ltx-starter.json"))
html = fetch("index.html").decode()
html_r = fetch("index-r.html").decode()
html_nsfw = fetch("index-nsfw.html").decode()
html_ltx = fetch("index-ltx.html").decode()

assert nsfw["edition"] == "nsfw", nsfw["edition"]
assert rated["edition"] == "r-rated", rated["edition"]
assert flux["edition"] == "flux", flux["edition"]
assert ltx["edition"] == "ltx", ltx["edition"]
assert "fictional adults" in flux["contentNote"].lower()
assert "fictional adults" in ltx["contentNote"].lower()
assert len(full["prompts"]) == 231, len(full["prompts"])
assert len(rr["prompts"]) == 102, len(rr["prompts"])
assert 15 <= len(flux_pack["prompts"]) <= 25, len(flux_pack["prompts"])
assert 15 <= len(ltx_pack["prompts"]) <= 25, len(ltx_pack["prompts"])
assert "config/flux.json" in html, "default index.html must load Flux config"
assert "config/r-rated.json" in html_r, "index-r.html must load the R-rated config"
assert "config/nsfw.json" in html_nsfw
assert "config/ltx.json" in html_ltx

banned = ("[ETHICAL_PREFIX]", "[DODGE_LAYER]", "[ULTIMATE_DODGE_LAYER]", "Spicy mode")
for pack in (flux_pack, ltx_pack):
    blob = json.dumps(pack)
    for token in banned:
        assert token not in blob, token

for script in (
    "edition-local.js",
    "ui-shared.js",
    "ui-builder-tab.js",
    "ui-local-builder.js",
    "ui-local-sequence.js",
    "app.js",
):
    assert f'src="{script}"' in html, script

print("OK   config editions: flux + ltx + nsfw + r-rated")
print(f"OK   pack counts: {len(full['prompts'])} NSFW (public), {len(rr['prompts'])} R-rated, {len(flux_pack['prompts'])} Flux, {len(ltx_pack['prompts'])} LTX")
print("OK   default index.html is the Flux edition")
print("OK   index.html loads split UI modules")
PY

node "$(cd "$(dirname "$0")/.." && pwd)/scripts/check_local_compose.js"

if [[ "$failed" -eq 0 ]]; then
  echo "All smoke checks passed."
else
  exit 1
fi

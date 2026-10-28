# Pack schema

Packs are JSON files under `packs/`. The app loads the ones listed in [`packs/manifest.json`](../packs/manifest.json) whose `edition` matches the page (`flux` or `ltx`). Serve the repo over HTTP. `file://` cannot fetch JSON.

```json
{
  "packs": [
    {
      "id": "flux-starter",
      "file": "packs/flux-starter.json",
      "edition": "flux",
      "label": "Flux starter",
      "enabled": true
    }
  ]
}
```

`file` is relative to the site root. `enabled: false` keeps the pack out until you turn it on under Packs. The browser remembers that toggle in `localStorage` (`architect_pack_overrides`).

[`packs/my-pack.example.json`](../packs/my-pack.example.json) is a one-template pack you can copy. It ships disabled.

## Pack file

A formal JSON Schema is in [`packs/schema.json`](../packs/schema.json). The fields that matter:

| Field | Role |
| --- | --- |
| `id` | Stable id. Match the manifest id. |
| `edition` | `flux` or `ltx`. |
| `label` | Name shown in the Packs list. |
| `styles` | `{ id, label, prompt }`. `prompt` is a sentence, not a tag list. |
| `boosters` | Same shape. Stacked onto the style sentence. |
| `characters` | Reusable sheets. See below. |
| `prompts` | Templates. |

Styles and boosters merge by `id`. A pack can replace a built-in id or add a new one.

### Character

```json
{
  "id": "mara",
  "name": "Mara Voss",
  "face": "oval face, grey-green eyes",
  "body": "adult woman in her thirties, tall and athletic",
  "hair": "dark auburn hair, shoulder-length waves",
  "wardrobe": "an open black silk robe",
  "setting": "a bedroom with rumpled ivory sheets and one lit candle",
  "lighting": "warm candlelight from camera left"
}
```

The app turns name, face, body, hair, and wardrobe into one identity sentence and inserts it verbatim. Setting and lighting are inserted verbatim as their own sentences. Write them the same way every time you want the same person.

Say that the person is an adult. Do not describe a real person's likeness.

### Template

```json
{
  "number": 1,
  "name": "Candle and shoulder",
  "type": "image",
  "summary": "Short line for the template list.",
  "prompt": "Same short line, used by search.",
  "character_id": "mara",
  "builder": {
    "style_id": "film-portrait",
    "boosters": ["rim-light"],
    "subject": "She sits on the edge of the bed and looks back over her shoulder.",
    "camera": "Medium shot, eye level, 50mm lens.",
    "audio": ""
  }
}
```

`character_id` must match a character in the same pack. `style_id` and each booster id must exist in the pack or in the edition's built-in list. For LTX, `type` is `video`, `subject` is present tense, `camera` is a movement, and `audio` is the ambience line without an `Audio:` prefix. The composer adds that prefix when the audio toggle is on.

You can inline a `character` object on the template instead of `character_id`. An inline object wins.

## Adding a pack

1. Copy `packs/my-pack.example.json` to something like `packs/my-flux.json`.
2. Change `id`, `edition`, styles, characters, and prompts.
3. Add an entry to `packs/manifest.json` with `"enabled": true`.
4. Reload. The Packs tab lists it. Templates from that pack show up in the builder for that edition.

Keep the new file free of Grok bypass copy: no `[ETHICAL_PREFIX]`, no `[DODGE_LAYER]`, no "Spicy mode:", no "implied only".

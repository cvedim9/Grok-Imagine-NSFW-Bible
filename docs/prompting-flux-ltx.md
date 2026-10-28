# Prompting Flux and LTX

This app writes prompts for local ComfyUI checkpoints. Flux prompts are still photographs described in sentences. LTX prompts are one continuous shot. Neither edition adds a "Spicy mode:" tag, a quality-tag pile, or a moderation-bypass layer.

The composer lives in `prompt-engine.js` (`composeFlux`, `composeLtx`). Sampling values are a separate settings block, not part of the prompt text.

## Flux

Black Forest Labs tells you to describe the image: subject, what it is doing, style, and context (setting, light, mood). Word order matters. FLUX.2 pays more attention to what comes first, and the useful length for most images is a medium prompt of roughly 30–80 words. FLUX.2 does not support negative prompts; describe what you want.

Sources:

- [FLUX.2 prompting guide](https://docs.bfl.ai/guides/prompting_guide_flux2) — subject, action, style, context; word order; no negative prompts; length bands.
- [FLUX prompting overview](https://docs.bfl.ai/guides/prompting_summary) — describe subject, setting, style, lighting, and composition.
- [ComfyUI, August 2024](https://blog.comfy.org/p/august-2024-flux-support-new-frontend-for-loops-and-more) — FLUX.1 dev and schnell are meant to run with KSampler `cfg` at 1. Dev uses the `FluxGuidance` node for the distilled guidance value.

This app keeps the subject first, which matches that word-order note, and then uses a fixed order that is easy to reuse with a character sheet:

1. Identity, verbatim: name, face, body, hair, wardrobe.
2. The action sentence.
3. Setting, verbatim.
4. Composition and camera.
5. Lighting, verbatim.
6. Style and any stacked boosters, as sentences.

There is no `8k` / `masterpiece` suffix. A negative box exists under Advanced and is copied into the **settings** block only when CFG is greater than 1. At CFG 1 the model never reads it, so the app leaves it out.

Starter sampling values, for the settings block:

| Preset | Steps | CFG | Guidance | Sampler | Scheduler |
| --- | --- | --- | --- | --- | --- |
| FLUX.1 [dev] | 28 | 1 | 3.5 on FluxGuidance | euler | simple |
| FLUX.1 [schnell] | 4 | 1 | none | euler | simple |
| CFG above 1 | 20 | 2 | 2 | euler | simple |

The third row is only for a graph that really runs classifier-free guidance. Resolutions are the usual ~1 megapixel sizes whose sides divide by 16: 832×1216, 1216×832, 1024×1024, 1344×768, 768×1344.

## LTX

Lightricks asks for one flowing paragraph, present tense, camera movement described relative to the subject, and enough concrete detail to fill the clip. A single shot is often 4–8 sentences. Audio, when the checkpoint generates it, belongs in that same paragraph. Multi-shot text should not be a numbered shot list unless you also describe the cut.

Sources:

- [LTX prompting guide](https://docs.ltx.io/api-documentation/implementation-guides/prompting-guide.md) — one paragraph, present tense, 4–8 sentences, camera relative to the subject, pace written into the prompt.
- [LTX-2 prompting guide](https://ltx.io/blog/prompting-guide-for-ltx-2) — shot, scene, action in order, character detail, camera, and audio (ambience, music, quoted speech).
- [LTX-2 in ComfyUI](https://docs.comfy.org/tutorials/video/ltx/ltx-2) — `ltx-2-19b-distilled` is the 8-step, CFG 1 path.
- [Lightricks/LTX-2](https://github.com/Lightricks/LTX-2) — chronological action, camera, and lighting.

This app writes one paragraph in this order:

1. Identity, verbatim.
2. Action, present tense, in time order.
3. Camera movement.
4. Setting, verbatim.
5. Lighting, verbatim.
6. Look (style and boosters).
7. Optional `Audio:` sentence for LTX-2.

The Sequence tab does **not** paste four beats into one prompt. Each phase becomes its own clip prompt, and the identity, setting, and lighting lines are repeated so the person and the room stay put.

Frame count has to be `8×n+1`. The length menu uses:

| Label | Frames | At 24 fps |
| --- | --- | --- |
| about 5s | 121 | about 5.0s |
| about 6.7s | 161 | about 6.7s |
| about 10s | 241 | about 10.0s |

Stage-1 resolutions divide by 32. 960×544 is the 16:9 size used in ComfyUI examples; a 2× spatial upscale doubles it. The distilled settings block says 8 steps, CFG 1, euler, and `LTXVScheduler`, because the official graph does not use a plain KSampler schedule. The dev preset (20 steps, CFG 3) is a starting point, not a number from the model card. Match it to the graph you run.

A short action will not fill a long clip. If you pick 10 seconds, say what happens across that time, including holds ("she pauses", "a beat of quiet") when you want them.

## What these editions leave out

The NSFW and R-rated editions still target Grok and still contain that product's own blocks. Flux and LTX do not copy them: no ethical-prefix token used as a filter signal, no dodge layer, no mist or "implied only" cover, no Spicy mode tag, and no off-peak or geoblock advice.

Every character in the starter packs is a fictional adult. The header says so. Do not put a real person's likeness in a sheet or a template.

#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const vm = require("vm");

function load(file, sandbox) {
    const code = fs.readFileSync(path.join(root, file), "utf8");
    vm.runInNewContext(code, sandbox, { filename: file });
}

const sandbox = { console };
load("edition-local.js", sandbox);
load("edition.js", sandbox);
load("prompt-engine.js", sandbox);

const { resolveAppConfig, createPromptEngine } = sandbox;
if (typeof resolveAppConfig !== "function") {
    throw new Error("resolveAppConfig was not created");
}

function readJson(rel) {
    return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function assert(cond, message) {
    if (!cond) {
        console.error("FAIL", message);
        process.exitCode = 1;
    }
}

const BANNED = /\[ETHICAL_PREFIX\]|\[DODGE_LAYER\]|\[ULTIMATE_DODGE_LAYER\]|\[R_RATED_DODGE_LAYER\]|Spicy mode|off-peak|geoblock|implied only|mist overlay|artistic implication/i;

function walkStrings(value, out) {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, out));
    else if (value && typeof value === "object") Object.values(value).forEach((item) => walkStrings(item, out));
}

const fluxCfg = readJson("config/flux.json");
const ltxCfg = readJson("config/ltx.json");
const nsfwCfg = readJson("config/nsfw.json");
const ratedCfg = readJson("config/r-rated.json");
const flux = resolveAppConfig(fluxCfg);
const ltx = resolveAppConfig(ltxCfg);
const nsfw = resolveAppConfig(nsfwCfg);
const rated = resolveAppConfig(ratedCfg);

assert(flux.composer === "flux", "flux composer");
assert(ltx.composer === "ltx", "ltx composer");
assert(nsfw.composer === "grok", "nsfw composer");
assert(rated.composer === "grok", "r-rated composer");
assert(flux.modePrefix === "", "flux has no mode prefix");
assert(!flux.dodgeLayer, "flux dodge layer is empty");
assert(!ltx.dodgeLayer, "ltx dodge layer is empty");
assert(rated.activeArtStyles.every((style) => style.id !== "hentai" && style.id !== "photorealistic"), "r-rated style filter");
assert(nsfw.activeArtStyles.length === 6, "nsfw keeps six styles");
assert(!flux.artStyles.some((style) => /8k|masterpiece|best quality/i.test(style.prompt)), "flux styles are sentences");

for (const cfg of [fluxCfg, ltxCfg]) {
    const strings = [];
    walkStrings(cfg, strings);
    strings.forEach((text) => assert(!BANNED.test(text), "banned copy in " + cfg.edition + ": " + text.slice(0, 80)));
}

const mara = {
    name: "Mara Voss",
    face: "grey-green eyes",
    body: "adult woman in her thirties, tall",
    hair: "auburn waves",
    wardrobe: "an open black silk robe",
    setting: "a bedroom with rumpled ivory sheets and one lit candle",
    lighting: "warm candlelight from camera left and deep shadow on the far wall",
};

const fluxInput = {
    styleId: "film-portrait",
    boosterIds: ["rim-light"],
    useCharacter: true,
    character: mara,
    subject: "She sits on the edge of the bed and looks back over her shoulder",
    camera: "Medium shot, eye level, 50mm lens",
    useAudio: false,
    audio: "",
    negative: "extra fingers",
    modelId: "flux1-dev",
    resolutionId: "832x1216",
    lengthId: "",
    steps: 28,
    cfg: 1,
    guidance: 3.5,
    sampler: "euler",
    scheduler: "simple",
    seed: 42,
    loras: [{ name: "silk-robe.safetensors", trigger: "silkrobe", weight: 0.8 }],
};

const fluxEngine = createPromptEngine(flux);
const fluxOut = fluxEngine.composeScene(fluxInput);
const at = (hay, needle) => {
    const i = hay.indexOf(needle);
    assert(i >= 0, "missing " + needle);
    return i;
};
const prompt = fluxOut.prompt;
assert(!prompt.includes("\n"), "flux prompt is one paragraph");
assert(!/Spicy mode|DODGE|8k|masterpiece/i.test(prompt), "flux prompt stays clean");
assert(!prompt.includes("CFG:"), "settings stay out of the flux prompt");
const order = [
    "Mara Voss",
    "She sits on the edge of the bed",
    "rumpled ivory",
    "50mm lens",
    "candlelight from camera left",
    "35mm film",
    "rim light separates",
];
let prev = -1;
order.forEach((needle) => {
    const i = at(prompt, needle);
    assert(i > prev, "order broken at " + needle);
    prev = i;
});
assert(fluxOut.settings.includes("Resolution: 832x1216"), "flux resolution");
assert(fluxOut.settings.includes("Guidance: 3.5"), "flux guidance");
assert(fluxOut.settings.includes("LoRA 1: silk-robe.safetensors @ 0.8"), "lora line");
assert(fluxOut.settings.includes("LoRA 1 trigger: silkrobe"), "trigger line");
assert(!fluxOut.settings.includes("Negative:"), "cfg 1 omits negative");
const withCfg = fluxEngine.composeScene({ ...fluxInput, cfg: 2 });
assert(withCfg.settings.includes("Negative: extra fingers"), "cfg > 1 keeps negative");
assert(!withCfg.prompt.includes("extra fingers"), "negative stays out of the prompt");

const ltxEngine = createPromptEngine(ltx);
const ltxInput = {
    ...fluxInput,
    styleId: "live-action",
    boosterIds: ["shallow-focus"],
    modelId: "ltx2-distilled",
    resolutionId: "960x544",
    lengthId: "5s",
    steps: 8,
    cfg: 1,
    guidance: null,
    sampler: "euler",
    scheduler: "LTXVScheduler",
    useAudio: true,
    audio: "quiet room tone, a sheet shifting",
    subject: "She sits on the edge of the bed, then turns her head",
    camera: "The camera slowly pushes in toward her shoulder",
};
const ltxOut = ltxEngine.composeScene(ltxInput);
assert(!ltxOut.prompt.includes("\n"), "ltx prompt is one paragraph");
assert(!/Spicy mode|DODGE/i.test(ltxOut.prompt), "ltx prompt stays clean");
const ltxOrder = [
    "Mara Voss",
    "turns her head",
    "pushes in toward her shoulder",
    "rumpled ivory",
    "candlelight from camera left",
    "live-action shot",
    "Audio: quiet room tone",
];
prev = -1;
ltxOrder.forEach((needle) => {
    const i = at(ltxOut.prompt, needle);
    assert(i > prev, "ltx order broken at " + needle);
    prev = i;
});
assert(ltxOut.settings.includes("121 frames @ 24 fps"), "length guide");
assert(ltxOut.settings.includes("Resolution: 960x544"), "ltx resolution");
assert(!ltxOut.settings.includes("Guidance:"), "distilled ltx has no guidance line");
const silent = ltxEngine.composeScene({ ...ltxInput, useAudio: false });
assert(!silent.prompt.includes("Audio:"), "audio is optional");

const shots = ltxEngine.composeShots(ltxInput);
assert(shots.length === 4, "four ltx shots");
shots.forEach((shot) => {
    assert(shot.prompt.includes("Mara Voss. Face:"), "identity repeated: " + shot.title);
    assert(shot.prompt.includes("rumpled ivory"), "setting repeated");
    assert(!shot.prompt.includes("\n"), "shot is one paragraph");
    assert(!shot.prompt.includes("CFG:"), "shot has no settings");
});
assert(shots[1].prompt.includes("one continuous rhythm"), "second beat");

const grok = createPromptEngine(nsfw);
const parts = grok.buildPromptParts({
    styleId: "anime",
    boosterIds: ["volumetric"],
    isSpicyMode: true,
    useContinuity: true,
    subject: "candlelit room",
    useDodge: true,
    useAudio: true,
});
const grokOut = grok.toPrompt(parts, { isSpicyMode: true, aspectRatio: "16:9", voice: nsfw.voiceTypes[0] });
assert(grokOut.raw.startsWith("Spicy mode:"), "grok spicy prefix remains");
assert(grokOut.raw.includes(nsfw.ethicalPrefix.slice(0, 24)), "ethical prefix still expands");
assert(grokOut.raw.includes(nsfw.dodgeLayer.slice(0, 24)), "dodge layer still expands");
assert(grokOut.raw.includes("--ar 16:9"), "aspect suffix remains");

const manifest = readJson("packs/manifest.json");
manifest.packs.forEach((entry) => {
    assert(fs.existsSync(path.join(root, entry.file)), "missing " + entry.file);
    const pack = readJson(entry.file);
    assert(pack.edition === entry.edition, entry.id + " edition");
    const styleIds = new Set((pack.styles || []).map((style) => style.id));
    const boosterIds = new Set((pack.boosters || []).map((item) => item.id));
    const characterIds = new Set((pack.characters || []).map((item) => item.id));
    (pack.prompts || []).forEach((item) => {
        const strings = [];
        walkStrings(item, strings);
        strings.forEach((text) => assert(!BANNED.test(text), entry.id + " banned in " + item.name));
        if (item.character_id) assert(characterIds.has(item.character_id), item.name + " character");
        const styleId = item.builder && item.builder.style_id;
        if (styleId) assert(styleIds.has(styleId), item.name + " style " + styleId);
        (item.builder.boosters || []).forEach((id) => assert(boosterIds.has(id), item.name + " booster " + id));
    });
});

const fluxPack = readJson("packs/flux-starter.json");
const ltxPack = readJson("packs/ltx-starter.json");
assert(fluxPack.prompts.length >= 15 && fluxPack.prompts.length <= 25, "flux pack size " + fluxPack.prompts.length);
assert(ltxPack.prompts.length >= 15 && ltxPack.prompts.length <= 25, "ltx pack size " + ltxPack.prompts.length);

const html = {
    "index.html": "config/flux.json",
    "index-flux.html": "config/flux.json",
    "index-ltx.html": "config/ltx.json",
    "index-nsfw.html": "config/nsfw.json",
    "index-r.html": "config/r-rated.json",
};
Object.entries(html).forEach(([file, cfg]) => {
    const text = fs.readFileSync(path.join(root, file), "utf8");
    assert(text.includes(cfg), file + " should load " + cfg);
    assert(text.includes('src="edition-local.js"'), file + " loads edition-local");
    assert(text.includes('src="ui-local-builder.js"'), file + " loads local builder");
    assert(!/http-equiv="refresh"/i.test(text), file + " is not a redirect");
});

if (process.exitCode) {
    console.error("Composition checks failed.");
    process.exit(process.exitCode);
}
console.log("OK   flux prompt order, ltx shot list, grok prefix, packs");

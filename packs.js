function readPackOverrides() {
    try {
        return JSON.parse(localStorage.getItem('architect_pack_overrides') || '{}');
    } catch (err) {
        return {};
    }
}

function writePackOverride(id, enabled) {
    const overrides = readPackOverrides();
    overrides[id] = !!enabled;
    localStorage.setItem('architect_pack_overrides', JSON.stringify(overrides));
}

function mergeById(base, lists) {
    const extra = (lists || []).reduce((all, list) => all.concat(list || []), []);
    const map = new Map();
    (base || []).forEach((item) => { if (item && item.id) map.set(item.id, item); });
    extra.forEach((item) => { if (item && item.id) map.set(item.id, item); });
    const seen = new Set();
    const out = [];
    extra.concat(base || []).forEach((item) => {
        if (!item || !item.id || seen.has(item.id)) return;
        seen.add(item.id);
        out.push(map.get(item.id));
    });
    return out;
}

function blankCharacter() {
    return { name: '', face: '', body: '', hair: '', wardrobe: '', setting: '', lighting: '' };
}

function copyCharacter(source) {
    const blank = blankCharacter();
    Object.keys(blank).forEach((key) => { blank[key] = source && source[key] ? source[key] : ''; });
    return blank;
}

function randomSeed() {
    return Math.floor(Math.random() * 4294967296);
}

function defaultScene(edition) {
    const model = (edition.models || [])[0] || {};
    const resolution = (edition.resolutions || [])[0] || {};
    const length = (edition.lengths || [])[0] || {};
    return {
        subject: '',
        camera: '',
        audio: '',
        useAudio: false,
        useCharacter: true,
        sheetId: '',
        character: blankCharacter(),
        negative: '',
        modelId: model.id || '',
        resolutionId: resolution.id || '',
        lengthId: length.id || '',
        steps: model.steps != null ? model.steps : 20,
        cfg: model.cfg != null ? model.cfg : 1,
        guidance: model.guidance == null ? null : model.guidance,
        sampler: model.sampler || 'euler',
        scheduler: model.scheduler || 'simple',
        seed: randomSeed(),
        loras: [{ name: '', trigger: '', weight: 0.8 }],
    };
}

function applyModelPreset(edition, scene, modelId) {
    const model = (edition.models || []).find((item) => item.id === modelId);
    if (!model) return { ...scene, modelId };
    return {
        ...scene,
        modelId,
        steps: model.steps,
        cfg: model.cfg,
        guidance: model.guidance == null ? null : model.guidance,
        sampler: model.sampler || scene.sampler,
        scheduler: model.scheduler || scene.scheduler,
    };
}

async function fetchEditionLibrary(manifestUrl, editionId) {
    const overrides = readPackOverrides();
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error('manifest HTTP ' + response.status);
    const manifest = await response.json();
    const entries = (manifest.packs || []).filter((pack) => pack.edition === editionId);
    const packs = [];
    const styleLists = [];
    const boosterLists = [];
    const characters = [];
    const templates = [];
    for (const entry of entries) {
        const enabled = Object.prototype.hasOwnProperty.call(overrides, entry.id)
            ? !!overrides[entry.id]
            : entry.enabled !== false;
        const label = entry.label || entry.id;
        if (!enabled) {
            packs.push({ id: entry.id, label, file: entry.file, enabled: false, status: 'off' });
            continue;
        }
        try {
            const res = await fetch(entry.file);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            packs.push({ id: entry.id, label: data.label || label, file: entry.file, enabled: true, status: 'ready' });
            if (Array.isArray(data.styles)) styleLists.push(data.styles);
            if (Array.isArray(data.boosters)) boosterLists.push(data.boosters);
            if (Array.isArray(data.characters)) characters.push.apply(characters, data.characters);
            (data.prompts || []).forEach((prompt) => templates.push({ ...prompt, packId: entry.id }));
        } catch (err) {
            packs.push({ id: entry.id, label, file: entry.file, enabled: true, status: 'error', error: String(err.message || err) });
        }
    }
    return { packs, styleLists, boosterLists, characters, templates, status: 'ready' };
}

const DODGE_TOKENS = [/\[DODGE_LAYER\]/g, /\[R_RATED_DODGE_LAYER\]/g, /\[ULTIMATE_DODGE_LAYER\]/g];

function sentence(text) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    return /[.!?]["']?$/.test(t) ? t : t + '.';
}

function cleanField(text) {
    return String(text || '').replace(/\s+/g, ' ').trim().replace(/\.+$/g, '');
}

function identityLine(character) {
    if (!character) return '';
    const bits = [];
    const name = cleanField(character.name);
    const face = cleanField(character.face);
    const body = cleanField(character.body);
    const hair = cleanField(character.hair);
    const wardrobe = cleanField(character.wardrobe);
    if (name) bits.push(name);
    if (face) bits.push('Face: ' + face);
    if (body) bits.push('Body: ' + body);
    if (hair) bits.push('Hair: ' + hair);
    if (wardrobe) bits.push('Wardrobe: ' + wardrobe);
    if (!bits.length) return '';
    return bits.join('. ') + '.';
}

function sheetParts(character, useCharacter) {
    if (!useCharacter || !character) return { identity: '', setting: '', lighting: '' };
    return {
        identity: identityLine(character),
        setting: sentence(character.setting),
        lighting: sentence(character.lighting),
    };
}

function styleClause(edition, styleId, boosterIds) {
    const style = (edition.artStyles || []).find((s) => s.id === styleId);
    const boosters = (boosterIds || [])
        .map((id) => (edition.styleBoosters || []).find((b) => b.id === id))
        .filter(Boolean);
    return [style ? style.prompt : ''].concat(boosters.map((b) => b.prompt)).map(sentence).filter(Boolean).join(' ');
}

function cameraLine(edition, camera) {
    return sentence(camera || edition.defaultCamera || '');
}

function audioLine(edition, input) {
    if (!input.useAudio) return '';
    const line = String(input.audio || edition.defaultAudio || '').trim().replace(/^audio:\s*/i, '');
    if (!line) return '';
    return sentence('Audio: ' + line);
}

function composeFlux(edition, input) {
    const sheet = sheetParts(input.character, input.useCharacter);
    return [
        sheet.identity,
        sentence(input.subject),
        sheet.setting,
        cameraLine(edition, input.camera),
        sheet.lighting,
        styleClause(edition, input.styleId, input.boosterIds),
    ].filter(Boolean).join(' ');
}

function composeLtx(edition, input) {
    const sheet = sheetParts(input.character, input.useCharacter);
    return [
        sheet.identity,
        sentence(input.subject),
        cameraLine(edition, input.camera),
        sheet.setting,
        sheet.lighting,
        styleClause(edition, input.styleId, input.boosterIds),
        audioLine(edition, input),
    ].filter(Boolean).join(' ');
}

function formatSettings(edition, input) {
    const model = (edition.models || []).find((m) => m.id === input.modelId);
    const resolution = (edition.resolutions || []).find((r) => r.id === input.resolutionId);
    const length = (edition.lengths || []).find((l) => l.id === input.lengthId);
    const lines = [];
    lines.push('Model: ' + (model ? model.label : (input.modelId || '')));
    if (resolution) lines.push('Resolution: ' + resolution.width + 'x' + resolution.height);
    if (length) lines.push('Length: ' + length.frames + ' frames @ ' + length.fps + ' fps (' + length.label + ')');
    lines.push('Steps: ' + input.steps);
    lines.push('CFG: ' + input.cfg);
    if (input.guidance !== null && input.guidance !== undefined && input.guidance !== '') {
        lines.push('Guidance: ' + input.guidance);
    }
    lines.push('Sampler: ' + (input.sampler || ''));
    lines.push('Scheduler: ' + (input.scheduler || ''));
    lines.push('Seed: ' + input.seed);
    (input.loras || []).forEach((lora, i) => {
        if (!lora || !String(lora.name || '').trim()) return;
        const n = i + 1;
        lines.push('LoRA ' + n + ': ' + String(lora.name).trim() + ' @ ' + lora.weight);
        if (String(lora.trigger || '').trim()) lines.push('LoRA ' + n + ' trigger: ' + String(lora.trigger).trim());
    });
    const negative = String(input.negative || '').trim();
    if (negative && Number(input.cfg) > 1) lines.push('Negative: ' + negative);
    return lines.join('\n');
}

function createPromptEngine(edition) {
    const expandPrompt = (text, voice) => {
        const audioBlock = `${edition.baseAudioBlock} ${voice}`;
        let out = String(text)
            .replace(/\[ETHICAL_PREFIX\]/g, edition.ethicalPrefix)
            .replace(/\[AUDIO_BLOCK\]/g, audioBlock)
            .replace(/\[CONTINUITY_LOCK\]/g, edition.continuityLock);
        for (const token of DODGE_TOKENS) {
            out = out.replace(token, edition.dodgeLayer);
        }
        return out;
    };

    const composePrompt = (parts, { isSpicyMode = false, aspectRatio = null } = {}) => {
        const core = parts.filter(Boolean).map((p) => String(p).trim()).filter(Boolean).join(', ');
        let display = isSpicyMode ? `${edition.modePrefix}: ${core}` : core;
        if (aspectRatio) display += ` --ar ${aspectRatio}`;
        return display;
    };

    const toPrompt = (parts, options) => {
        const display = composePrompt(parts, options);
        return { display, raw: expandPrompt(display, options.voice) };
    };

    const copyText = (text, onSuccess) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textArea);
    };

    const sanitizeText = (text) => {
        let newText = text;
        let count = 0;
        for (const { risk, safe } of edition.riskyReplacements || []) {
            const next = newText.replace(risk, safe);
            if (next !== newText) {
                count += 1;
                newText = next;
            }
        }
        return { text: newText, changed: count > 0 || newText !== text };
    };

    const buildPromptParts = ({
        styleId,
        boosterIds,
        isSpicyMode,
        useContinuity,
        subject,
        useDodge,
        useAudio,
    }) => {
        const parts = [];
        const styleObj = edition.artStyles.find((s) => s.id === styleId);
        if (styleObj) parts.push(styleObj.prompt);

        boosterIds.forEach((bId) => {
            const booster = edition.styleBoosters.find((b) => b.id === bId);
            if (booster) parts.push(booster.prompt);
        });

        if (isSpicyMode) parts.push('[ETHICAL_PREFIX]');
        if (useContinuity) parts.push('[CONTINUITY_LOCK]');
        if (subject) parts.push(subject);
        if (useDodge) parts.push('[DODGE_LAYER]');
        if (useAudio) parts.push('[AUDIO_BLOCK]');
        return parts;
    };

    const composeScene = (input) => {
        const kind = edition.composer === 'ltx' ? 'ltx' : 'flux';
        const prompt = kind === 'ltx' ? composeLtx(edition, input) : composeFlux(edition, input);
        const settings = formatSettings(edition, input);
        return { prompt, settings, display: prompt, raw: prompt };
    };

    const composeShots = (input) => {
        return (edition.shotPhases || []).map((phase) => {
            const subject = [sentence(input.subject), sentence(phase.beat)].filter(Boolean).join(' ');
            const shot = composeScene({ ...input, subject });
            return { title: phase.title, prompt: shot.prompt, display: shot.prompt, raw: shot.prompt };
        });
    };

    return {
        expandPrompt,
        composePrompt,
        toPrompt,
        copyText,
        sanitizeText,
        buildPromptParts,
        composeScene,
        composeShots,
        formatSettings,
        sheetParts,
    };
}

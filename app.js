const { useState, useMemo, useEffect } = React;

const GROK_TABS = { builder: BuilderTab, sequence: SequenceTab, logger: LoggerTab, resources: ResourcesTab };
const LOCAL_TABS = { builder: LocalBuilderTab, sequence: LocalSequenceTab, logger: LocalLoggerTab, resources: LocalResourcesTab };

function App({ edition: baseEdition }) {
    const isGrok = (baseEdition.composer || 'grok') === 'grok';
    const logKey = baseEdition.logStorageKey || 'grok_logs';

    const [subject, setSubject] = useState('');
    const [isSpicyMode, setIsSpicyMode] = useState(isGrok);
    const [selectedStyle, setSelectedStyle] = useState(baseEdition.defaultStyle || (baseEdition.activeArtStyles[0] && baseEdition.activeArtStyles[0].id) || 'anime');
    const [selectedBoosters, setSelectedBoosters] = useState([]);
    const [useDodge, setUseDodge] = useState(isGrok);
    const [useAudio, setUseAudio] = useState(isGrok);
    const [selectedVoice, setSelectedVoice] = useState((baseEdition.voiceTypes && baseEdition.voiceTypes[0]) || '');
    const [useContinuity, setUseContinuity] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [activeTab, setActiveTab] = useState('builder');
    const [copied, setCopied] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSanitized, setIsSanitized] = useState(false);
    const [masterPack, setMasterPack] = useState([]);
    const [packStatus, setPackStatus] = useState(baseEdition.masterPackUrl ? 'loading' : 'ready');
    const [scene, setScene] = useState(() => defaultScene(baseEdition));
    const [sequenceShots, setSequenceShots] = useState([]);
    const [packNonce, setPackNonce] = useState(0);
    const [library, setLibrary] = useState({
        styles: baseEdition.artStyles,
        boosters: baseEdition.styleBoosters,
        characters: [],
        templates: [],
        packs: [],
        status: baseEdition.manifestUrl ? 'loading' : 'ready',
    });

    const [logs, setLogs] = useState(() => {
        try {
            const saved = localStorage.getItem(logKey);
            const parsed = saved ? JSON.parse(saved) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    });
    const [newLog, setNewLog] = useState({
        style: baseEdition.defaultStyle || 'anime',
        result: 'Pass',
        speed: 'Fast',
        notes: '',
        rating: null,
        prompt: '',
        settings: '',
        seed: '',
        model: '',
        loras: '',
    });
    const [sequenceBase, setSequenceBase] = useState('');
    const [sequencePrompts, setSequencePrompts] = useState([]);

    const edition = useMemo(() => ({
        ...baseEdition,
        artStyles: library.styles,
        styleBoosters: library.boosters,
        activeArtStyles: (library.styles || []).filter((style) => !(baseEdition.excludedStyleIds || []).includes(style.id)),
    }), [baseEdition, library]);

    const prompt = useMemo(() => createPromptEngine(edition), [edition]);

    useEffect(() => { localStorage.setItem(logKey, JSON.stringify(logs)); }, [logs, logKey]);

    useEffect(() => {
        if (!baseEdition.masterPackUrl) return undefined;
        let cancelled = false;
        fetch(baseEdition.masterPackUrl)
            .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
            .then((data) => {
                if (cancelled) return;
                setMasterPack(Array.isArray(data.prompts) ? data.prompts : []);
                setPackStatus('ready');
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to load master pack:', err);
                setPackStatus('error');
            });
        return () => { cancelled = true; };
    }, [baseEdition.masterPackUrl]);

    useEffect(() => {
        if (!baseEdition.manifestUrl) return undefined;
        let cancelled = false;
        fetchEditionLibrary(baseEdition.manifestUrl, baseEdition.edition)
            .then((result) => {
                if (cancelled) return;
                setLibrary({
                    styles: mergeById(baseEdition.artStyles, result.styleLists),
                    boosters: mergeById(baseEdition.styleBoosters, result.boosterLists),
                    characters: result.characters,
                    templates: result.templates,
                    packs: result.packs,
                    status: 'ready',
                });
            })
            .catch((err) => {
                if (cancelled) return;
                console.error('Failed to load packs:', err);
                setLibrary((prev) => ({ ...prev, status: 'error' }));
            });
        return () => { cancelled = true; };
    }, [baseEdition.manifestUrl, baseEdition.edition, packNonce]);

    const toggleBooster = (id) => {
        setSelectedBoosters((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])));
    };

    const scenePayload = () => ({
        styleId: selectedStyle,
        boosterIds: selectedBoosters,
        useCharacter: scene.useCharacter,
        character: scene.character,
        subject: scene.subject,
        camera: scene.camera,
        audio: scene.audio,
        useAudio: scene.useAudio,
        negative: scene.negative,
        modelId: scene.modelId,
        resolutionId: scene.resolutionId,
        lengthId: scene.lengthId,
        steps: scene.steps,
        cfg: scene.cfg,
        guidance: scene.guidance,
        sampler: scene.sampler,
        scheduler: scene.scheduler,
        seed: scene.seed,
        loras: scene.loras,
    });

    const loadTemplate = (t) => {
        if (isGrok) {
            const b = t.builder || {};
            const validStyles = edition.activeArtStyles.map((s) => s.id);
            setSelectedStyle(validStyles.includes(b.style_id) ? b.style_id : (edition.defaultStyle || 'anime'));
            setUseAudio(b.audio ?? String(t.type || '').toLowerCase().includes('video'));
            setUseDodge(b.dodge ?? true);
            setIsSpicyMode(b.spicy ?? true);
            setUseContinuity(b.continuity ?? false);
            setSelectedBoosters(Array.isArray(b.boosters) ? b.boosters : []);
            setSubject(b.subject || t.description || '');
            setShowTemplates(false);
            return;
        }
        const b = t.builder || {};
        const found = (library.characters || []).find((item) => item.id === t.character_id);
        const source = t.character || found;
        if (b.style_id && edition.activeArtStyles.some((style) => style.id === b.style_id)) setSelectedStyle(b.style_id);
        setSelectedBoosters(Array.isArray(b.boosters) ? b.boosters : []);
        setScene((prev) => ({
            ...prev,
            subject: b.subject || '',
            camera: b.camera || '',
            audio: b.audio || '',
            useAudio: edition.composer === 'ltx' && !!(b.audio && String(b.audio).trim()),
            useCharacter: !!source,
            sheetId: t.character_id || '',
            character: source ? copyCharacter(source) : prev.character,
        }));
        setShowTemplates(false);
    };

    const handleSanitize = () => {
        const { text, changed } = prompt.sanitizeText(subject);
        if (changed) {
            setSubject(text);
            setIsSanitized(true);
            setTimeout(() => setIsSanitized(false), 2000);
        }
    };

    const addLog = () => {
        const entry = { id: Date.now(), timestamp: new Date().toISOString(), ...newLog };
        setLogs([entry, ...logs]);
        setNewLog({ ...newLog, notes: '', prompt: '' });
    };

    const addSceneLog = (promptText, settingsText) => {
        const model = (edition.models || []).find((item) => item.id === scene.modelId);
        const loras = (scene.loras || []).filter((lora) => lora.name && String(lora.name).trim()).map((lora) => lora.name + ' @ ' + lora.weight).join(', ');
        setLogs([{
            id: Date.now(),
            timestamp: new Date().toISOString(),
            prompt: promptText,
            settings: settingsText,
            seed: scene.seed,
            model: model ? model.label : scene.modelId,
            loras,
            rating: null,
            notes: '',
            style: selectedStyle,
            result: '',
            speed: '',
        }, ...logs]);
    };

    const updateLog = (id, patch) => setLogs(logs.map((log) => (log.id === id ? { ...log, ...patch } : log)));
    const deleteLog = (id) => setLogs(logs.filter((log) => log.id !== id));

    const successRate = useMemo(() => {
        if (logs.length === 0) return 0;
        const wins = logs.filter((log) => log.result === 'Pass').length;
        return Math.round((wins / logs.length) * 100);
    }, [logs]);

    const templatePool = isGrok ? masterPack : library.templates;
    const filteredTemplates = useMemo(() => {
        const needle = searchTerm.toLowerCase();
        return (templatePool || []).filter((item) => {
            const blob = [item.name, item.prompt, item.summary, item.description, item.builder && item.builder.subject].join(' ').toLowerCase();
            return blob.includes(needle);
        });
    }, [searchTerm, templatePool]);

    const promptResult = useMemo(() => {
        if (!isGrok) return { display: '', raw: '' };
        const parts = prompt.buildPromptParts({
            styleId: selectedStyle,
            boosterIds: selectedBoosters,
            isSpicyMode,
            useContinuity,
            subject,
            useDodge,
            useAudio,
        });
        return prompt.toPrompt(parts, { isSpicyMode, aspectRatio, voice: selectedVoice });
    }, [prompt, selectedStyle, selectedBoosters, isSpicyMode, useContinuity, subject, useDodge, useAudio, aspectRatio, selectedVoice, isGrok]);

    const localResult = useMemo(() => (isGrok ? null : prompt.composeScene(scenePayload())), [prompt, scene, selectedStyle, selectedBoosters, isGrok]);

    const handleSequenceGenerate = () => {
        const stylePrompt = edition.artStyles.find((s) => s.id === selectedStyle)?.prompt || 'anime 8K';
        const boosterPrompts = selectedBoosters.map((bId) => edition.styleBoosters.find((b) => b.id === bId)?.prompt).filter(Boolean);
        const createPhase = (phaseSubject, { isFirst, isLast }) => {
            const parts = [];
            if (isFirst) {
                parts.push(stylePrompt);
                parts.push.apply(parts, boosterPrompts);
                if (isSpicyMode) parts.push('[ETHICAL_PREFIX]');
            } else {
                parts.push('[CONTINUITY_LOCK]');
            }
            parts.push(phaseSubject);
            if (!isLast && useDodge) parts.push('[DODGE_LAYER]');
            if (useAudio) parts.push('[AUDIO_BLOCK]');
            return prompt.toPrompt(parts, { isSpicyMode: isFirst && isSpicyMode, aspectRatio: isFirst ? aspectRatio : null, voice: selectedVoice });
        };
        setSequencePrompts([
            { title: 'Phase 1: Setup & Tease', ...createPhase(`${sequenceBase}. ${edition.phaseBlocks.TEASE}`, { isFirst: true, isLast: false }) },
            { title: 'Phase 2: Build & Rhythm', ...createPhase(`Intensify action: ${sequenceBase}, ${edition.phaseBlocks.BUILD}`, { isFirst: false, isLast: false }) },
            { title: 'Phase 3: Peak Ecstasy', ...createPhase(`Climax phase: ${edition.phaseBlocks.PEAK}`, { isFirst: false, isLast: false }) },
            { title: 'Phase 4: Aftercare Fade', ...createPhase(`Aftercare: ${edition.phaseBlocks.AFTERCARE}`, { isFirst: false, isLast: true }) },
        ]);
    };

    const handleLocalSequence = () => setSequenceShots(prompt.composeShots(scenePayload()));

    const handleCopy = () => {
        prompt.copyText(promptResult.raw, () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const clearAll = () => {
        setSubject('');
        setUseDodge(true);
        setUseAudio(false);
        setUseContinuity(false);
        setSelectedBoosters([]);
    };

    const clearScene = () => {
        setScene((prev) => ({ ...prev, subject: '', camera: '', audio: '', negative: '' }));
        setSelectedBoosters([]);
    };

    const togglePack = (id, enabled) => {
        writePackOverride(id, enabled);
        setPackNonce((n) => n + 1);
    };

    const ctx = {
        edition, prompt,
        subject, setSubject,
        isSpicyMode, setIsSpicyMode,
        selectedStyle, setSelectedStyle,
        selectedBoosters, toggleBooster,
        useDodge, setUseDodge,
        useAudio, setUseAudio,
        selectedVoice, setSelectedVoice,
        useContinuity, setUseContinuity,
        aspectRatio, setAspectRatio,
        activeTab, setActiveTab,
        copied, setCopied,
        showTemplates, setShowTemplates,
        searchTerm, setSearchTerm,
        isSanitized, setIsSanitized,
        masterPack, packStatus, filteredTemplates,
        loadTemplate, handleSanitize, handleCopy, clearAll,
        promptResult,
        sequenceBase, setSequenceBase,
        sequencePrompts, setSequencePrompts,
        handleSequenceGenerate,
        logs, setLogs, newLog, setNewLog,
        addLog, deleteLog, updateLog, successRate,
        scene, setScene, library, localResult, sequenceShots, setSequenceShots,
        handleLocalSequence, clearScene, addSceneLog, togglePack,
    };

    const ActiveTab = (isGrok ? GROK_TABS : LOCAL_TABS)[activeTab] || (isGrok ? BuilderTab : LocalBuilderTab);
    const nav = edition.editionNav || [];

    return (
        <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans">
            <header className="border-b border-gray-900 bg-black/80 backdrop-blur-md sticky top-0 z-50">
                {edition.contentNote && (
                    <div className="border-b border-gray-800 bg-gray-950 text-[11px] text-gray-300 text-center px-4 py-1.5">{edition.contentNote}</div>
                )}
                <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-sm font-bold text-xl font-mono">/</div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold tracking-tight text-white leading-none truncate">{edition.title}</h1>
                                <span className="text-[10px] text-gray-500 font-mono">{edition.versionLabel}</span>
                            </div>
                        </div>
                        {nav.length > 0 && (
                            <nav className="flex flex-wrap justify-end gap-1">
                                {nav.map((item) => (
                                    <a key={item.id} href={item.href} className={`text-[10px] px-2 py-1 rounded border ${item.id === edition.edition ? 'border-white text-white' : 'border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'}`}>{item.label}</a>
                                ))}
                            </nav>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => setActiveTab('builder')} className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeTab === 'builder' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>Builder</button>
                        <button onClick={() => setActiveTab('sequence')} className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${activeTab === 'sequence' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}><Film size={14} /> Sequence</button>
                        <button onClick={() => setActiveTab('logger')} className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${activeTab === 'logger' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}><Activity size={14} /> Logger</button>
                        <button onClick={() => setActiveTab('resources')} className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${activeTab === 'resources' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}><BookOpen size={14} /> {isGrok ? 'Guide Sources' : 'Packs'}</button>
                    </div>
                </div>
            </header>
            <main className="flex-grow flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
                <ActiveTab ctx={ctx} edition={edition} />
            </main>
            <footer className="border-t border-gray-900 mt-auto py-6">
                <div className="max-w-6xl mx-auto px-4 flex justify-between items-center text-[10px] text-gray-600 gap-4">
                    <p>{edition.footerNote || 'Community Tool • Not official xAI software'}</p>
                    <p>Last refreshed: {edition.footerDate}</p>
                </div>
            </footer>
        </div>
    );
}

function AppRoot() {
    const [edition, setEdition] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const promise = window.GROK_ARCHITECT_CONFIG_PROMISE || Promise.resolve(window.GROK_ARCHITECT_CONFIG);
        promise
            .then((cfg) => {
                window.GROK_ARCHITECT_CONFIG = cfg;
                setEdition(resolveAppConfig(cfg));
            })
            .catch((err) => setError(err.message || String(err)));
    }, []);

    if (error) {
        return <div className="min-h-screen bg-black text-red-400 flex items-center justify-center p-8 text-sm">{error}</div>;
    }
    if (!edition) {
        return <div className="min-h-screen bg-black text-gray-500 flex items-center justify-center text-sm">Loading…</div>;
    }
    return <App edition={edition} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<AppRoot />);

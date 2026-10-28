function LocalSettingsForm({ edition, scene, setScene }) {
    const model = (edition.models || []).find((item) => item.id === scene.modelId);
    const length = (edition.lengths || []).find((item) => item.id === scene.lengthId);
    const set = (key) => (value) => setScene((prev) => ({ ...prev, [key]: value }));
    const setNumber = (key) => (value) => setScene((prev) => ({ ...prev, [key]: value === '' ? '' : Number(value) }));

    const updateLora = (index, patch) => {
        setScene((prev) => {
            const loras = prev.loras.map((lora, i) => (i === index ? { ...lora, ...patch } : lora));
            return { ...prev, loras };
        });
    };

    return (
        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><Settings size={12} /> Sampling settings</label>
            <label className="block">
                <span className="block text-[10px] text-gray-500 mb-1">Model</span>
                <select
                    value={scene.modelId}
                    onChange={(e) => setScene((prev) => applyModelPreset(edition, prev, e.target.value))}
                    className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2 focus:outline-none focus:border-gray-500"
                >
                    {(edition.models || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {model && model.note && <p className="text-[10px] text-gray-500 mt-1 leading-snug">{model.note}</p>}
            </label>
            <label className="block">
                <span className="block text-[10px] text-gray-500 mb-1">Resolution</span>
                <select
                    value={scene.resolutionId}
                    onChange={(e) => set('resolutionId')(e.target.value)}
                    className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2 focus:outline-none focus:border-gray-500"
                >
                    {(edition.resolutions || []).map((item) => (
                        <option key={item.id} value={item.id}>{item.label} · {item.aspect}</option>
                    ))}
                </select>
                {edition.resolutionNote && <p className="text-[10px] text-gray-500 mt-1 leading-snug">{edition.resolutionNote}</p>}
            </label>
            {(edition.lengths || []).length > 0 && (
                <label className="block">
                    <span className="block text-[10px] text-gray-500 mb-1">Target length</span>
                    <select
                        value={scene.lengthId}
                        onChange={(e) => set('lengthId')(e.target.value)}
                        className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2 focus:outline-none focus:border-gray-500"
                    >
                        {edition.lengths.map((item) => (
                            <option key={item.id} value={item.id}>{item.frames} frames · {item.label}</option>
                        ))}
                    </select>
                    {length && length.hint && <p className="text-[10px] text-gray-500 mt-1 leading-snug">{length.hint}</p>}
                </label>
            )}
            <div className="grid grid-cols-2 gap-2">
                <LocalField label="Steps" type="number" value={scene.steps} onChange={setNumber('steps')} />
                <LocalField label="CFG" type="number" value={scene.cfg} onChange={setNumber('cfg')} />
                <LocalField label="Guidance" type="number" value={scene.guidance == null ? '' : scene.guidance} onChange={setNumber('guidance')} placeholder="FluxGuidance" />
                <LocalField label="Seed" type="number" value={scene.seed} onChange={setNumber('seed')} />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <label className="block">
                    <span className="block text-[10px] text-gray-500 mb-1">Sampler</span>
                    <select value={scene.sampler} onChange={(e) => set('sampler')(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2">
                        {(edition.samplers || []).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="block text-[10px] text-gray-500 mb-1">Scheduler</span>
                    <select value={scene.scheduler} onChange={(e) => set('scheduler')(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2">
                        {(edition.schedulers || []).map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </label>
            </div>
            <button type="button" onClick={() => setScene((prev) => ({ ...prev, seed: randomSeed() }))} className="text-[10px] text-gray-400 hover:text-white">New seed</button>
            <div className="space-y-2 pt-2 border-t border-gray-800">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">LoRAs</div>
                {scene.loras.map((lora, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 bg-black/20 border border-gray-800 rounded-lg p-2">
                        <LocalField label="LoRA name" value={lora.name} onChange={(value) => updateLora(index, { name: value })} placeholder="silk-robe.safetensors" />
                        <LocalField label="Trigger words" value={lora.trigger} onChange={(value) => updateLora(index, { trigger: value })} placeholder="optional trigger" />
                        <LocalField label="Weight" type="number" value={lora.weight} onChange={(value) => updateLora(index, { weight: value === '' ? '' : Number(value) })} />
                    </div>
                ))}
                {scene.loras.length < 3 && (
                    <button
                        type="button"
                        onClick={() => setScene((prev) => ({ ...prev, loras: prev.loras.concat([{ name: '', trigger: '', weight: 0.8 }]) }))}
                        className="text-[10px] text-gray-400 hover:text-white"
                    >
                        Add LoRA
                    </button>
                )}
            </div>
            {edition.composer === 'flux' && (
                <details className="border border-gray-800 rounded-lg p-3">
                    <summary className="text-xs text-gray-300 cursor-pointer">Advanced negative</summary>
                    <p className="text-[10px] text-gray-500 mt-2 leading-snug">
                        FLUX.1 dev, schnell, and the usual FLUX.2 path run at CFG 1, where a negative prompt is ignored. This text is copied into the settings block only when CFG is above 1.
                    </p>
                    <textarea
                        value={scene.negative}
                        onChange={(e) => set('negative')(e.target.value)}
                        placeholder="Only for a real CFG workflow"
                        className="mt-2 w-full bg-black/40 border border-gray-700 rounded p-2 text-xs text-white min-h-[64px] focus:outline-none focus:border-gray-500"
                    />
                    <p className="text-[10px] mt-1 text-gray-500">{Number(scene.cfg) > 1 ? 'CFG is above 1, so this negative will be included in the settings block.' : 'CFG is 1, so this negative stays out of the settings block.'}</p>
                </details>
            )}
        </div>
    );
}

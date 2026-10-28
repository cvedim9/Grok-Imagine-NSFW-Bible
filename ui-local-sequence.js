function LocalSequenceTab({ ctx }) {
    const {
        edition, scene, setScene, selectedStyle, setSelectedStyle, selectedBoosters, toggleBooster,
        sequenceShots, setSequenceShots, handleLocalSequence, prompt, library, localResult,
    } = ctx;
    const sheet = sheetParts(scene.character, scene.useCharacter);
    const canGenerate = !!(scene.subject.trim() || (scene.useCharacter && scene.character.name.trim()));

    return (
        <>
            <div className="flex-grow space-y-6">
                <section className="space-y-4 bg-gray-900/20 border border-gray-800 p-4 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Look</label>
                            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2">
                                {edition.activeArtStyles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 mb-2">Boosters</label>
                            <LocalBoosterGrid boosters={edition.styleBoosters} selectedBoosters={selectedBoosters} toggleBooster={toggleBooster} />
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Film size={14} /> {edition.composer === 'ltx' ? 'Shot action' : 'Shared action'}
                    </label>
                    <textarea
                        value={scene.subject}
                        onChange={(e) => setScene((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder={edition.sequencePlaceholder}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 min-h-[80px] font-mono"
                    />
                    <details className="bg-gray-900/30 border border-gray-800 rounded-lg p-3">
                        <summary className="text-xs text-gray-300 cursor-pointer">Character sheet used on every {edition.composer === 'ltx' ? 'clip' : 'still'}</summary>
                        <div className="mt-3">
                            <CharacterSheetFields scene={scene} setScene={setScene} characters={library.characters || []} />
                        </div>
                    </details>
                    <div className="bg-black/40 border border-gray-800 rounded-lg p-3">
                        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Continuity line</div>
                        <p className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap">{sheet.identity || 'No identity line yet.'}</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLocalSequence}
                        disabled={!canGenerate}
                        className={`w-full py-3 rounded-lg font-bold text-sm ${canGenerate ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}
                    >
                        {edition.sequenceButton}
                    </button>
                </section>

                {sequenceShots.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-xs text-gray-500 uppercase font-semibold">{edition.composer === 'ltx' ? 'Shot list' : 'Still series'}</div>
                            <button
                                type="button"
                                onClick={() => prompt.copyText(sequenceShots.map((shot, i) => (i + 1) + '. ' + shot.title + '\n' + shot.prompt).join('\n\n'))}
                                className="text-[10px] bg-gray-800 hover:bg-white hover:text-black text-gray-300 px-2 py-1 rounded"
                            >
                                Copy all prompts
                            </button>
                        </div>
                        {sequenceShots.map((shot, idx) => (
                            <div key={shot.title} className="bg-gray-900/40 border border-gray-800 rounded-lg overflow-hidden">
                                <div className="bg-gray-900/80 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-300">{shot.title}</span>
                                    <button type="button" onClick={() => prompt.copyText(shot.prompt)} className="text-[10px] bg-gray-800 hover:bg-white hover:text-black text-gray-300 px-2 py-1 rounded">Copy prompt</button>
                                </div>
                                <textarea
                                    className="w-full bg-transparent p-3 text-[11px] font-mono text-gray-200 focus:outline-none resize-y min-h-[120px]"
                                    value={shot.prompt}
                                    onChange={(e) => {
                                        const next = sequenceShots.slice();
                                        next[idx] = { ...shot, prompt: e.target.value, display: e.target.value, raw: e.target.value };
                                        setSequenceShots(next);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="lg:w-80 flex-shrink-0 flex flex-col gap-4">
                <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-gray-300">{edition.composer === 'ltx' ? 'One clip per shot' : 'One still per beat'}</h3>
                    <ul className="space-y-2">
                        {(edition.sequenceNotes || []).map((note) => (
                            <li key={note.title} className="text-[10px] text-gray-500"><span className="text-gray-200 font-bold block">{note.title}</span>{note.text}</li>
                        ))}
                    </ul>
                    {localResult && (
                        <div>
                            <div className="text-[10px] uppercase text-gray-500 mb-1">Shared settings</div>
                            <pre className="text-[10px] text-sky-100/80 font-mono whitespace-pre-wrap">{localResult.settings}</pre>
                            <button type="button" onClick={() => prompt.copyText(localResult.settings)} className="mt-2 text-[10px] text-gray-300 underline">Copy settings</button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

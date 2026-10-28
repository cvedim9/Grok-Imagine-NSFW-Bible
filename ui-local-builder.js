function LocalBuilderTab({ ctx }) {
    const {
        edition, scene, setScene, selectedStyle, setSelectedStyle, selectedBoosters, toggleBooster,
        showTemplates, setShowTemplates, searchTerm, setSearchTerm, library, filteredTemplates,
        loadTemplate, localResult, prompt, clearScene, addSceneLog,
    } = ctx;
    const packReady = library.status === 'ready';
    const templateCount = (library.templates || []).length;

    return (
        <>
            <div className="flex-grow space-y-6">
                <section className="space-y-4 bg-gray-900/20 border border-gray-800 p-4 rounded-xl">
                    <div className="text-xs font-semibold text-gray-500 uppercase">Base look</div>
                    <LocalStylePicker styles={edition.activeArtStyles} selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle} />
                    <div className="space-y-2 pt-2 border-t border-gray-800/50">
                        <span className="text-sm text-gray-300 flex items-center gap-2"><Wand2 size={12} className="text-purple-400" /> Visual boosters</span>
                        <LocalBoosterGrid boosters={edition.styleBoosters} selectedBoosters={selectedBoosters} toggleBooster={toggleBooster} />
                    </div>
                </section>

                <section className="space-y-3 bg-gray-900/20 border border-gray-800 p-4 rounded-xl">
                    <div className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2"><Repeat size={12} /> Character sheet</div>
                    <p className="text-[11px] text-gray-500 leading-snug">Face, body, hair, wardrobe, setting, and lighting are repeated word for word so identity stays stable across stills and shots.</p>
                    <CharacterSheetFields scene={scene} setScene={setScene} characters={library.characters || []} />
                </section>

                <section className="space-y-3">
                    <div className="flex justify-between items-end gap-2">
                        <label className="text-sm font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2"><Terminal size={14} /> {edition.composer === 'ltx' ? 'Action' : 'Subject'}</label>
                        <button
                            type="button"
                            onClick={() => setShowTemplates(!showTemplates)}
                            disabled={!packReady || templateCount === 0}
                            className={`text-xs px-3 py-1 rounded flex items-center gap-1 ${packReady && templateCount ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-900 text-gray-600'}`}
                        >
                            <BookOpen size={12} /> Templates ({library.status === 'loading' ? '…' : templateCount})
                        </button>
                    </div>
                    {library.status === 'error' && (
                        <div className="text-xs text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg p-3">
                            Could not load packs. Serve this folder over HTTP so <span className="font-mono">{edition.manifestUrl}</span> can be fetched.
                        </div>
                    )}
                    {showTemplates && packReady && (
                        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                            <div className="p-3 border-b border-gray-800 flex gap-2">
                                <Search size={16} className="text-gray-500" />
                                <input
                                    type="text"
                                    placeholder={`Search ${templateCount} templates...`}
                                    className="bg-transparent border-none focus:outline-none text-sm text-white w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                                {filteredTemplates.map((item, idx) => (
                                    <button key={(item.packId || 'pack') + '-' + (item.number || idx)} type="button" onClick={() => loadTemplate(item)} className="text-left p-2 hover:bg-gray-800 rounded border border-transparent hover:border-gray-700">
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <span className="text-xs font-bold text-white truncate">{item.name}</span>
                                            <span className="text-[9px] text-gray-500 uppercase border border-gray-700 rounded px-1">{item.type || edition.composer}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 line-clamp-2">{item.summary || item.prompt}</div>
                                    </button>
                                ))}
                                {filteredTemplates.length === 0 && <div className="col-span-2 p-4 text-center text-xs text-gray-500">No matching templates.</div>}
                            </div>
                        </div>
                    )}
                    <textarea
                        value={scene.subject}
                        onChange={(e) => setScene((prev) => ({ ...prev, subject: e.target.value }))}
                        placeholder={edition.subjectPlaceholder}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 min-h-[100px] font-mono"
                    />
                    <div className="flex flex-wrap gap-2">
                        {(edition.shotPhases || []).map((phase) => (
                            <button
                                key={phase.id}
                                type="button"
                                onClick={() => setScene((prev) => ({ ...prev, subject: prev.subject ? prev.subject.replace(/\s+$/, '') + ' ' + phase.beat : phase.beat }))}
                                className="text-xs bg-gray-900 border border-gray-700 px-3 py-1.5 rounded text-gray-300 hover:text-white hover:border-gray-500"
                            >
                                {phase.title}
                            </button>
                        ))}
                    </div>
                    <label className="block text-[10px] text-gray-500 uppercase">{edition.composer === 'ltx' ? 'Camera movement' : 'Composition and camera'}</label>
                    <textarea
                        value={scene.camera}
                        onChange={(e) => setScene((prev) => ({ ...prev, camera: e.target.value }))}
                        placeholder={edition.cameraPlaceholder}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 min-h-[72px] font-mono"
                    />
                    {edition.composer === 'ltx' && (
                        <div className={`p-3 rounded-lg border ${scene.useAudio ? 'bg-gray-800/50 border-gray-600' : 'border-gray-800'}`}>
                            <button type="button" onClick={() => setScene((prev) => ({ ...prev, useAudio: !prev.useAudio }))} className="text-xs font-bold text-gray-200 flex items-center gap-2">
                                <Music size={14} className={scene.useAudio ? 'text-pink-400' : 'text-gray-600'} /> Audio / ambience {scene.useAudio ? 'on' : 'off'}
                            </button>
                            {scene.useAudio && (
                                <textarea
                                    value={scene.audio}
                                    onChange={(e) => setScene((prev) => ({ ...prev, audio: e.target.value }))}
                                    placeholder={edition.audioPlaceholder}
                                    className="mt-2 w-full bg-black/40 border border-gray-700 rounded p-2 text-xs text-white min-h-[60px] font-mono focus:outline-none"
                                />
                            )}
                            <p className="text-[10px] text-gray-500 mt-2">One line inside the same paragraph, for LTX-2 clips that generate sound.</p>
                        </div>
                    )}
                </section>
            </div>
            <div className="lg:w-96 flex-shrink-0 flex flex-col gap-4">
                <LocalOutputPanel
                    edition={edition}
                    result={localResult}
                    onCopy={prompt.copyText}
                    onLog={addSceneLog}
                    onClear={clearScene}
                />
                <LocalSettingsForm edition={edition} scene={scene} setScene={setScene} />
            </div>
        </>
    );
}

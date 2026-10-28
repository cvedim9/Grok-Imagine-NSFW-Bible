function LocalResourcesTab({ ctx }) {
    const { edition, library, togglePack } = ctx;
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-2">Fictional adults only</h2>
                <p className="text-sm text-gray-300">{edition.contentNote}</p>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-200 mb-3">How this edition writes</h3>
                <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                    {(edition.principles || []).map((item) => (
                        <li key={item.title}><strong className="text-gray-200">{item.title}:</strong> {item.text}</li>
                    ))}
                </ul>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-gray-200 mb-3">My packs</h3>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                    Drop a JSON file in <span className="font-mono text-gray-300">packs/</span> and add a line to <span className="font-mono text-gray-300">packs/manifest.json</span>. The schema is in <a className="text-blue-400 underline" href="docs/pack-schema.md">docs/pack-schema.md</a>. Disabled packs stay out until you turn them on.
                </p>
                <div className="space-y-2">
                    {(library.packs || []).map((pack) => (
                        <label key={pack.id} className="flex items-center justify-between gap-3 bg-black/30 border border-gray-800 rounded-lg px-3 py-2 text-xs">
                            <span>
                                <span className="text-white">{pack.label}</span>
                                <span className="block text-[10px] text-gray-500 font-mono">{pack.file} · {pack.status}</span>
                                {pack.error && <span className="block text-[10px] text-red-400">{pack.error}</span>}
                            </span>
                            <input type="checkbox" checked={!!pack.enabled} onChange={(e) => togglePack(pack.id, e.target.checked)} />
                        </label>
                    ))}
                    {library.status === 'loading' && <p className="text-xs text-gray-500">Loading packs…</p>}
                    {library.status === 'error' && <p className="text-xs text-red-400">The pack manifest did not load. Use a local HTTP server, not a file:// URL.</p>}
                </div>
            </div>
            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-gray-200">Sources</h3>
                {(edition.sources || []).map((source) => (
                    <a key={source.url} href={source.url} target={source.url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="block p-3 bg-black/40 border border-gray-800 rounded hover:border-gray-600">
                        <span className="text-sm text-blue-400">{source.title}</span>
                        <span className="block text-[10px] text-gray-600 font-mono truncate">{source.url}</span>
                    </a>
                ))}
            </div>
        </div>
    );
}

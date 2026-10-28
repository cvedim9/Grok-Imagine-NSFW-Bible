function LocalLoggerTab({ ctx }) {
    const { logs, setLogs, newLog, setNewLog, addLog, deleteLog, updateLog } = ctx;
    const rated = logs.filter((log) => Number(log.rating) > 0);
    const average = rated.length ? Math.round((rated.reduce((sum, log) => sum + Number(log.rating), 0) / rated.length) * 10) / 10 : 0;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Logged prompts</div>
                    <div className="text-2xl font-bold text-white">{logs.length}</div>
                </div>
                <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">Average rating</div>
                    <div className="text-2xl font-bold text-white">{rated.length ? average : '—'}</div>
                </div>
                <div className="bg-gray-900/40 border border-gray-800 p-4 rounded-xl">
                    <div className="text-[10px] font-bold text-gray-500 uppercase">With a LoRA</div>
                    <div className="text-2xl font-bold text-white">{logs.filter((log) => log.loras).length}</div>
                </div>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-3">
                <h2 className="text-sm font-bold text-white">Log a generation</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <LocalField label="Model" value={newLog.model || ''} onChange={(value) => setNewLog({ ...newLog, model: value })} placeholder="FLUX.1 [dev]" />
                    <LocalField label="Seed" value={newLog.seed || ''} onChange={(value) => setNewLog({ ...newLog, seed: value })} />
                    <LocalField label="LoRAs" value={newLog.loras || ''} onChange={(value) => setNewLog({ ...newLog, loras: value })} placeholder="name @ weight" />
                    <label className="block">
                        <span className="block text-[10px] text-gray-500 mb-1">Rating</span>
                        <select value={newLog.rating || ''} onChange={(e) => setNewLog({ ...newLog, rating: e.target.value ? Number(e.target.value) : null })} className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2">
                            <option value="">Unrated</option>
                            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>
                </div>
                <textarea value={newLog.prompt || ''} onChange={(e) => setNewLog({ ...newLog, prompt: e.target.value })} placeholder="Prompt text" className="w-full bg-black/30 border border-gray-800 rounded p-2 text-xs text-gray-200 min-h-[70px] font-mono" />
                <input value={newLog.notes || ''} onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })} placeholder="Notes" className="w-full bg-black/20 border border-gray-800 text-xs text-gray-300 rounded p-2" />
                <button type="button" onClick={addLog} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-xs">Log entry</button>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-300">History</h3>
                    <button type="button" onClick={() => { if (confirm('Clear history?')) setLogs([]); }} className="text-[10px] text-red-400">Clear history</button>
                </div>
                <div className="divide-y divide-gray-800">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 space-y-2">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                <span className="font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                                <span>{log.model || '—'}</span>
                                <span className="font-mono">seed {log.seed || '—'}</span>
                                <span>{log.loras || 'no LoRA'}</span>
                                <select value={log.rating || ''} onChange={(e) => updateLog(log.id, { rating: e.target.value ? Number(e.target.value) : null })} className="bg-black/40 border border-gray-700 rounded px-1 py-0.5 text-xs">
                                    <option value="">Rate</option>
                                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                                </select>
                                <button type="button" onClick={() => deleteLog(log.id)} className="ml-auto text-gray-600 hover:text-red-400"><Trash2 size={14} /></button>
                            </div>
                            <p className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap">{log.prompt || '—'}</p>
                            {log.settings && <pre className="text-[10px] text-sky-100/70 font-mono whitespace-pre-wrap">{log.settings}</pre>}
                            {log.notes && <p className="text-[11px] text-gray-500">{log.notes}</p>}
                        </div>
                    ))}
                    {logs.length === 0 && <div className="p-8 text-center text-xs text-gray-600">No logs yet. Save a prompt from the builder.</div>}
                </div>
            </div>
        </div>
    );
}

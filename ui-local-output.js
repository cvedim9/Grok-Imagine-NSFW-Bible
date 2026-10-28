function LocalOutputPanel({ edition, result, onCopy, onLog, onClear }) {
    const [copied, setCopied] = React.useState('');
    const [logged, setLogged] = React.useState(false);
    const copy = (key, text) => {
        onCopy(text, () => {
            setCopied(key);
            setTimeout(() => setCopied(''), 1600);
        });
    };
    const promptText = result ? result.prompt : '';
    const settingsText = result ? result.settings : '';
    return (
        <div>
            <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-white to-sky-500 opacity-60"></div>
                <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompt</span>
                    {copied === 'prompt' && <span className="text-xs text-green-400">Copied</span>}
                </div>
                <div className="bg-black rounded-lg p-3 border border-gray-800 min-h-[120px] mb-3">
                    <p className="font-mono text-[11px] text-gray-200 whitespace-pre-wrap leading-relaxed">{promptText || 'The prompt will read as sentences: subject, then the rest of the frame.'}</p>
                </div>
                <button type="button" onClick={() => copy('prompt', promptText)} className="w-full bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded-lg text-sm mb-4">Copy prompt</button>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settings</span>
                    {copied === 'settings' && <span className="text-xs text-green-400">Copied</span>}
                </div>
                <pre className="bg-black rounded-lg p-3 border border-gray-800 text-[11px] text-sky-100/90 font-mono whitespace-pre-wrap mb-3">{settingsText}</pre>
                <div className="flex gap-2">
                    <button type="button" onClick={() => copy('settings', settingsText)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg text-xs">Copy settings</button>
                    <button type="button" onClick={() => copy('both', promptText + '\n\n' + settingsText)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg text-xs">{copied === 'both' ? 'Copied' : 'Copy both'}</button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => { onLog(promptText, settingsText); setLogged(true); setTimeout(() => setLogged(false), 1600); }}
                        className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-2 rounded-lg text-xs"
                    >
                        {logged ? 'Saved to logger' : 'Save to logger'}
                    </button>
                    <button type="button" onClick={onClear} className="border border-gray-800 text-gray-500 hover:text-red-300 px-3 rounded-lg text-xs">Clear scene</button>
                </div>
            </div>
            <p className="mt-3 text-[10px] text-gray-600 px-1 leading-relaxed">
                {edition.composer === 'ltx'
                    ? 'One paragraph, present tense, in time order. The character lines stay identical on every shot.'
                    : 'Sentences, subject first. No quality-tag list and no negative text in the prompt.'}
            </p>
        </div>
    );
}

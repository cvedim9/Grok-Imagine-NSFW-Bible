function LocalField({ label, value, onChange, placeholder, type }) {
    return (
        <label className="block">
            <span className="block text-[10px] text-gray-500 mb-1">{label}</span>
            <input
                type={type || 'text'}
                value={value == null ? '' : value}
                placeholder={placeholder || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-black/40 border border-gray-700 text-xs text-white rounded p-2 focus:outline-none focus:border-gray-500"
            />
        </label>
    );
}

function LocalStylePicker({ styles, selectedStyle, setSelectedStyle }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(styles || []).map((style) => (
                <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`px-3 py-2 rounded-md text-xs text-left transition-all border ${selectedStyle === style.id ? 'bg-gray-800 border-white text-white' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-700'}`}
                >
                    {style.label}
                </button>
            ))}
        </div>
    );
}

function LocalBoosterGrid({ boosters, selectedBoosters, toggleBooster }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(boosters || []).map((booster) => {
                const on = selectedBoosters.includes(booster.id);
                return (
                    <button
                        key={booster.id}
                        type="button"
                        onClick={() => toggleBooster(booster.id)}
                        className={`px-3 py-2 rounded-md text-xs text-left transition-all border flex items-center justify-between ${on ? 'bg-purple-900/30 border-purple-500 text-purple-200' : 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-700'}`}
                    >
                        <span>{booster.label}</span>
                        {on && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                    </button>
                );
            })}
        </div>
    );
}

function CharacterSheetFields({ scene, setScene, characters }) {
    const character = scene.character || {};
    const setKey = (key) => (value) => {
        setScene((prev) => ({
            ...prev,
            sheetId: '',
            character: { ...prev.character, [key]: value },
        }));
    };
    const pick = (id) => {
        const found = (characters || []).find((item) => item.id === id);
        if (!found) {
            setScene((prev) => ({ ...prev, sheetId: '' }));
            return;
        }
        setScene((prev) => ({
            ...prev,
            sheetId: id,
            useCharacter: true,
            character: copyCharacter(found),
        }));
    };
    const sheet = sheetParts(character, true);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setScene((prev) => ({ ...prev, useCharacter: !prev.useCharacter }))}
                    className={`text-xs px-2 py-1 rounded border ${scene.useCharacter ? 'bg-green-500/15 border-green-600 text-green-200' : 'border-gray-700 text-gray-500'}`}
                >
                    {scene.useCharacter ? 'Sheet on' : 'Sheet off'}
                </button>
                {(characters || []).length > 0 && (
                    <select
                        value={scene.sheetId || ''}
                        onChange={(e) => pick(e.target.value)}
                        className="bg-black/40 border border-gray-700 text-xs text-white rounded p-1.5 focus:outline-none focus:border-gray-500"
                    >
                        <option value="">Custom sheet</option>
                        {characters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <LocalField label="Name" value={character.name} onChange={setKey('name')} placeholder="Mara Voss" />
                <LocalField label="Face" value={character.face} onChange={setKey('face')} placeholder="oval face, grey-green eyes" />
                <LocalField label="Body" value={character.body} onChange={setKey('body')} placeholder="adult woman in her thirties, tall" />
                <LocalField label="Hair" value={character.hair} onChange={setKey('hair')} placeholder="dark auburn, shoulder-length waves" />
                <LocalField label="Wardrobe" value={character.wardrobe} onChange={setKey('wardrobe')} placeholder="an open black silk robe" />
                <LocalField label="Setting" value={character.setting} onChange={setKey('setting')} placeholder="a candlelit bedroom" />
                <div className="sm:col-span-2">
                    <LocalField label="Lighting" value={character.lighting} onChange={setKey('lighting')} placeholder="warm candlelight from camera left" />
                </div>
            </div>
            <div className="bg-black/40 border border-gray-800 rounded-lg p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">Copied unchanged</div>
                <p className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {scene.useCharacter && (sheet.identity || sheet.setting || sheet.lighting)
                        ? [sheet.identity, sheet.setting, sheet.lighting].filter(Boolean).join('\n')
                        : 'Fill in the sheet. These lines are copied unchanged into every still or shot.'}
                </p>
            </div>
        </div>
    );
}

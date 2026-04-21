// js/components/materials.jsx
window.MaterialsManager = () => {
    const { useState, useEffect } = React;

    const [materials, setMaterials] = useState([]);
    const [showForm,  setShowForm]  = useState(false);
    const [saving,    setSaving]    = useState(false);
    const emptyForm = { title:'', description:'', url:'', type:'pdf' };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        const unsub = db.collection('materials').orderBy('createdAt','desc').onSnapshot(
            snap => setMaterials(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
            ()   => {}
        );
        return () => unsub();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await db.collection('materials').add({
                ...form,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            setForm(emptyForm);
            setShowForm(false);
        } catch(err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
        setSaving(false);
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`ลบ "${title}"?`)) return;
        await db.collection('materials').doc(id).delete();
    };

    const typeConfig = {
        pdf:   { icon:'fa-file-pdf',   color:'text-red-500',    bg:'bg-red-50',    label:'PDF' },
        video: { icon:'fa-play-circle', color:'text-blue-500',   bg:'bg-blue-50',   label:'วิดีโอ' },
        link:  { icon:'fa-link',        color:'text-green-500',  bg:'bg-green-50',  label:'ลิงก์' },
        doc:   { icon:'fa-file-word',   color:'text-indigo-500', bg:'bg-indigo-50', label:'Word' },
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="fa-file-alt" className="text-red-700" size={24}/> เอกสาร / สื่อการสอน
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">อัปโหลดลิงก์ PDF, วิดีโอ หรือสื่อการสอน</p>
                </div>
                <button onClick={()=>{setForm(emptyForm);setShowForm(true);}}
                    className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors">
                    <Icon name="fa-plus" size={14}/> เพิ่มสื่อการสอน
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-5">เพิ่มสื่อการสอนใหม่</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อเรื่อง *</label>
                            <input required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                placeholder="เช่น บทที่ 1 - คำศัพท์พื้นฐาน"
                                value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">คำอธิบาย</label>
                            <textarea rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                placeholder="รายละเอียดเพิ่มเติม..."
                                value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ลิงก์ (URL) *</label>
                            <input type="url" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                placeholder="https://drive.google.com/... หรือ YouTube, OneDrive"
                                value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))}/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">ประเภท</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.entries(typeConfig).map(([key, cfg]) => (
                                    <button type="button" key={key}
                                        onClick={()=>setForm(p=>({...p,type:key}))}
                                        className={`py-2 rounded-lg border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${
                                            form.type===key ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                        <Icon name={cfg.icon} size={18}/>
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={()=>setShowForm(false)}
                                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold">ยกเลิก</button>
                            <button type="submit" disabled={saving}
                                className="flex-1 py-2 bg-red-700 text-white rounded-lg font-bold disabled:opacity-70 flex items-center justify-center gap-2">
                                {saving ? <><Icon name="fa-spinner fa-spin" size={14}/> บันทึก...</> : <><Icon name="fa-save" size={14}/> บันทึก</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {materials.length === 0 ? (
                    <div className="bg-white p-10 rounded-xl text-center text-gray-400 border border-gray-200">
                        <Icon name="fa-file-alt" size={40} className="mb-3 block mx-auto opacity-40"/>
                        ยังไม่มีสื่อการสอน
                    </div>
                ) : materials.map(m => {
                    const cfg = typeConfig[m.type] || typeConfig.link;
                    return (
                        <div key={m.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
                            <div className={`w-12 h-12 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center shrink-0`}>
                                <Icon name={cfg.icon} size={22}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800">{m.title}</h3>
                                {m.description && <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>}
                                <a href={m.url} target="_blank" rel="noreferrer"
                                    className="text-xs text-blue-500 hover:underline truncate block mt-1">{m.url}</a>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a href={m.url} target="_blank" rel="noreferrer"
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                                    <Icon name="fa-external-link-alt" size={13}/>
                                </a>
                                <button onClick={()=>handleDelete(m.id, m.title)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                                    <Icon name="fa-trash" size={13}/>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── StudyMaterials (นักเรียน) ──
window.StudyMaterials = () => {
    const { useState, useEffect } = React;

    const [materials, setMaterials] = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [filter,    setFilter]    = useState('ทั้งหมด');

    useEffect(() => {
        const unsub = db.collection('materials').orderBy('createdAt','desc').onSnapshot(
            snap => { setMaterials(snap.docs.map(d => ({ id:d.id, ...d.data() }))); setLoading(false); },
            ()   => setLoading(false)
        );
        return () => unsub();
    }, []);

    const typeConfig = {
        pdf:   { icon:'fa-file-pdf',   color:'text-red-500',    bg:'bg-red-50',    label:'PDF',   btnLabel:'เปิด PDF' },
        video: { icon:'fa-play-circle', color:'text-blue-500',   bg:'bg-blue-50',   label:'วิดีโอ', btnLabel:'ดูวิดีโอ' },
        link:  { icon:'fa-link',        color:'text-green-500',  bg:'bg-green-50',  label:'ลิงก์', btnLabel:'เปิดลิงก์' },
        doc:   { icon:'fa-file-word',   color:'text-indigo-500', bg:'bg-indigo-50', label:'Word',  btnLabel:'เปิดไฟล์' },
    };

    const types    = ['ทั้งหมด', ...new Set(materials.map(m=>m.type).filter(Boolean))];
    const filtered = filter === 'ทั้งหมด' ? materials : materials.filter(m => m.type === filter);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Icon name="fa-book-open" className="text-red-700" size={24}/> บทเรียนและสื่อการสอน
                </h2>
                <p className="text-sm text-gray-500 mt-1">เอกสาร PDF วิดีโอ และสื่อการสอนจากครูผู้สอน</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {types.map(t => (
                    <button key={t} onClick={()=>setFilter(t)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                            filter===t ? 'bg-red-700 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-red-300'}`}>
                        {t === 'ทั้งหมด' ? 'ทั้งหมด' : (typeConfig[t]?.label || t)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-16 text-gray-400">
                    <Icon name="fa-spinner fa-spin" size={32} className="mb-2 block mx-auto"/> กำลังโหลด...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center text-gray-400 border border-gray-200">
                    <Icon name="fa-book-open" size={48} className="mb-4 block mx-auto opacity-40"/>
                    <p className="font-bold text-lg">ยังไม่มีสื่อการสอน</p>
                    <p className="text-sm mt-1">ครูยังไม่ได้อัปโหลดสื่อการสอน</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(m => {
                        const cfg = typeConfig[m.type] || typeConfig.link;
                        return (
                            <div key={m.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-5 hover:border-red-200 transition-colors">
                                <div className={`w-14 h-14 ${cfg.bg} ${cfg.color} rounded-xl flex items-center justify-center shrink-0`}>
                                    <Icon name={cfg.icon} size={26}/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg">{m.title}</h3>
                                    {m.description && <p className="text-sm text-gray-500 mt-1">{m.description}</p>}
                                    <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                                </div>
                                <a href={m.url} target="_blank" rel="noreferrer"
                                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors text-sm">
                                    <Icon name="fa-external-link-alt" size={13}/> {cfg.btnLabel}
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

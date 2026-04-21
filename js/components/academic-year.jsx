// js/components/academic-year.jsx
window.AcademicYearManager = () => {
    const { useState, useEffect } = React;

    const [settings,     setSettings]     = useState({ year:'2569', term:'1' });
    const [saving,       setSaving]       = useState(false);
    const [saved,        setSaved]        = useState(false);
    const [classrooms,   setClassrooms]   = useState([]);
    const [newClassroom, setNewClassroom] = useState('');
    const [savingCls,    setSavingCls]    = useState(false);
    const [savedCls,     setSavedCls]     = useState(false);

    useEffect(() => {
        db.collection('settings').doc('academic').get()
            .then(doc => { if (doc.exists) setSettings(doc.data()); })
            .catch(() => {});
        db.collection('settings').doc('classrooms').get()
            .then(doc => { if (doc.exists && doc.data().list) setClassrooms(doc.data().list); })
            .catch(() => {});
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await db.collection('settings').doc('academic').set(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch(err) { alert('เกิดข้อผิดพลาด'); }
        setSaving(false);
    };

    const addClassroom = () => {
        const val = newClassroom.trim();
        if (!val || classrooms.includes(val)) return;
        setClassrooms(prev => [...prev, val].sort());
        setNewClassroom('');
    };

    const removeClassroom = (cls) => setClassrooms(prev => prev.filter(c => c !== cls));

    const saveClassrooms = async () => {
        setSavingCls(true);
        try {
            await db.collection('settings').doc('classrooms').set({ list: classrooms });
            setSavedCls(true);
            setTimeout(() => setSavedCls(false), 3000);
        } catch(err) { alert('เกิดข้อผิดพลาด'); }
        setSavingCls(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Icon name="fa-calendar-alt" className="text-red-700" size={24}/> ปีการศึกษา / ภาคเรียน
            </h2>

            {/* ── ปีการศึกษา ── */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-6 text-gray-700">ตั้งค่าปีการศึกษาปัจจุบัน</h3>
                <form onSubmit={handleSave} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ปีการศึกษา (พ.ศ.)</label>
                        <input type="text" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-xl font-bold"
                            placeholder="เช่น 2569"
                            value={settings.year} onChange={e=>setSettings(p=>({...p,year:e.target.value}))}/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">ภาคเรียน</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['1','2'].map(t => (
                                <button type="button" key={t}
                                    onClick={()=>setSettings(p=>({...p,term:t}))}
                                    className={`py-4 rounded-xl font-bold text-lg border-2 transition-all ${
                                        settings.term===t ? 'bg-red-700 text-white border-red-700 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`}>
                                    ภาคเรียนที่ {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
                        <Icon name="fa-exclamation-triangle" size={14}/>
                        การเปลี่ยนค่านี้จะมีผลกับการแสดงข้อมูลทั่วทั้งระบบ
                    </div>
                    <button type="submit" disabled={saving}
                        className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                        {saving ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังบันทึก...</>
                                : saved  ? <><Icon name="fa-check" size={16}/> บันทึกแล้ว!</>
                                         : <><Icon name="fa-save" size={16}/> บันทึกการตั้งค่า</>}
                    </button>
                </form>
            </div>

            {/* ── สรุป ── */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-4">ปีการศึกษาปัจจุบัน</h3>
                <div className="flex items-center gap-4">
                    <div className="text-center p-6 bg-red-50 rounded-xl flex-1">
                        <p className="text-sm text-gray-500 mb-1">ปีการศึกษา</p>
                        <p className="text-4xl font-black text-red-700">{settings.year}</p>
                    </div>
                    <div className="text-center p-6 bg-gray-50 rounded-xl flex-1">
                        <p className="text-sm text-gray-500 mb-1">ภาคเรียน</p>
                        <p className="text-4xl font-black text-gray-700">{settings.term}</p>
                    </div>
                </div>
            </div>

            {/* ── จัดการห้องเรียน ── */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-1 text-gray-700 flex items-center gap-2">
                    <Icon name="fa-door-open" size={18} className="text-red-700"/> จัดการห้องเรียนในระบบ
                </h3>
                <p className="text-sm text-gray-500 mb-6">รายชื่อห้องเรียนที่ตั้งค่าไว้จะถูกใช้ในทุกเมนูของระบบ เช่น บัตรนักเรียน, เพิ่มนักเรียน, รายวิชา</p>

                <div className="flex gap-2 mb-4">
                    <input
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-sm"
                        placeholder="เช่น ม.4/1, ม.5/2, ม.6/3 ..."
                        value={newClassroom}
                        onChange={e => setNewClassroom(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addClassroom())}/>
                    <button type="button" onClick={addClassroom}
                        className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors">
                        <Icon name="fa-plus" size={13}/> เพิ่ม
                    </button>
                </div>

                {classrooms.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <Icon name="fa-door-closed" size={28} className="mb-2"/>
                        <p className="text-sm">ยังไม่มีห้องเรียนในระบบ</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {classrooms.map(cls => (
                            <span key={cls}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-800 text-sm font-semibold rounded-full border border-red-200">
                                <Icon name="fa-chalkboard" size={11}/> {cls}
                                <button type="button" onClick={() => removeClassroom(cls)}
                                    className="ml-1 text-red-400 hover:text-red-700 transition-colors leading-none">
                                    <Icon name="fa-times" size={11}/>
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">{classrooms.length} ห้องเรียน</p>
                    <button type="button" onClick={saveClassrooms} disabled={savingCls}
                        className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2">
                        {savingCls ? <><Icon name="fa-spinner fa-spin" size={14}/> กำลังบันทึก...</>
                                   : savedCls ? <><Icon name="fa-check" size={14}/> บันทึกแล้ว!</>
                                              : <><Icon name="fa-save" size={14}/> บันทึกรายการห้องเรียน</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// js/components/timetable.jsx
window.TimetableManager = function TimetableManager() {
    const { useState, useEffect } = React;

    const DAYS    = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'];
    const PERIODS = [1,2,3,4,5,6,7,8];
    const emptyForm = { day:'จันทร์', dayIndex:1, period:1, startTime:'08:00', endTime:'09:00', class:'', subject:'' };

    const [entries,  setEntries]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form,     setForm]     = useState(emptyForm);
    const [editId,   setEditId]   = useState(null);
    const [saving,   setSaving]   = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    useEffect(() => {
        const unsub = db.collection('timetable').orderBy('dayIndex').onSnapshot(
            snap => { setEntries(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
            () => setLoading(false)
        );
        return () => unsub();
    }, []);

    const openAdd  = ()      => { setForm(emptyForm); setEditId(null); setShowForm(true); };
    const openEdit = (entry) => { setForm({...entry}); setEditId(entry.id); setShowForm(true); };

    const save = async () => {
        if (!form.class.trim() || !form.subject.trim()) return alert('กรุณากรอกห้องและวิชา');
        setSaving(true);
        const data = { ...form, dayIndex: DAYS.indexOf(form.day)+1 };
        if (editId) await db.collection('timetable').doc(editId).update(data);
        else        await db.collection('timetable').add(data);
        setSaving(false);
        setShowForm(false);
    };

    const remove = async (id) => {
        if (!window.confirm('ลบรายการนี้?')) return;
        await db.collection('timetable').doc(id).delete();
    };

    const cellFor = (day, period) => entries.filter(e => e.day===day && e.period===period);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">ตารางสอน</h2>
                    <p className="text-gray-500 text-sm">จัดการตารางสอนรายสัปดาห์ — ลิงก์กับการเช็คชื่ออัตโนมัติ</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={()=>setViewMode(v=>v==='grid'?'list':'grid')}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                        <Icon name={viewMode==='grid'?'fa-list':'fa-table-cells'} size={14}/>
                        {viewMode==='grid' ? 'มุมมองรายการ' : 'มุมมองตาราง'}
                    </button>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800">
                        <Icon name="fa-plus" size={14}/> เพิ่มคาบเรียน
                    </button>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3 text-sm text-blue-800">
                <Icon name="fa-circle-info" size={16} className="mt-0.5 flex-shrink-0"/>
                <span>ตารางสอนนี้จะแสดงเป็นปุ่มลัด <strong>📅</strong> ในหน้าเช็คชื่อ เพื่อให้เลือกห้องเรียนได้รวดเร็วตามวันปัจจุบัน</span>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20 text-gray-400"><Icon name="fa-spinner fa-spin" size={32}/></div>
            ) : viewMode==='grid' ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-red-700 text-white">
                                <th className="border border-red-800 px-3 py-2 w-16">คาบ</th>
                                {DAYS.map(d => <th key={d} className="border border-red-800 px-3 py-2">{d}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {PERIODS.map(p => (
                                <tr key={p} className={p%2===0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-500">{p}</td>
                                    {DAYS.map(d => (
                                        <td key={d} className="border border-gray-200 px-2 py-1 min-w-[120px] align-top">
                                            {cellFor(d,p).map(e => (
                                                <div key={e.id} className="bg-red-50 border border-red-200 rounded p-1 mb-1 group relative">
                                                    <p className="font-semibold text-red-800 text-xs leading-tight">{e.subject}</p>
                                                    <p className="text-gray-500 text-xs">{e.class}</p>
                                                    <p className="text-gray-400 text-xs">{e.startTime}–{e.endTime}</p>
                                                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                                        <button onClick={()=>openEdit(e)} className="bg-blue-500 text-white rounded p-0.5 hover:bg-blue-600"><Icon name="fa-pen" size={10}/></button>
                                                        <button onClick={()=>remove(e.id)} className="bg-red-500 text-white rounded p-0.5 hover:bg-red-600"><Icon name="fa-trash" size={10}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={()=>{ setForm({...emptyForm, day:d, dayIndex:DAYS.indexOf(d)+1, period:p}); setEditId(null); setShowForm(true); }}
                                                className="text-gray-300 hover:text-red-500 text-xs w-full text-left pl-1">+ เพิ่ม</button>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-2">
                    {DAYS.map(d => {
                        const dayEntries = entries.filter(e=>e.day===d).sort((a,b)=>a.period-b.period);
                        if (dayEntries.length===0) return null;
                        return (
                            <div key={d}>
                                <h4 className="font-bold text-red-700 border-b border-red-200 pb-1 mb-2">{d}</h4>
                                {dayEntries.map(e => (
                                    <div key={e.id} className="flex items-center justify-between bg-white border rounded-lg px-4 py-2 mb-1">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">คาบ {e.period}</span>
                                            <div>
                                                <p className="font-semibold text-sm">{e.subject} <span className="text-gray-500 font-normal">— {e.class}</span></p>
                                                <p className="text-xs text-gray-400">{e.startTime} – {e.endTime}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={()=>openEdit(e)} className="text-blue-500 hover:text-blue-700"><Icon name="fa-pen" size={13}/></button>
                                            <button onClick={()=>remove(e.id)} className="text-red-500 hover:text-red-700"><Icon name="fa-trash" size={13}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                    {entries.length===0 && <p className="text-gray-400 text-center py-10">ยังไม่มีตารางสอน — กด "+ เพิ่มคาบเรียน" เพื่อเริ่มต้น</p>}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="bg-red-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editId ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน'}</h3>
                            <button onClick={()=>setShowForm(false)} className="hover:opacity-75"><Icon name="fa-xmark" size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">วัน</label>
                                    <select value={form.day} onChange={e=>setForm(f=>({...f, day:e.target.value, dayIndex:DAYS.indexOf(e.target.value)+1}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                                        {DAYS.map(d=><option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">คาบที่</label>
                                    <select value={form.period} onChange={e=>setForm(f=>({...f, period:Number(e.target.value)}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                                        {PERIODS.map(p=><option key={p} value={p}>คาบ {p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">เวลาเริ่ม</label>
                                    <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">เวลาสิ้นสุด</label>
                                    <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">ห้องเรียน</label>
                                <input value={form.class} onChange={e=>setForm(f=>({...f,class:e.target.value}))}
                                    placeholder="เช่น ม.6/2"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">วิชา</label>
                                <input value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}
                                    placeholder="เช่น ภาษาจีน 5"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={()=>setShowForm(false)}
                                    className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50">ยกเลิก</button>
                                <button onClick={save} disabled={saving}
                                    className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50">
                                    {saving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'เพิ่มคาบเรียน')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// js/components/assignments.jsx
window.AssignmentReview = () => {
    const { useState, useEffect } = React;

    const emptyForm = { title:'', description:'', deadline:'', maxScore:10,
                        targetCourseId:'', targetCourseName:'', chapterLabel:'' };
    const [tab,          setTab]          = useState('assign');
    const [assignments,  setAssignments]  = useState([]);
    const [submissions,  setSubmissions]  = useState([]);
    const [courses,      setCourses]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showForm,     setShowForm]     = useState(false);
    const [form,         setForm]         = useState(emptyForm);
    const [editId,       setEditId]       = useState(null);
    const [saving,       setSaving]       = useState(false);
    const [scoreInputs,  setScoreInputs]  = useState({});
    const [filterAssign, setFilterAssign] = useState('ทั้งหมด');

    useEffect(() => {
        const unsubA = db.collection('assignments').orderBy('createdAt','desc').onSnapshot(
            snap => { setAssignments(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
            () => setLoading(false)
        );
        const unsubS = db.collection('submissions').orderBy('timestamp','desc').onSnapshot(
            snap => setSubmissions(snap.docs.map(d=>({id:d.id,...d.data()}))),
            () => {}
        );
        db.collection('courses').orderBy('name').get()
            .then(snap => setCourses(snap.docs.map(d=>({id:d.id,...d.data()}))))
            .catch(()=>{});
        return () => { unsubA(); unsubS(); };
    }, []);

    const openAdd  = ()     => { setForm(emptyForm); setEditId(null); setShowForm(true); };
    const openEdit = (a)    => { setForm({...a}); setEditId(a.id); setShowForm(true); };
    const removeAssign = async (id) => {
        if (!window.confirm('ลบงานนี้?')) return;
        await db.collection('assignments').doc(id).delete();
    };

    const save = async () => {
        if (!form.title.trim()) return alert('กรุณากรอกชื่องาน');
        setSaving(true);
        const data = {
            title:            form.title.trim(),
            description:      form.description||'',
            deadline:         form.deadline||'',
            maxScore:         Number(form.maxScore)||10,
            targetCourseId:   form.targetCourseId||'',
            targetCourseName: form.targetCourseName||'',
            chapterLabel:     form.chapterLabel||'',
            createdAt: editId ? form.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (editId) await db.collection('assignments').doc(editId).update(data);
        else        await db.collection('assignments').add(data);
        setSaving(false);
        setShowForm(false);
    };

    const giveScore = async (subId) => {
        const s = scoreInputs[subId];
        if (s===undefined || s==='') return alert('กรุณากรอกคะแนน');
        await db.collection('submissions').doc(subId).update({ status:'reviewed', score: Number(s) });
        setScoreInputs(prev => { const n={...prev}; delete n[subId]; return n; });
    };

    const filteredSubs = filterAssign==='ทั้งหมด'
        ? submissions
        : submissions.filter(s => s.assignmentTitle===filterAssign);
    const assignTitles = ['ทั้งหมด', ...assignments.map(a=>a.title)];

    if (loading) return (
        <div className="text-center py-20">
            <Icon name="fa-spinner fa-spin" size={32} className="text-red-600 block mx-auto mb-2"/>
            <p className="text-gray-500">กำลังโหลด...</p>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">4. สั่งงาน / ตรวจงาน</h2>
                {tab==='assign' && (
                    <button onClick={openAdd}
                        className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800">
                        <Icon name="fa-plus" size={14}/> สั่งงานใหม่
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {[['assign','fa-tasks','สั่งงาน'],['review','fa-inbox','ตรวจงาน']].map(([t,ic,lb]) => (
                    <button key={t} onClick={()=>setTab(t)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${tab===t ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Icon name={ic} size={14}/>{lb}
                        {t==='review' && submissions.filter(s=>s.status==='pending').length > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {submissions.filter(s=>s.status==='pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Tab: สั่งงาน ── */}
            {tab==='assign' && (
                <div className="space-y-3">
                    {assignments.length===0 ? (
                        <div className="bg-white p-10 rounded-xl text-center text-gray-400">
                            <Icon name="fa-tasks" size={48} className="mb-4 block mx-auto opacity-30"/>
                            <p>ยังไม่มีงานที่สั่ง — กด "สั่งงานใหม่" เพื่อเริ่มต้น</p>
                        </div>
                    ) : assignments.map(a => {
                        const subCount  = submissions.filter(s=>s.assignmentTitle===a.title).length;
                        const pendCount = submissions.filter(s=>s.assignmentTitle===a.title && s.status==='pending').length;
                        return (
                            <div key={a.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-lg text-gray-800">{a.title}</h3>
                                            {a.targetCourseName && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.targetCourseName}</span>}
                                            {a.chapterLabel && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">บท: {a.chapterLabel}</span>}
                                            {/* backward-compat: แสดง course เก่า */}
                                            {!a.targetCourseName && a.course && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.course}</span>}
                                        </div>
                                        {a.description && <p className="text-sm text-gray-500 mb-2">{a.description}</p>}
                                        <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                                            {a.deadline && <span><Icon name="fa-calendar" size={11} className="mr-1"/>กำหนดส่ง: {a.deadline}</span>}
                                            <span><Icon name="fa-star" size={11} className="mr-1"/>คะแนน: {a.maxScore}</span>
                                            <span><Icon name="fa-file-upload" size={11} className="mr-1"/>ส่งแล้ว: {subCount} คน</span>
                                            {pendCount>0 && <span className="text-orange-600 font-bold"><Icon name="fa-clock" size={11} className="mr-1"/>รอตรวจ: {pendCount} คน</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={()=>openEdit(a)} className="text-blue-500 hover:text-blue-700 p-2"><Icon name="fa-pen" size={14}/></button>
                                        <button onClick={()=>removeAssign(a.id)} className="text-red-400 hover:text-red-600 p-2"><Icon name="fa-trash" size={14}/></button>
                                        <button onClick={()=>{setFilterAssign(a.title);setTab('review');}}
                                            className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-lg hover:bg-red-100 font-medium">
                                            ตรวจงาน →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Tab: ตรวจงาน ── */}
            {tab==='review' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-sm font-medium text-gray-600">กรองตามงาน:</label>
                        <select value={filterAssign} onChange={e=>setFilterAssign(e.target.value)}
                            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                            {assignTitles.map(t=><option key={t}>{t}</option>)}
                        </select>
                        <span className="text-sm text-gray-400">({filteredSubs.length} รายการ)</span>
                    </div>
                    {filteredSubs.length===0 ? (
                        <div className="bg-white p-10 rounded-xl text-center text-gray-400">
                            <Icon name="fa-inbox" size={48} className="mb-4 block mx-auto opacity-50"/>
                            ยังไม่มีงานที่ส่ง
                        </div>
                    ) : filteredSubs.map(sub => (
                        <div key={sub.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-base">{sub.studentName}
                                        <span className="text-sm text-gray-400 font-normal ml-2">({sub.studentId}) {sub.studentClass}</span>
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-1">{sub.assignmentTitle}</p>
                                    <a href={sub.link} target="_blank" rel="noreferrer"
                                        className="text-blue-600 hover:underline text-sm break-all">{sub.link}</a>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {sub.timestamp?.toDate?.()?.toLocaleString('th-TH') || ''}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${sub.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                                        {sub.status==='pending'?'รอตรวจ':'ตรวจแล้ว'}
                                    </span>
                                    {sub.status==='pending' ? (
                                        <div className="flex items-center gap-1">
                                            <input type="number" min="0" placeholder="คะแนน"
                                                value={scoreInputs[sub.id]||''}
                                                onChange={e=>setScoreInputs(prev=>({...prev,[sub.id]:e.target.value}))}
                                                className="w-20 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                            <button onClick={()=>giveScore(sub.id)}
                                                className="bg-red-700 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-800">
                                                บันทึก
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="font-black text-green-600 text-lg">{sub.score} คะแนน</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal สั่งงาน */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="bg-red-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
                            <h3 className="font-bold text-lg">{editId ? 'แก้ไขงาน' : 'สั่งงานใหม่'}</h3>
                            <button onClick={()=>setShowForm(false)} className="hover:opacity-75"><Icon name="fa-xmark" size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">ชื่องาน / หัวข้อ <span className="text-red-500">*</span></label>
                                <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                                    placeholder="เช่น อัดคลิปแนะนำตัวภาษาจีน"
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600 mb-1 block">รายละเอียด / คำอธิบาย</label>
                                <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                                    placeholder="คำอธิบายเพิ่มเติม..."
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">กำหนดส่ง</label>
                                    <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">คะแนนเต็ม</label>
                                    <input type="number" min="1" value={form.maxScore} onChange={e=>setForm(f=>({...f,maxScore:e.target.value}))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">รายวิชา (เชื่อมกับบัญชีคะแนน)</label>
                                    <select value={form.targetCourseId}
                                        onChange={e => {
                                            const c = courses.find(x=>x.id===e.target.value);
                                            setForm(f=>({...f, targetCourseId:e.target.value, targetCourseName:c?.name||'', chapterLabel:''}));
                                        }}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                                        <option value="">— ไม่ระบุ —</option>
                                        {courses.map(c=><option key={c.id} value={c.id}>{c.code?`[${c.code}] `:''}{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 mb-1 block">บท / กลุ่มคะแนนเก็บ</label>
                                    <select value={form.chapterLabel}
                                        onChange={e=>setForm(f=>({...f,chapterLabel:e.target.value}))}
                                        disabled={!form.targetCourseId}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50">
                                        <option value="">— ไม่ระบุ —</option>
                                        {(courses.find(c=>c.id===form.targetCourseId)?.continuousItems||[]).map(it=>(
                                            <option key={it.label} value={it.label}>{it.label} (เต็ม {it.score})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={()=>setShowForm(false)}
                                    className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50">ยกเลิก</button>
                                <button onClick={save} disabled={saving}
                                    className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50">
                                    {saving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'สั่งงาน')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

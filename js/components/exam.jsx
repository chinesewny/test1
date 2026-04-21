// js/components/exam.jsx
window.ExamManager = () => {
    const { useState, useEffect } = React;

    const [view,      setView]      = useState('list');
    const [exams,     setExams]     = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [selExam,   setSelExam]   = useState(null);
    const [results,   setResults]   = useState([]);
    const [saving,    setSaving]    = useState(false);

    const emptyExam = { title:'', description:'', timeLimit:30, isOpen:false, questions:[] };
    const [form, setForm] = useState(emptyExam);

    const emptyQ = { text:'', choices:['','','',''], answer:0 };
    const [qForm,    setQForm]    = useState(emptyQ);
    const [editQIdx, setEditQIdx] = useState(null);

    useEffect(() => {
        const unsub = db.collection('exams').orderBy('createdAt','desc').onSnapshot(
            snap => { setExams(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
            ()   => setLoading(false)
        );
        return () => unsub();
    }, []);

    useEffect(() => {
        if (view !== 'results' || !selExam) return;
        const unsub = db.collection('examResults')
            .where('examId','==',selExam.id)
            .orderBy('submittedAt','desc')
            .onSnapshot(
                snap => setResults(snap.docs.map(d=>({id:d.id,...d.data()}))),
                ()   => {}
            );
        return () => unsub();
    }, [view, selExam]);

    const openAdd = () => {
        setForm(emptyExam);
        setSelExam(null);
        setQForm(emptyQ);
        setEditQIdx(null);
        setView('edit');
    };
    const openEdit = (exam) => {
        setForm({ ...exam });
        setSelExam(exam);
        setQForm(emptyQ);
        setEditQIdx(null);
        setView('edit');
    };
    const openResults = (exam) => { setSelExam(exam); setView('results'); };

    const saveExam = async () => {
        if (!form.title.trim()) return alert('กรุณากรอกชื่อชุดข้อสอบ');
        if (form.questions.length === 0) return alert('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ');
        setSaving(true);
        const data = {
            title:       form.title.trim(),
            description: form.description.trim(),
            timeLimit:   Number(form.timeLimit) || 30,
            isOpen:      form.isOpen || false,
            questions:   form.questions,
            createdAt:   selExam ? form.createdAt : firebase.firestore.FieldValue.serverTimestamp(),
        };
        try {
            if (selExam) await db.collection('exams').doc(selExam.id).update(data);
            else         await db.collection('exams').add(data);
            setView('list');
        } catch(e) { alert('บันทึกไม่สำเร็จ'); }
        setSaving(false);
    };

    const deleteExam = async (id) => {
        if (!window.confirm('ลบชุดข้อสอบนี้?')) return;
        await db.collection('exams').doc(id).delete().catch(()=>{});
    };

    const toggleOpen = async (exam) => {
        await db.collection('exams').doc(exam.id).update({ isOpen: !exam.isOpen }).catch(()=>{});
    };

    const addOrUpdateQ = () => {
        if (!qForm.text.trim()) return alert('กรุณากรอกคำถาม');
        if (qForm.choices.some(c=>!c.trim())) return alert('กรุณากรอกตัวเลือกให้ครบ 4 ข้อ');
        const qs = [...form.questions];
        if (editQIdx !== null) qs[editQIdx] = { ...qForm };
        else                   qs.push({ ...qForm });
        setForm(p => ({ ...p, questions: qs }));
        setQForm(emptyQ);
        setEditQIdx(null);
    };
    const editQ   = (idx) => { setQForm({ ...form.questions[idx] }); setEditQIdx(idx); };
    const deleteQ = (idx) => setForm(p => ({ ...p, questions: p.questions.filter((_,i)=>i!==idx) }));

    if (loading) return (
        <div className="text-center py-20">
            <Icon name="fa-spinner fa-spin" size={32} className="text-red-600 block mx-auto mb-2"/>
            <p className="text-gray-500">กำลังโหลด...</p>
        </div>
    );

    /* ── หน้าผลสอบ ── */
    if (view === 'results') return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={()=>setView('list')} className="text-gray-500 hover:text-gray-800">
                    <Icon name="fa-arrow-left" size={18}/>
                </button>
                <h2 className="text-xl font-bold text-gray-800">ผลสอบ: {selExam?.title}</h2>
            </div>
            {results.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Icon name="fa-inbox" size={40} className="block mx-auto mb-3"/>
                    <p>ยังไม่มีผู้ส่งคำตอบ</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">ชื่อนักเรียน</th>
                                <th className="px-4 py-3 text-left">ห้อง</th>
                                <th className="px-4 py-3 text-center">คะแนน</th>
                                <th className="px-4 py-3 text-center">%</th>
                                <th className="px-4 py-3 text-center">เวลาที่ส่ง</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {results.map(r => {
                                const total = selExam?.questions?.length || 1;
                                const pct   = Math.round((r.score/total)*100);
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{r.studentName}</td>
                                        <td className="px-4 py-3 text-gray-500">{r.class}</td>
                                        <td className="px-4 py-3 text-center font-bold">{r.score}/{total}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${pct>=80?'text-green-600':pct>=60?'text-yellow-600':'text-red-600'}`}>{pct}%</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-400 text-xs">
                                            {r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString('th-TH') : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                        <span>ผู้เข้าสอบทั้งหมด <strong>{results.length}</strong> คน</span>
                        <span>คะแนนเฉลี่ย <strong>{results.length ? (results.reduce((s,r)=>s+r.score,0)/results.length).toFixed(1) : '-'}</strong> / {selExam?.questions?.length || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );

    /* ── หน้าสร้าง/แก้ไขข้อสอบ ── */
    if (view === 'edit') return (
        <div className="space-y-5 max-w-3xl">
            <div className="flex items-center gap-3">
                <button onClick={()=>setView('list')} className="text-gray-500 hover:text-gray-800">
                    <Icon name="fa-arrow-left" size={18}/>
                </button>
                <h2 className="text-xl font-bold text-gray-800">{selExam ? 'แก้ไขชุดข้อสอบ' : 'สร้างชุดข้อสอบใหม่'}</h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="font-bold text-gray-700">ข้อมูลชุดข้อสอบ</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อชุดข้อสอบ</label>
                        <input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                            placeholder="เช่น สอบกลางภาค ภาษาจีน 5"
                            value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">คำอธิบาย</label>
                        <input className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                            placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                            value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">เวลา (นาที)</label>
                        <input type="number" min="1"
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                            value={form.timeLimit} onChange={e=>setForm(p=>({...p,timeLimit:e.target.value}))}/>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                                checked={form.isOpen} onChange={e=>setForm(p=>({...p,isOpen:e.target.checked}))}/>
                            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-700">เปิดรับการสอบ</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-700">คำถามทั้งหมด ({form.questions.length} ข้อ)</h3>
                </div>

                {form.questions.map((q,i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm flex-1"><span className="text-red-700 font-bold mr-1">ข้อ {i+1}.</span>{q.text}</p>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={()=>editQ(i)} className="text-blue-500 hover:text-blue-700 px-2 py-1 text-xs border border-blue-200 rounded hover:bg-blue-50">แก้ไข</button>
                                <button onClick={()=>deleteQ(i)} className="text-red-500 hover:text-red-700 px-2 py-1 text-xs border border-red-200 rounded hover:bg-red-50">ลบ</button>
                            </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.choices.map((c,ci) => (
                                <p key={ci} className={`text-xs px-2 py-1 rounded ${ci===q.answer?'bg-green-100 text-green-800 font-bold':'text-gray-500'}`}>
                                    {String.fromCharCode(65+ci)}. {c}
                                </p>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
                    <h4 className="font-bold text-sm text-red-800">{editQIdx !== null ? `แก้ไขข้อ ${editQIdx+1}` : 'เพิ่มคำถามใหม่'}</h4>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">คำถาม</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-sm"
                            placeholder="พิมพ์คำถาม..."
                            value={qForm.text} onChange={e=>setQForm(p=>({...p,text:e.target.value}))}/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {qForm.choices.map((c,ci) => (
                            <div key={ci}>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    ตัวเลือก {String.fromCharCode(65+ci)}
                                    {ci===qForm.answer && <span className="ml-1 text-green-600">(เฉลย)</span>}
                                </label>
                                <input className="w-full px-2 py-1.5 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-red-300 text-sm"
                                    value={c} onChange={e=>{
                                        const cs=[...qForm.choices]; cs[ci]=e.target.value;
                                        setQForm(p=>({...p,choices:cs}));
                                    }}/>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">ตัวเลือกที่ถูก</label>
                        <div className="flex gap-2">
                            {['A','B','C','D'].map((l,ci) => (
                                <button key={ci} type="button"
                                    onClick={()=>setQForm(p=>({...p,answer:ci}))}
                                    className={`px-4 py-1.5 rounded font-bold text-sm border transition-all ${qForm.answer===ci?'bg-green-600 text-white border-green-600':'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addOrUpdateQ}
                            className="flex-1 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg">
                            {editQIdx !== null ? 'อัปเดตคำถาม' : '+ เพิ่มคำถาม'}
                        </button>
                        {editQIdx !== null && (
                            <button onClick={()=>{setQForm(emptyQ);setEditQIdx(null);}}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg">
                                ยกเลิก
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <button onClick={saveExam} disabled={saving}
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังบันทึก...</>
                        : <><Icon name="fa-save" size={16}/> บันทึกชุดข้อสอบ</>}
            </button>
        </div>
    );

    /* ── หน้า List ── */
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Icon name="fa-desktop" className="text-red-700" size={22}/> ระบบทดสอบออนไลน์
                </h2>
                <button onClick={openAdd}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow">
                    <Icon name="fa-plus" size={14}/> สร้างชุดข้อสอบ
                </button>
            </div>

            {exams.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Icon name="fa-file-alt" size={48} className="block mx-auto mb-4"/>
                    <p className="text-lg font-medium">ยังไม่มีชุดข้อสอบ</p>
                    <p className="text-sm mt-1">กด "สร้างชุดข้อสอบ" เพื่อเริ่มต้น</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {exams.map(exam => (
                        <div key={exam.id}
                            className={`bg-white p-5 rounded-xl shadow-sm border-2 transition-all ${exam.isOpen ? 'border-green-400' : 'border-gray-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${exam.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {exam.isOpen ? '🟢 เปิดรับสอบ' : '⚫ ปิดสอบ'}
                                        </span>
                                        <span className="text-xs text-gray-400">{exam.questions?.length || 0} ข้อ · {exam.timeLimit} นาที</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{exam.title}</h3>
                                    {exam.description && <p className="text-sm text-gray-500 mt-0.5">{exam.description}</p>}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={()=>toggleOpen(exam)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${exam.isOpen ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                                        {exam.isOpen ? 'ปิดสอบ' : 'เปิดสอบ'}
                                    </button>
                                    <button onClick={()=>openResults(exam)}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">
                                        <Icon name="fa-chart-bar" size={12}/> ผลสอบ
                                    </button>
                                    <button onClick={()=>openEdit(exam)}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                                        <Icon name="fa-edit" size={12}/> แก้ไข
                                    </button>
                                    <button onClick={()=>deleteExam(exam.id)}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                                        <Icon name="fa-trash" size={12}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── StudentExam (นักเรียนทำข้อสอบ) ──
window.StudentExam = () => {
    const { useState, useEffect, useRef } = React;

    const [examState, setExamState] = useState('ready');
    const [timeLeft,  setTimeLeft]  = useState(45*60);
    const [answers,   setAnswers]   = useState({});
    const timerRef = useRef(null);

    useEffect(() => {
        if (examState==='testing') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev<=1) { clearInterval(timerRef.current); setExamState('done'); return 0; }
                    return prev-1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [examState]);

    useEffect(() => {
        const onBlur = () => {
            if (examState==='testing') alert('คำเตือน! ระบบตรวจพบการสลับหน้าจอ (Anti-Cheat) ระบบบันทึกรายงานส่งครูแล้ว');
        };
        window.addEventListener('blur', onBlur);
        return () => window.removeEventListener('blur', onBlur);
    }, [examState]);

    const fmt = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
    const correctAnswers = { q1:'สวัสดี' };
    const calcScore = () => Object.entries(answers).filter(([k,v])=>correctAnswers[k]===v).length;

    if (examState==='testing') return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="bg-red-800 text-white p-4 flex justify-between items-center">
                <h2 className="font-bold">แบบทดสอบกลางภาค (กำลังสอบ)</h2>
                <div className={`text-xl font-black px-4 py-1 rounded font-mono ${timeLeft<300?'bg-red-500 animate-pulse':'bg-black/30'}`}>
                    {fmt(timeLeft)}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <p className="font-bold mb-4">1. คำศัพท์นี้มีความหมายว่าอย่างไร?</p>
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center mb-4 text-5xl rounded">你好</div>
                    <div className="space-y-2">
                        {['สวัสดี','ลาก่อน','ขอบคุณ','ขอโทษ'].map(opt => (
                            <label key={opt}
                                className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${answers['q1']===opt?'bg-red-50 border-red-300':'hover:bg-gray-50'}`}>
                                <input type="radio" name="q1" value={opt} checked={answers['q1']===opt}
                                    onChange={e=>setAnswers(p=>({...p,q1:e.target.value}))} className="w-4 h-4 text-red-600"/>
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button onClick={()=>{clearInterval(timerRef.current);setExamState('done');}}
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700">
                    ส่งข้อสอบ
                </button>
            </div>
        </div>
    );

    if (examState==='done') return (
        <div className="text-center py-20">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="fa-check" size={48}/>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">ส่งข้อสอบเรียบร้อย</h2>
            <p className="text-xl text-gray-600 mb-2">ตอบถูก: <strong className="text-red-600">{calcScore()}</strong> / {Object.keys(correctAnswers).length} ข้อ</p>
            <p className="text-sm text-gray-400 mb-6">ครูจะประกาศคะแนนรวมในภายหลัง</p>
            <button onClick={()=>{setExamState('ready');setTimeLeft(45*60);setAnswers({});}} className="text-blue-600 hover:underline">กลับหน้าหลัก</button>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border-t-4 border-red-700 text-center">
            <Icon name="fa-exclamation-circle" size={48} className="mx-auto text-red-600 mb-4 block"/>
            <h2 className="text-2xl font-bold mb-2">สอบกลางภาค ภาษาจีน 5</h2>
            <p className="text-gray-600 mb-6">ข้อสอบปรนัย 20 ข้อ 20 คะแนน (เวลา 45 นาที)</p>
            <div className="bg-red-50 text-red-800 p-4 rounded text-left text-sm mb-6 space-y-1">
                <p className="font-bold">กฎระเบียบการสอบ:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>ระบบมีการเปิดใช้งานป้องกันการทุจริต</li>
                    <li>ห้ามสลับแท็บ ย่อหน้าจอ หรือเปิดโปรแกรมอื่นขณะสอบ</li>
                    <li>ระบบจะแจ้งครูทันทีเมื่อตรวจพบ</li>
                </ul>
            </div>
            <button onClick={()=>setExamState('testing')}
                className="bg-red-700 text-white font-bold text-lg py-3 px-10 rounded-full shadow-lg hover:bg-red-800 hover:scale-105 transition-all">
                รับทราบและเริ่มทำข้อสอบ
            </button>
        </div>
    );
};

// js/components/student-submit.jsx

// ── StudentSubmitWork — ส่งงานออนไลน์ ──
window.StudentSubmitWork = ({ user }) => {
    const { useState, useEffect } = React;

    const [assignments,   setAssignments]   = useState([]);
    const [mySubmissions, setMySubmissions] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [selected,      setSelected]      = useState(null);
    const [link,          setLink]          = useState('');
    const [isPublic,      setIsPublic]      = useState(false);
    const [submitting,    setSubmitting]     = useState(false);
    const [doneMsg,       setDoneMsg]        = useState('');

    useEffect(() => {
        const unsubA = db.collection('assignments').orderBy('createdAt','desc').onSnapshot(
            snap => { setAssignments(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
            () => setLoading(false)
        );
        const unsubS = db.collection('submissions')
            .where('studentId','==',user.id)
            .orderBy('timestamp','desc')
            .onSnapshot(
                snap => setMySubmissions(snap.docs.map(d=>({id:d.id,...d.data()}))),
                () => {}
            );
        return () => { unsubA(); unsubS(); };
    }, [user.id]);

    const alreadySubmitted = (title) => mySubmissions.find(s=>s.assignmentTitle===title);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selected) return;
        if (!isPublic) { alert('กรุณายืนยันว่าเปิดสิทธิ์เข้าถึงลิงก์แล้ว'); return; }
        setSubmitting(true);
        try {
            await db.collection('submissions').add({
                studentId:       user.id,
                studentName:     user.name,
                studentClass:    user.class,
                assignmentTitle: selected.title,
                assignmentId:    selected.id,
                link,
                status:          'pending',
                score:           null,
                timestamp:       firebase.firestore.FieldValue.serverTimestamp(),
            });
            setDoneMsg(selected.title);
            setSelected(null);
            setLink('');
            setIsPublic(false);
        } catch {
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
        }
        setSubmitting(false);
    };

    if (loading) return (
        <div className="text-center py-20">
            <Icon name="fa-spinner fa-spin" size={32} className="text-red-600 block mx-auto mb-2"/>
            <p className="text-gray-500">กำลังโหลด...</p>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">ส่งงานออนไลน์</h2>

            {doneMsg && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Icon name="fa-check-circle" size={20} className="text-green-600"/>
                    <p className="text-green-700 font-medium">ส่งงาน "<strong>{doneMsg}</strong>" เรียบร้อยแล้ว ครูจะตรวจและให้คะแนนเร็วๆ นี้</p>
                    <button onClick={()=>setDoneMsg('')} className="ml-auto text-gray-400 hover:text-gray-600"><Icon name="fa-xmark" size={16}/></button>
                </div>
            )}

            {assignments.length===0 ? (
                <div className="bg-white p-10 rounded-xl text-center text-gray-400">
                    <Icon name="fa-tasks" size={48} className="mb-4 block mx-auto opacity-30"/>
                    <p>ยังไม่มีงานที่ครูสั่ง</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map(a => {
                        const sub = alreadySubmitted(a.title);
                        return (
                            <div key={a.id} className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${selected?.id===a.id ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-base text-gray-800">{a.title}</h3>
                                            {a.course && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.course}</span>}
                                        </div>
                                        {a.description && <p className="text-sm text-gray-500 mb-2">{a.description}</p>}
                                        <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                                            {a.deadline && <span><Icon name="fa-calendar" size={11} className="mr-1"/>กำหนดส่ง: {a.deadline}</span>}
                                            <span><Icon name="fa-star" size={11} className="mr-1"/>คะแนน: {a.maxScore}</span>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        {sub ? (
                                            <div className="text-right">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${sub.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                                                    {sub.status==='pending' ? 'รอตรวจ' : `ได้ ${sub.score}/${a.maxScore} คะแนน`}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">ส่งแล้ว</p>
                                            </div>
                                        ) : (
                                            <button onClick={()=>setSelected(selected?.id===a.id ? null : a)}
                                                className={`text-sm px-4 py-2 rounded-lg font-medium transition-all ${selected?.id===a.id ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}>
                                                {selected?.id===a.id ? 'ยกเลิก' : 'ส่งงาน'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {selected?.id===a.id && (
                                    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-red-100 space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">วางลิงก์ผลงาน (URL)</label>
                                            <input type="url" required placeholder="https://drive.google.com/... หรือ https://youtu.be/..."
                                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                                                value={link} onChange={e=>setLink(e.target.value)}/>
                                        </div>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs text-blue-700 mb-2">ตรวจสอบให้แน่ใจว่าตั้งค่าเป็น <strong>"ทุกคนที่มีลิงก์"</strong> มิฉะนั้นจะได้ 0 คะแนน</p>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" required checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} className="w-4 h-4"/>
                                                <span className="text-xs font-bold text-red-700">ข้าพเจ้าได้เปิดสิทธิ์การเข้าถึงลิงก์แล้ว</span>
                                            </label>
                                        </div>
                                        <button type="submit" disabled={submitting}
                                            className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg hover:bg-red-800 disabled:opacity-70 flex items-center justify-center gap-2 text-sm">
                                            {submitting ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังส่ง...</> : <><Icon name="fa-paper-plane" size={14}/> ส่งงาน</>}
                                        </button>
                                    </form>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ประวัติการส่งงาน */}
            {mySubmissions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="font-bold text-base text-gray-700 mb-3"><Icon name="fa-history" size={14} className="mr-2"/>ประวัติการส่งงาน</h3>
                    <div className="space-y-2">
                        {mySubmissions.map(s => (
                            <div key={s.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                                <span className="text-gray-700">{s.assignmentTitle}</span>
                                <div className="flex items-center gap-2">
                                    <a href={s.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">ดูลิงก์</a>
                                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${s.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>
                                        {s.status==='pending' ? 'รอตรวจ' : `${s.score} คะแนน`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── StudentDashboard ──
window.StudentDashboard = ({ user }) => {
    const { useState, useEffect } = React;

    const [stats, setStats] = useState({ score:null, pending:null, attendance:null });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [gradesSnap, pendingSnap, attSnap] = await Promise.all([
                    db.collection('grades').where('studentId','==',user.id).get(),
                    db.collection('submissions').where('studentId','==',user.id).where('status','==','pending').get(),
                    db.collection('attendance').where('studentId','==',user.id).where('status','==','มา').get(),
                ]);
                setStats({
                    score:      gradesSnap.docs.reduce((sum,d)=>sum+(d.data().score||0),0),
                    pending:    pendingSnap.size,
                    attendance: attSnap.size,
                });
            } catch {}
        };
        loadStats();
    }, [user.id]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">你好, {user.name} 👋</h1>
                <p className="text-red-100">ยินดีต้อนรับสู่ห้องเรียนภาษาจีน ครูกีรติ | {user.class} เลขที่ {user.no}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {icon:'fa-chart-bar',      bg:'bg-orange-100',color:'text-orange-600',label:'คะแนนเก็บสะสม',  val: stats.score!==null ? stats.score : '—'},
                    {icon:'fa-cloud-upload-alt',bg:'bg-blue-100',  color:'text-blue-600',  label:'งานรอตรวจ',      val: stats.pending!==null ? React.createElement('span', {className: stats.pending>0?'text-red-500':'text-green-600'}, `${stats.pending} งาน`) : '—'},
                    {icon:'fa-check-square',    bg:'bg-green-100', color:'text-green-600', label:'วันที่มาเรียน',  val: stats.attendance!==null ? `${stats.attendance} วัน` : '—'},
                ].map((c,i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`p-4 ${c.bg} ${c.color} rounded-full w-12 h-12 flex items-center justify-center`}>
                            <Icon name={c.icon} size={20}/>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{c.label}</p>
                            <p className="text-2xl font-bold">{c.val}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">ประกาศจากครูผู้สอน</h3>
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800">สัปดาห์หน้าจะมีการสอบกลางภาค ขอให้นักเรียนทบทวนคำศัพท์บทที่ 1-3 และเตรียมคอมพิวเตอร์ให้พร้อม</p>
                </div>
            </div>
        </div>
    );
};

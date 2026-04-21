/* ════════════════════════════════════════════
   dashboard.jsx — AdminDashboard, StudentDashboard
   ════════════════════════════════════════════ */

const { useState: useStateDash, useEffect: useEffectDash } = React;

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
window.AdminDashboard = ({ setCurrentView }) => {
    const [studentCount, setStudentCount] = useStateDash(0);
    const [courseCount,  setCourseCount]  = useStateDash(0);
    const [pendingCount, setPendingCount] = useStateDash(0);

    useEffectDash(() => {
        const u1 = db.collection('students').onSnapshot(
            s => setStudentCount(s.size), ()=>{});
        const u2 = db.collection('submissions').where('status','==','pending').onSnapshot(
            s => setPendingCount(s.size), ()=>{});
        const u3 = db.collection('courses').onSnapshot(
            s => setCourseCount(s.size), ()=>{});
        return () => { u1(); u2(); u3(); };
    }, []);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">ยินดีต้อนรับ, ครูกีรติ ประสพพรรังสี</h1>
                <p className="text-red-100">ภาพรวมระบบจัดการการสอนภาษาจีน ประจำปีการศึกษา 2569</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {[
                    {icon:'fa-users',       bg:'bg-blue-100',   color:'text-blue-600',   label:'นักเรียนทั้งหมด', value:`${studentCount} คน`},
                    {icon:'fa-book-open',   bg:'bg-green-100',  color:'text-green-600',  label:'รายวิชา',         value:`${courseCount} วิชา`},
                    {icon:'fa-check-square',bg:'bg-orange-100', color:'text-orange-600', label:'รอตรวจงาน',       value:<span className={pendingCount>0?'text-red-500':'text-green-600'}>{pendingCount} งาน</span>},
                    {icon:'fa-fire',        bg:'bg-orange-100', color:'text-orange-600', label:'ฐานข้อมูล',       value:<span className="text-orange-500 font-bold">Firebase</span>},
                ].map((card,i) => (
                    <div key={i} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
                        <div className={`p-3 md:p-4 ${card.bg} ${card.color} rounded-full w-11 h-11 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0`}>
                            <Icon name={card.icon} size={20}/>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm text-gray-500">{card.label}</p>
                            <p className="text-lg md:text-2xl font-bold truncate">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4">เมนูลัด (Quick Actions)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        {view:'attendance',  icon:'fa-barcode', color:'text-red-700',    label:'เช็คชื่อเข้าเรียน'},
                        {view:'randomizer',  icon:'fa-gamepad', color:'text-yellow-600', label:'สุ่มรายชื่อเกม'},
                        {view:'id-card',     icon:'fa-id-card', color:'text-blue-600',   label:'สร้างบัตร QR Code'},
                        {view:'assignments', icon:'fa-inbox',   color:'text-purple-600', label:'ตรวจงานออนไลน์'},
                    ].map(btn => (
                        <button key={btn.view} onClick={()=>setCurrentView && setCurrentView(btn.view)}
                            className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition text-center flex flex-col items-center gap-2">
                            <Icon name={btn.icon} className={btn.color} size={24}/>
                            <span className="text-sm font-bold text-gray-700">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════
   STUDENT DASHBOARD (ดึงข้อมูลจาก Firestore)
══════════════════════════════════════════ */
window.StudentDashboard = ({ user }) => {
    const [stats,         setStats]         = useStateDash({ score:null, pending:null, attendance:null });
    const [announcements, setAnnouncements] = useStateDash([]);
    const [annLoading,    setAnnLoading]    = useStateDash(true);

    useEffectDash(() => {
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

    /* โหลดประกาศจากรายวิชาที่ห้องเรียนของนักเรียนอยู่ */
    useEffectDash(() => {
        if (!user.class) { setAnnLoading(false); return; }
        db.collection('announcements')
            .where('classrooms', 'array-contains', user.class)
            .get()
            .then(snap => {
                const list = snap.docs.map(d => ({ id:d.id, ...d.data() }));
                /* เรียงปักหมุดก่อน แล้วล่าสุดก่อน */
                list.sort((a, b) => {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    return (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0);
                });
                setAnnouncements(list);
            })
            .catch(() => {})
            .finally(() => setAnnLoading(false));
    }, [user.class]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold mb-2">你好, {user.name} 👋</h1>
                <p className="text-red-100">ยินดีต้อนรับสู่ห้องเรียนภาษาจีน ครูกีรติ | {user.class} เลขที่ {user.no}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    {icon:'fa-chart-bar',       bg:'bg-orange-100', color:'text-orange-600', label:'คะแนนเก็บสะสม', val: stats.score!==null ? stats.score : '—'},
                    {icon:'fa-cloud-upload-alt', bg:'bg-blue-100',   color:'text-blue-600',   label:'งานรอตรวจ',     val: stats.pending!==null ? <span className={stats.pending>0?'text-red-500':'text-green-600'}>{stats.pending} งาน</span> : '—'},
                    {icon:'fa-check-square',     bg:'bg-green-100',  color:'text-green-600',  label:'วันที่มาเรียน', val: stats.attendance!==null ? `${stats.attendance} วัน` : '—'},
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

            {/* ── ประกาศจากครูผู้สอน ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Icon name="fa-bullhorn" size={16} className="text-yellow-600"/>
                    <h3 className="font-bold text-lg text-gray-800">ประกาศจากครูผู้สอน</h3>
                    {announcements.length > 0 && (
                        <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
                            {announcements.length} รายการ
                        </span>
                    )}
                </div>
                <div className="p-5 space-y-3">
                    {annLoading ? (
                        <div className="text-center py-6 text-gray-400">
                            <Icon name="fa-spinner fa-spin" size={22} className="block mx-auto mb-2"/>
                            <p className="text-sm">กำลังโหลดประกาศ...</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                            <Icon name="fa-bell-slash" size={28} className="block mx-auto mb-2 opacity-40"/>
                            <p className="text-sm">ยังไม่มีประกาศในขณะนี้</p>
                        </div>
                    ) : announcements.map(a => (
                        <div key={a.id}
                            className={`flex gap-3 p-4 rounded-xl border-l-4 ${a.pinned ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                            <div className="flex-shrink-0 mt-0.5">
                                {a.pinned
                                    ? <Icon name="fa-thumbtack" size={14} className="text-yellow-500"/>
                                    : <Icon name="fa-comment-alt" size={14} className="text-gray-400"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.message}</p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <span className="text-xs text-gray-400">
                                        {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('th-TH', {day:'numeric',month:'long',year:'numeric'}) : ''}
                                    </span>
                                    <span className="text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                                        {a.courseName}
                                    </span>
                                    {a.pinned && (
                                        <span className="text-xs bg-yellow-200 text-yellow-800 font-bold px-1.5 py-0.5 rounded">ปักหมุด</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

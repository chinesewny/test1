// js/components/grading.jsx

/* แปลงอักขระแป้นพิมพ์ไทย (Kedmanee) แถวตัวเลขกลับเป็น ASCII digit */
const fixThaiKeyboard = (input) => {
    const map = {'จ':'0','ๅ':'1','ๆ':'2','๘':'3','๔':'4','๕':'5','ู':'6','ึ':'7','ค':'8','ต':'9'};
    return input.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
};

// ── POSGrading — ให้คะแนน (POS Scan) ──
window.POSGrading = () => {
    const { useState, useEffect, useRef } = React;

    const [scanInput,            setScanInput]            = useState('');
    const [selectedScore,        setSelectedScore]        = useState(null);
    const [manualScore,          setManualScore]          = useState('');
    const [showManualModal,      setShowManualModal]      = useState(false);
    const [currentScannedStudent,setCurrentScannedStudent]= useState(null);
    const [gradeLog,             setGradeLog]             = useState([]);
    const [saving,               setSaving]               = useState(false);
    const [assignments,          setAssignments]          = useState([]);
    const [selectedAssignment,   setSelectedAssignment]   = useState('');
    const inputRef  = useRef(null);
    const today     = new Date().toISOString().split('T')[0];

    const selectedAssignObj = assignments.find(a => a.title === selectedAssignment);
    const maxScore = selectedAssignObj ? Number(selectedAssignObj.maxScore) : 10;

    useEffect(() => {
        db.collection('assignments').orderBy('createdAt','desc').get()
            .then(snap => {
                const list = snap.docs.map(d=>({id:d.id,...d.data()}));
                setAssignments(list);
                if (list.length > 0 && !selectedAssignment) setSelectedAssignment(list[0].title);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        inputRef.current?.focus();
        if (!selectedAssignment) return;
        const unsub = db.collection('grades')
            .where('date','==',today)
            .where('assignment','==',selectedAssignment)
            .orderBy('timestamp','desc')
            .onSnapshot(
                snap => setGradeLog(snap.docs.map(d=>({firestoreId:d.id,...d.data()}))),
                () => {}
            );
        return () => unsub();
    }, [selectedAssignment]);

    const handleScan = async (e) => {
        e.preventDefault();
        const rawInput = fixThaiKeyboard(scanInput.trim());
        if (!rawInput) return;
        if (!selectedAssignment) { alert('กรุณาเลือกชิ้นงานก่อน'); return; }
        let student = null;
        try {
            const doc = await db.collection('students').doc(rawInput).get();
            if (doc.exists) student = doc.data();
        } catch { alert('ไม่สามารถเชื่อมต่อฐานข้อมูลได้'); setScanInput(''); return; }
        if (!student) { alert('ไม่พบรหัสนักเรียน'); setScanInput(''); return; }
        setCurrentScannedStudent(student);
        if (selectedScore !== null) recordGrade(student, selectedScore);
        else setShowManualModal(true);
        setScanInput('');
    };

    const recordGrade = async (student, score) => {
        const s = Number(score);
        if (s < 0 || s > maxScore) { alert(`คะแนนต้องอยู่ระหว่าง 0-${maxScore}`); return; }
        setSaving(true);
        try {
            await db.collection('grades').add({
                studentId: student.id, name: student.name, class: student.class,
                no: student.no, assignment: selectedAssignment, score: s, maxScore,
                date: today, timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch { alert('บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ'); }
        setSaving(false); setShowManualModal(false); setManualScore('');
        setSelectedScore(null); inputRef.current?.focus();
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Icon name="fa-barcode" className="text-red-700" size={24}/> ระบบให้คะแนน (POS Scan)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">ชิ้นงาน / งานที่สั่ง</label>
                        {assignments.length === 0 ? (
                            <p className="text-xs text-orange-500 p-2 bg-orange-50 rounded border border-orange-200">ยังไม่มีชิ้นงาน</p>
                        ) : (
                            <select className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                value={selectedAssignment} onChange={e=>setSelectedAssignment(e.target.value)}>
                                {assignments.map(a => <option key={a.id} value={a.title}>{a.title}{a.maxScore ? ` (${a.maxScore} คะแนน)` : ''}</option>)}
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">1. เลือกล็อคคะแนน</label>
                        <div className="flex flex-wrap gap-2">
                            {[10,9,8,7,5,null].map(score => (
                                <button key={score??'m'} onClick={()=>{setSelectedScore(score);inputRef.current?.focus();}}
                                    className={`py-2 px-3 rounded-lg border text-sm font-bold flex-1 text-center transition-all ${selectedScore===score?'bg-yellow-500 text-white border-yellow-600':'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                    {score===null?'พิมพ์เอง':score}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">2. สแกนเพื่อให้คะแนน</label>
                        <form onSubmit={handleScan}>
                            <input ref={inputRef} type="text" value={scanInput} onChange={e=>setScanInput(e.target.value)}
                                placeholder="สแกนรหัส..."
                                className="w-full p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50 text-center text-xl font-bold focus:outline-none focus:border-yellow-600"/>
                        </form>
                        {saving && <p className="text-xs text-center mt-2 text-blue-500 flex items-center justify-center gap-1"><Icon name="fa-spinner fa-spin" size={12}/> บันทึก...</p>}
                    </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[500px] flex flex-col">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><Icon name="fa-fire" size={14} className="text-orange-500"/> คะแนนวันนี้ (Real-time)</h3>
                        <span className="text-sm bg-gray-200 py-1 px-3 rounded-full">{gradeLog.length} คน</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {gradeLog.length===0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Icon name="fa-barcode" size={40} className="mb-3 opacity-50"/><p>ยังไม่มีการให้คะแนน</p>
                            </div>
                        ) : gradeLog.map((log,i) => (
                            <div key={log.firestoreId||i} className="p-3 rounded border border-gray-100 flex items-center justify-between bg-white shadow-sm animate-fade-in-down">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center font-bold text-xs">{log.no}</div>
                                    <div><p className="font-bold text-sm">{log.name}</p><p className="text-xs text-gray-500">{log.studentId||log.id}</p></div>
                                </div>
                                <div><span className="text-xl font-black text-green-600">{log.score}</span><span className="text-gray-400 text-sm">/{log.maxScore||maxScore}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {showManualModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold mb-2">{currentScannedStudent?.name}</h3>
                        <p className="text-gray-500 mb-6">กรุณาระบุคะแนน (เต็ม {maxScore})</p>
                        <input type="number" min="0" max={maxScore} autoFocus
                            className="w-full text-center text-4xl font-bold p-4 border-b-4 border-red-500 outline-none mb-6 bg-gray-50"
                            value={manualScore} onChange={e=>setManualScore(e.target.value)}
                            onKeyDown={e=>{ if(e.key==='Enter') recordGrade(currentScannedStudent,manualScore); }}/>
                        <div className="flex gap-2">
                            <button onClick={()=>setShowManualModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded font-bold">ยกเลิก</button>
                            <button onClick={()=>recordGrade(currentScannedStudent,manualScore)} className="flex-1 py-3 bg-red-700 text-white rounded font-bold">บันทึก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// ── GradeManager — จัดการคะแนนทั้งหมด ──
window.GradeManager = () => {
    const { useState, useEffect, useRef } = React;

    const [courses,        setCourses]        = useState([]);
    const [selCourse,      setSelCourse]      = useState(null);
    const [students,       setStudents]       = useState([]);
    const [scores,         setScores]         = useState({});   // {studentId: {_docId, ...fields}}
    const [filterClass,    setFilterClass]    = useState('ทั้งหมด');
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingStudents,setLoadingStudents]= useState(false);
    const [editCell,       setEditCell]       = useState(null); // {studentId, field}
    const [editVal,        setEditVal]        = useState('');
    const [saving,         setSaving]         = useState(false);
    const [activeView,     setActiveView]     = useState('table');
    const editRef   = useRef(null);
    const savingRef = useRef(false);

    /* โหลดรายวิชา */
    useEffect(() => {
        db.collection('courses').orderBy('name').get()
            .then(snap => {
                const list = snap.docs.map(d => ({id:d.id,...d.data()}));
                setCourses(list);
                if (list.length > 0) setSelCourse(list[0]);
            })
            .catch(()=>{})
            .finally(()=>setLoadingCourses(false));
    }, []);

    /* โหลดนักเรียนในรายวิชา */
    useEffect(() => {
        if (!selCourse) return;
        setLoadingStudents(true);
        setFilterClass('ทั้งหมด');
        const rooms = selCourse.classrooms || [];

        const load = rooms.length > 0
            ? (() => {
                const chunks = [];
                for (let i=0; i<rooms.length; i+=10) chunks.push(rooms.slice(i,i+10));
                return Promise.all(chunks.map(ch =>
                    db.collection('students').where('class','in',ch).get()
                )).then(snaps => {
                    const list = [];
                    snaps.forEach(snap => snap.docs.forEach(d => list.push(d.data())));
                    return list;
                });
            })()
            : db.collection('students').get().then(s => s.docs.map(d=>d.data()));

        load.then(list => {
            list.sort((a,b) => {
                const cc = (a.class||'').localeCompare(b.class||'');
                return cc !== 0 ? cc : (Number(a.no)||0)-(Number(b.no)||0);
            });
            setStudents(list);
        })
        .catch(()=>setStudents([]))
        .finally(()=>setLoadingStudents(false));
    }, [selCourse?.id]);

    /* โหลดคะแนน real-time */
    useEffect(() => {
        if (!selCourse) return;
        const unsub = db.collection('studentScores')
            .where('courseId','==',selCourse.id)
            .onSnapshot(
                snap => {
                    const map = {};
                    snap.docs.forEach(d => { map[d.data().studentId] = {_docId:d.id,...d.data()}; });
                    setScores(map);
                }, ()=>{}
            );
        return () => unsub();
    }, [selCourse?.id]);

    /* โฟกัส input เมื่อเปิด edit */
    useEffect(() => {
        if (editCell) setTimeout(()=>editRef.current?.focus(), 30);
    }, [editCell]);

    /* helpers */
    const getItems = (c) => c?.continuousItems?.length > 0
        ? c.continuousItems
        : [{label:'คะแนนเก็บ', score: Number(c?.continuous)||50}];

    const calcTotal = (sd, c) => {
        if (!c) return 0;
        const items = getItems(c);
        const contSum  = items.reduce((s,it) => s + Number(sd?.[`cont_${it.label}`]||0), 0);
        const mid      = Number(sd?.midterm||0);
        const midR     = Number(sd?.midtermRetake||0);
        const fin      = Number(sd?.final||0);
        return Math.round((contSum + Math.max(mid,midR) + fin)*10)/10;
    };

    const calcGrade = (total) => {
        if (total>=80) return {gpa:'4.0',letter:'A',  tw:'bg-green-100 text-green-800'};
        if (total>=75) return {gpa:'3.5',letter:'B+', tw:'bg-green-50 text-green-700'};
        if (total>=70) return {gpa:'3.0',letter:'B',  tw:'bg-blue-50 text-blue-700'};
        if (total>=65) return {gpa:'2.5',letter:'C+', tw:'bg-blue-50 text-blue-600'};
        if (total>=60) return {gpa:'2.0',letter:'C',  tw:'bg-yellow-50 text-yellow-700'};
        if (total>=55) return {gpa:'1.5',letter:'D+', tw:'bg-orange-50 text-orange-600'};
        if (total>=50) return {gpa:'1.0',letter:'D',  tw:'bg-orange-100 text-orange-700'};
        return              {gpa:'0.0',letter:'F',  tw:'bg-red-100 text-red-700'};
    };

    const scoreColor = (val, max) => {
        if (val===undefined||val===null||val==='') return 'text-gray-300';
        const pct = Number(val)/Number(max);
        if (pct>=0.8) return 'text-green-700 font-bold';
        if (pct>=0.6) return 'text-blue-600 font-bold';
        if (pct>=0.5) return 'text-yellow-600 font-bold';
        return 'text-red-500 font-bold';
    };

    const openEdit = (studentId, field, curVal) => {
        setEditCell({studentId, field});
        setEditVal(curVal !== undefined && curVal !== null ? String(curVal) : '');
    };

    const commitSave = async (student) => {
        if (!editCell || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        const docId   = `${student.id}_${selCourse.id}`;
        const existing = scores[student.id];
        const val      = editVal==='' ? 0 : Number(editVal);
        try {
            const data = {
                studentId:   student.id,
                studentName: student.name,
                class:       student.class,
                no:          student.no,
                courseId:    selCourse.id,
                courseName:  selCourse.name,
                [editCell.field]: val,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            };
            const ref = existing
                ? db.collection('studentScores').doc(existing._docId)
                : db.collection('studentScores').doc(docId);
            await ref.set(data, {merge:true});
        } catch { alert('บันทึกไม่สำเร็จ'); }
        setSaving(false);
        savingRef.current = false;
        setEditCell(null);
    };

    const cancelEdit = () => setEditCell(null);

    /* Export CSV */
    const exportCSV = () => {
        if (!selCourse) return;
        const items  = getItems(selCourse);
        const midMax = Number(selCourse.midterm||20);
        const finMax = Number(selCourse.final||30);
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;  // ครอบ text ป้องกัน comma
        const bom = '\uFEFF';
        const header = ['เลขที่','รหัส',q('ชื่อ-สกุล'),q('ห้อง'),
            ...items.map(it=>q(`${it.label}(${it.score})`)),
            q(`รวมเก็บ(${Number(selCourse.continuous||50)})`),
            q(`กลางภาค(${midMax})`), q(`แก้กลางภาค(${midMax})`), q(`ปลายภาค(${finMax})`),
            'รวม(100)', q('เกรด'), 'GPA'
        ].join(',');
        const rows = filteredStudents.map(s => {
            const sd      = scores[s.id]||{};
            const total   = calcTotal(sd, selCourse);
            const grade   = calcGrade(total);
            const contSum = items.reduce((sum,it)=>sum+Number(sd[`cont_${it.label}`]||0),0);
            return [s.no, s.id, q(s.name), q(s.class),
                ...items.map(it => sd[`cont_${it.label}`] ?? ''),
                contSum,
                sd.midterm??'', sd.midtermRetake??'', sd.final??'',
                total||'', grade.letter, grade.gpa
            ].join(',');
        }).join('\n');
        const blob = new Blob([bom+header+'\n'+rows],{type:'text/csv;charset=utf-8;'});
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(blob),
            download: `คะแนน_${selCourse.name}_${filterClass}_${new Date().toISOString().split('T')[0]}.csv`
        });
        a.click(); URL.revokeObjectURL(a.href);
    };

    /* Derived */
    const items          = getItems(selCourse);
    const midMax         = Number(selCourse?.midterm||20);
    const finMax         = Number(selCourse?.final||30);
    const contMax        = Number(selCourse?.continuous||50);
    const classList      = ['ทั้งหมด',...new Set(students.map(s=>s.class).filter(Boolean))].sort();
    const filteredStudents = filterClass==='ทั้งหมด'
        ? students
        : students.filter(s=>s.class===filterClass);

    /* สรุปรายห้อง */
    const classSummary = classList.filter(c=>c!=='ทั้งหมด').map(cls => {
        const ss     = students.filter(s=>s.class===cls);
        const totals = ss.map(s=>calcTotal(scores[s.id]||{},selCourse));
        const filled = totals.filter(t=>t>0);
        const avg    = filled.length ? (filled.reduce((a,b)=>a+b,0)/filled.length).toFixed(1) : '-';
        const dist   = {};
        totals.forEach(t=>{ const g=calcGrade(t).letter; dist[g]=(dist[g]||0)+1; });
        return {cls, total:ss.length, filled:filled.length, avg, dist};
    });

    const statCards = [
        {label:'นักเรียนทั้งหมด', value:filteredStudents.length, color:'text-blue-600', bg:'bg-blue-50'},
        {label:'กรอกข้อมูลแล้ว',  value:filteredStudents.filter(s=>scores[s.id]).length, color:'text-green-600', bg:'bg-green-50'},
        {label:'คะแนนเฉลี่ย',    value: (() => {
            const ts = filteredStudents.map(s=>calcTotal(scores[s.id]||{},selCourse)).filter(t=>t>0);
            return ts.length ? (ts.reduce((a,b)=>a+b,0)/ts.length).toFixed(1) : '-';
        })(), color:'text-purple-600', bg:'bg-purple-50'},
        {label:'ผ่าน (≥50%)',    value: filteredStudents.filter(s=>calcTotal(scores[s.id]||{},selCourse)>=50).length, color:'text-orange-600', bg:'bg-orange-50'},
    ];

    /* ── Cell helper (plain function — NOT a React component, avoids unmount/remount on each keystroke) ── */
    const renderScoreCell = (student, field, maxVal) => {
        const sd      = scores[student.id]||{};
        const curVal  = sd[field];
        const isEdit  = editCell?.studentId===student.id && editCell?.field===field;

        if (isEdit) return (
            <td key={`${student.id}_${field}`} className="px-2 py-1 text-center bg-yellow-50">
                <input ref={editRef} type="number" min={0} max={maxVal}
                    className="w-16 text-center border-b-2 border-yellow-500 outline-none bg-transparent font-bold text-sm"
                    value={editVal}
                    onChange={e=>setEditVal(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter') commitSave(student); if(e.key==='Escape') cancelEdit(); }}
                    onBlur={()=>commitSave(student)}/>
            </td>
        );

        return (
            <td key={`${student.id}_${field}`} className="px-2 py-2 text-center cursor-pointer hover:bg-yellow-50 transition-colors group"
                onClick={()=>openEdit(student.id, field, curVal)}
                title={`คลิกเพื่อแก้ไข (เต็ม ${maxVal})`}>
                <span className={`text-sm ${scoreColor(curVal, maxVal)}`}>
                    {curVal !== undefined && curVal !== null ? curVal : <span className="text-gray-200 group-hover:text-gray-400">-</span>}
                </span>
            </td>
        );
    };

    /* ── Render ── */
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="fa-chart-bar" className="text-red-700" size={24}/> จัดการคะแนน
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">คลิกที่ช่องคะแนนเพื่อแก้ไข • Enter หรือคลิกออกเพื่อบันทึก • Esc ยกเลิก</p>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <span className="text-xs text-blue-500 flex items-center gap-1 animate-pulse"><Icon name="fa-spinner fa-spin" size={12}/> บันทึก...</span>}
                    <button onClick={exportCSV} disabled={!selCourse||filteredStudents.length===0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-40 text-sm">
                        <Icon name="fa-download" size={14}/> Export CSV
                    </button>
                </div>
            </div>

            {/* Selectors */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">รายวิชา</label>
                    {loadingCourses ? <span className="text-sm text-gray-400">กำลังโหลด...</span> :
                     courses.length===0 ? <span className="text-sm text-orange-500">ยังไม่มีรายวิชา — กรุณาเพิ่มรายวิชาก่อน</span> : (
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300"
                            onChange={e=>setSelCourse(courses.find(c=>c.id===e.target.value)||null)}>
                            {courses.map(c=><option key={c.id} value={c.id}>{c.code?`[${c.code}] `:''}{c.name}</option>)}
                        </select>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">ห้องเรียน</label>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300"
                        value={filterClass} onChange={e=>setFilterClass(e.target.value)}>
                        {classList.map(c=><option key={c}>{c}</option>)}
                    </select>
                </div>
                {selCourse && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {[
                            {label:'คะแนนเก็บ', val:contMax, color:'bg-blue-100 text-blue-700'},
                            {label:'กลางภาค',   val:midMax,  color:'bg-yellow-100 text-yellow-700'},
                            {label:'ปลายภาค',   val:finMax,  color:'bg-red-100 text-red-700'},
                        ].map(b => (
                            <span key={b.label} className={`px-2 py-1 rounded-full font-bold ${b.color}`}>
                                {b.label}: {b.val}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statCards.map((s,i) => (
                    <div key={i} className={`${s.bg} p-3 rounded-xl text-center`}>
                        <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {[['table','fa-table','ตารางคะแนน'],['summary','fa-chart-pie','สรุปรายห้อง']].map(([v,ic,lb]) => (
                    <button key={v} onClick={()=>setActiveView(v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView===v?'bg-white shadow text-red-700':'text-gray-500 hover:text-gray-700'}`}>
                        <Icon name={ic} size={13}/>{lb}
                    </button>
                ))}
            </div>

            {/* ── ตารางคะแนน ── */}
            {activeView==='table' && (
                loadingStudents ? (
                    <div className="text-center py-16 text-gray-400">
                        <Icon name="fa-spinner fa-spin" size={32} className="block mx-auto mb-2"/> กำลังโหลดข้อมูล...
                    </div>
                ) : filteredStudents.length===0 ? (
                    <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
                        <Icon name="fa-users" size={40} className="block mx-auto mb-3 opacity-40"/>
                        <p>{selCourse?.classrooms?.length===0 ? 'รายวิชานี้ยังไม่ได้ผูกห้องเรียน — ไปที่ "จัดการรายวิชา" เพื่อเพิ่มห้องเรียน' : 'ไม่พบนักเรียน'}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    {/* Row 1: group headers */}
                                    <tr className="bg-red-800 text-white text-xs">
                                        <th colSpan={4} className="px-3 py-2 text-left border-r border-red-700">ข้อมูลนักเรียน</th>
                                        <th colSpan={items.length+1} className="px-3 py-2 text-center border-r border-red-700 bg-blue-700">
                                            คะแนนเก็บ (เต็ม {contMax})
                                        </th>
                                        <th colSpan={2} className="px-3 py-2 text-center border-r border-red-700 bg-yellow-600">
                                            กลางภาค (เต็ม {midMax})
                                        </th>
                                        <th className="px-3 py-2 text-center border-r border-red-700 bg-red-600">ปลายภาค<br/>(เต็ม {finMax})</th>
                                        <th className="px-3 py-2 text-center border-r border-red-700 bg-gray-700">รวม<br/>(100)</th>
                                        <th className="px-3 py-2 text-center bg-purple-700">เกรด</th>
                                    </tr>
                                    {/* Row 2: column names */}
                                    <tr className="bg-gray-100 text-gray-700 text-xs font-bold border-b-2 border-gray-300">
                                        <th className="px-3 py-2 text-center whitespace-nowrap">เลขที่</th>
                                        <th className="px-3 py-2 text-left whitespace-nowrap">รหัส</th>
                                        <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">ชื่อ-สกุล</th>
                                        <th className="px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap">ห้อง</th>
                                        {items.map(it => (
                                            <th key={it.label} className="px-3 py-2 text-center whitespace-nowrap text-blue-700 bg-blue-50">
                                                {it.label}<br/><span className="font-normal text-blue-500">({it.score})</span>
                                            </th>
                                        ))}
                                        <th className="px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap bg-blue-50 text-blue-800">รวมเก็บ</th>
                                        <th className="px-3 py-2 text-center whitespace-nowrap text-yellow-700 bg-yellow-50">กลางภาค<br/><span className="font-normal">({midMax})</span></th>
                                        <th className="px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-yellow-700 bg-yellow-50">แก้กลางภาค<br/><span className="font-normal text-xs">(ถ้าสูงกว่าใช้แทน)</span></th>
                                        <th className="px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-red-700 bg-red-50">ปลายภาค<br/><span className="font-normal">({finMax})</span></th>
                                        <th className="px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-gray-800 bg-gray-100 font-black">รวม</th>
                                        <th className="px-3 py-2 text-center whitespace-nowrap text-purple-700 bg-purple-50">เกรด / GPA</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredStudents.map((s, idx) => {
                                        const sd       = scores[s.id]||{};
                                        const contSum  = items.reduce((sum,it)=>sum+Number(sd[`cont_${it.label}`]||0),0);
                                        const total    = calcTotal(sd, selCourse);
                                        const grade    = calcGrade(total);
                                        const hasData  = Object.keys(sd).filter(k=>k!=='_docId'&&k!=='studentId'&&k!=='courseId'&&k!=='updatedAt').length > 0;
                                        const rowBg    = idx%2===0 ? 'bg-white' : 'bg-gray-50/50';
                                        const midUsed  = Math.max(Number(sd.midterm||0), Number(sd.midtermRetake||0));

                                        return (
                                            <tr key={s.id} className={`${rowBg} hover:bg-yellow-50/30 transition-colors`}>
                                                <td className="px-3 py-2 text-center text-gray-500 text-xs">{s.no}</td>
                                                <td className="px-3 py-2 font-mono text-xs text-gray-500">{s.id}</td>
                                                <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{s.name}</td>
                                                <td className="px-3 py-2 text-center border-r border-gray-200">
                                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded">{s.class}</span>
                                                </td>

                                                {/* คะแนนเก็บแต่ละช่อง */}
                                                {items.map(it => renderScoreCell(s, `cont_${it.label}`, Number(it.score)))}

                                                {/* รวมเก็บ (คำนวณ ไม่ edit) */}
                                                <td className="px-3 py-2 text-center border-r border-gray-200 bg-blue-50/50">
                                                    <span className={`text-sm font-bold ${scoreColor(contSum, contMax)}`}>
                                                        {hasData ? contSum : <span className="text-gray-200">-</span>}
                                                    </span>
                                                </td>

                                                {/* กลางภาค */}
                                                {renderScoreCell(s, 'midterm', midMax)}

                                                {/* แก้กลางภาค */}
                                                {(() => {
                                                    const isEdit = editCell?.studentId===s.id && editCell?.field==='midtermRetake';
                                                    const retakeVal = sd.midtermRetake;
                                                    if (isEdit) return (
                                                        <td key={`${s.id}_midtermRetake`} className="px-2 py-1 text-center bg-yellow-50 border-r border-gray-200">
                                                            <input ref={editRef} type="number" min={0} max={midMax}
                                                                className="w-16 text-center border-b-2 border-yellow-500 outline-none bg-transparent font-bold text-sm"
                                                                value={editVal} onChange={e=>setEditVal(e.target.value)}
                                                                onKeyDown={e=>{ if(e.key==='Enter') commitSave(s); if(e.key==='Escape') cancelEdit(); }}
                                                                onBlur={()=>commitSave(s)}/>
                                                        </td>
                                                    );
                                                    return (
                                                        <td key={`${s.id}_midtermRetake`} className="px-2 py-2 text-center cursor-pointer hover:bg-yellow-50 transition-colors group border-r border-gray-200"
                                                            onClick={()=>openEdit(s.id,'midtermRetake',retakeVal)}
                                                            title={`คลิกเพื่อแก้ไข (เต็ม ${midMax})`}>
                                                            <span className={`text-sm ${scoreColor(retakeVal, midMax)}`}>
                                                                {retakeVal !== undefined
                                                                    ? <>{retakeVal}{retakeVal>Number(sd.midterm||0)&&<span className="ml-1 text-green-500 text-xs">↑</span>}</>
                                                                    : <span className="text-gray-200 group-hover:text-gray-400">-</span>}
                                                            </span>
                                                        </td>
                                                    );
                                                })()}

                                                {/* ปลายภาค */}
                                                {renderScoreCell(s, 'final', finMax)}

                                                {/* รวม */}
                                                <td className="px-3 py-2 text-center border-r border-gray-200 bg-gray-50">
                                                    {hasData ? (
                                                        <span className={`text-base font-black ${scoreColor(total,100)}`}>{total}</span>
                                                    ) : <span className="text-gray-200">-</span>}
                                                </td>

                                                {/* เกรด */}
                                                <td className="px-3 py-2 text-center">
                                                    {hasData ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${grade.tw}`}>
                                                            {grade.letter} <span className="opacity-70">({grade.gpa})</span>
                                                        </span>
                                                    ) : <span className="text-gray-200">-</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {/* Footer summary */}
                                {filteredStudents.length > 0 && (() => {
                                    const validTotals = filteredStudents.map(s=>calcTotal(scores[s.id]||{},selCourse)).filter(t=>t>0);
                                    const avg = validTotals.length ? (validTotals.reduce((a,b)=>a+b,0)/validTotals.length).toFixed(1) : '-';
                                    return (
                                        <tfoot>
                                            <tr className="bg-gray-100 font-bold text-xs text-gray-600 border-t-2 border-gray-300">
                                                <td colSpan={4} className="px-3 py-2 border-r border-gray-300">
                                                    รวม {filteredStudents.length} คน / กรอกแล้ว {validTotals.length} คน
                                                </td>
                                                {items.map(it => {
                                                    const vals = filteredStudents.map(s=>Number(scores[s.id]?.[`cont_${it.label}`]||0)).filter((_,i)=>scores[filteredStudents[i].id]);
                                                    const a = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '-';
                                                    return <td key={it.label} className="px-3 py-2 text-center text-blue-700">เฉลี่ย {a}</td>;
                                                })}
                                                <td className="px-3 py-2 text-center border-r border-gray-300 text-blue-700">-</td>
                                                <td colSpan={2} className="px-3 py-2 text-center text-yellow-700">-</td>
                                                <td className="px-3 py-2 text-center border-r border-gray-300 text-red-700">-</td>
                                                <td className="px-3 py-2 text-center border-r border-gray-300 text-gray-800">เฉลี่ย {avg}</td>
                                                <td className="px-3 py-2 text-center text-purple-700">
                                                    {avg !== '-' ? calcGrade(Number(avg)).letter : '-'}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    );
                                })()}
                            </table>
                        </div>
                    </div>
                )
            )}

            {/* ── สรุปรายห้อง ── */}
            {activeView==='summary' && (
                <div className="space-y-4">
                    {classSummary.length===0 ? (
                        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
                            ไม่มีข้อมูลห้องเรียน
                        </div>
                    ) : classSummary.map(cs => {
                        const gradeOrder = ['A','B+','B','C+','C','D+','D','F'];
                        return (
                            <div key={cs.cls} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black text-red-700">{cs.cls}</span>
                                        <span className="text-sm text-gray-500">{cs.filled}/{cs.total} คน (กรอกแล้ว)</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">คะแนนเฉลี่ย</p>
                                        <p className={`text-2xl font-black ${cs.avg!=='-'?scoreColor(Number(cs.avg),100):'text-gray-300'}`}>
                                            {cs.avg}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {gradeOrder.map(g => {
                                        const count = cs.dist[g]||0;
                                        const grade = calcGrade(g==='A'?80:g==='B+'?75:g==='B'?70:g==='C+'?65:g==='C'?60:g==='D+'?55:g==='D'?50:0);
                                        return (
                                            <div key={g} className={`p-3 rounded-xl text-center border ${count>0?`${grade.tw} border-current/20`:'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                                <p className="text-lg font-black">{count}</p>
                                                <p className="text-xs font-bold">{g}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Progress bar */}
                                {cs.filled > 0 && (
                                    <div className="mt-4">
                                        <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
                                            {gradeOrder.filter(g=>cs.dist[g]).map(g => {
                                                const pct = ((cs.dist[g]||0)/cs.total*100).toFixed(1);
                                                const grade = calcGrade(g==='A'?80:g==='B+'?75:g==='B'?70:g==='C+'?65:g==='C'?60:g==='D+'?55:g==='D'?50:0);
                                                return <div key={g} style={{width:`${pct}%`}} className={`${grade.tw.split(' ')[0].replace('bg-','bg-').replace('50','400').replace('100','500')} transition-all`} title={`${g}: ${cs.dist[g]} คน`}/>;
                                            })}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {gradeOrder.filter(g=>cs.dist[g]).map(g => (
                                                <span key={g} className="text-xs text-gray-500">{g}: {cs.dist[g]} คน ({((cs.dist[g]||0)/cs.total*100).toFixed(0)}%)</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

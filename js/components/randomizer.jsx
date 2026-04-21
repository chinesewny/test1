// js/components/randomizer.jsx
window.RandomizerGame = () => {
    const { useState, useEffect, useRef } = React;

    const [isSpinning,       setIsSpinning]       = useState(false);
    const [selectedStudent,  setSelectedStudent]  = useState(null);
    const [allStudents,      setAllStudents]      = useState([]);
    const [availableStudents,setAvailableStudents]= useState([]);
    const [allowRepeat,      setAllowRepeat]      = useState(false);
    const [filterClass,      setFilterClass]      = useState('ทั้งหมด');
    const [loadingStudents,  setLoadingStudents]  = useState(true);
    const intervalRef = useRef(null);

    useEffect(() => {
        db.collection('students').orderBy('class').get()
            .then(snap => {
                const list = snap.docs.map(d => d.data());
                setAllStudents(list);
                setAvailableStudents(list);
            })
            .catch(() => {})
            .finally(() => setLoadingStudents(false));
    }, []);

    const classList = ['ทั้งหมด', ...new Set(allStudents.map(s=>s.class).filter(Boolean))].sort();

    const handleFilterClass = (cls) => {
        setFilterClass(cls);
        const base = cls === 'ทั้งหมด' ? allStudents : allStudents.filter(s=>s.class===cls);
        setAvailableStudents(base);
        setSelectedStudent(null);
    };

    const resetList = () => {
        const base = filterClass === 'ทั้งหมด' ? allStudents : allStudents.filter(s=>s.class===filterClass);
        setAvailableStudents(base);
        setSelectedStudent(null);
    };

    useEffect(() => () => { if(intervalRef.current) clearInterval(intervalRef.current); }, []);

    const startRandom = () => {
        if (availableStudents.length===0) { alert('รายชื่อหมดแล้ว! กรุณารีเซ็ต'); return; }
        setIsSpinning(true);
        setSelectedStudent(null);
        let counter = 0;
        intervalRef.current = setInterval(() => {
            setSelectedStudent(availableStudents[Math.floor(Math.random()*availableStudents.length)]);
            counter++;
            if (counter>=20) {
                clearInterval(intervalRef.current);
                setIsSpinning(false);
                const winner = availableStudents[Math.floor(Math.random()*availableStudents.length)];
                setSelectedStudent(winner);
                if (!allowRepeat) setAvailableStudents(prev=>prev.filter(s=>s.id!==winner.id));
            }
        }, 100);
    };

    if (loadingStudents) return (
        <div className="text-center py-20 text-white bg-red-900 rounded-3xl">
            <Icon name="fa-spinner fa-spin" size={36} className="mb-3 block mx-auto"/>
            <p>กำลังโหลดรายชื่อนักเรียน...</p>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-b from-red-900 to-red-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500 relative overflow-hidden">
            <h2 className="text-4xl font-black text-yellow-400 mb-4 flex items-center gap-4">
                <Icon name="fa-gamepad" size={40}/> สุ่มผู้โชคดีตอบคำถาม
            </h2>

            {/* Filter ห้องเรียน */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {classList.map(cls => (
                    <button key={cls} onClick={()=>handleFilterClass(cls)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterClass===cls ? 'bg-yellow-400 text-red-900' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                        {cls}
                    </button>
                ))}
            </div>

            {allStudents.length === 0 ? (
                <div className="text-white/70 text-xl py-10">ยังไม่มีนักเรียนในระบบ กรุณาเพิ่มนักเรียนก่อน</div>
            ) : (
                <>
                    <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-2xl text-center border border-white/20 shadow-xl mb-8 min-h-[200px] flex items-center justify-center">
                        {selectedStudent ? (
                            <div className={`transition-all duration-300 ${isSpinning?'scale-90 opacity-70 blur-sm':'scale-110 opacity-100'}`}>
                                <div className="text-2xl text-red-200 mb-2">เลขที่ {selectedStudent.no} | {selectedStudent.class}</div>
                                <div className="text-5xl font-black text-white drop-shadow-lg mb-4">{selectedStudent.name}</div>
                                <div className="text-xl text-yellow-300 bg-black/30 inline-block px-6 py-2 rounded-full">รหัส: {selectedStudent.id}</div>
                            </div>
                        ) : (
                            <div className="text-3xl font-bold text-white/50">พร้อมแล้ว กดปุ่มสุ่มเลย!</div>
                        )}
                    </div>
                    <button onClick={startRandom} disabled={isSpinning || availableStudents.length===0}
                        className="bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_#b45309] hover:shadow-[0_2px_0_#b45309] hover:translate-y-[4px] transition-all disabled:opacity-50 flex items-center gap-2">
                        <Icon name="fa-play"/> {isSpinning?'กำลังสุ่ม...':'สุ่มเลย!'}
                    </button>
                    <div className="mt-8 flex gap-6 text-white bg-black/20 p-4 rounded-xl flex-wrap justify-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={allowRepeat} onChange={e=>setAllowRepeat(e.target.checked)} className="w-5 h-5 accent-yellow-500"/>
                            <span>อนุญาตให้สุ่มซ้ำ</span>
                        </label>
                        <div className="w-px bg-white/20"></div>
                        <button onClick={resetList} className="text-yellow-300 hover:text-white underline">
                            รีเซ็ต ({availableStudents.length}/{filterClass==='ทั้งหมด'?allStudents.length:allStudents.filter(s=>s.class===filterClass).length} คน)
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

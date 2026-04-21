// js/components/attendance.jsx

/* แปลงอักขระแป้นพิมพ์ไทย (Kedmanee) แถวตัวเลขกลับเป็น ASCII digit
   เช่น สแกน 10001 ด้วยแป้นพิมพ์ไทย → "ๅจจจๅ" → แปลงกลับเป็น "10001" */
const fixThaiKeyboard = (input) => {
    const map = {'จ':'0','ๅ':'1','ๆ':'2','๘':'3','๔':'4','๕':'5','ู':'6','ึ':'7','ค':'8','ต':'9'};
    return input.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
};

window.POSAttendance = () => {
    const { useState, useEffect, useRef } = React;

    const [scanInput,      setScanInput]      = useState('');
    const [attendanceLog,  setAttendanceLog]  = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('มา');
    const [saving,         setSaving]         = useState(false);
    const [selectedClass,  setSelectedClass]  = useState('');
    const [todayClasses,   setTodayClasses]   = useState([]);
    const inputRef = useRef(null);
    const today    = new Date().toISOString().split('T')[0];
    const DAYS_TH  = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
    const todayDay = DAYS_TH[new Date().getDay()];

    /* โหลดตารางสอนวันนี้ */
    useEffect(() => {
        db.collection('timetable').where('day','==',todayDay).orderBy('period').get()
            .then(snap => {
                const classes = [...new Set(snap.docs.map(d => d.data().class).filter(Boolean))];
                setTodayClasses(classes);
                if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
            })
            .catch(() => {});
    }, []);

    /* โหลดการเช็คชื่อวันนี้ real-time */
    useEffect(() => {
        inputRef.current?.focus();
        const unsub = db.collection('attendance')
            .where('date','==',today)
            .orderBy('timestamp','desc')
            .onSnapshot(
                snap => setAttendanceLog(snap.docs.map(d=>({firestoreId:d.id,...d.data()}))),
                () => {}
            );
        return () => unsub();
    }, []);

    const filteredLog = selectedClass
        ? attendanceLog.filter(l => l.class === selectedClass)
        : attendanceLog;

    const handleScan = async (e) => {
        e.preventDefault();
        const rawInput = fixThaiKeyboard(scanInput.trim());
        if (!rawInput) return;

        let student = null;
        try {
            const doc = await db.collection('students').doc(rawInput).get();
            if (doc.exists) student = doc.data();
        } catch {
            alert('ไม่สามารถเชื่อมต่อฐานข้อมูลได้'); setScanInput(''); return;
        }
        if (!student) { alert('ไม่พบรหัสนักเรียนในระบบ'); setScanInput(''); return; }

        setSaving(true);
        try {
            await db.collection('attendance').add({
                studentId: student.id,
                name:      student.name,
                class:     selectedClass || student.class,
                no:        student.no,
                status:    selectedStatus,
                date:      today,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch {
            alert('บันทึกไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ');
        }
        setSaving(false);
        setScanInput('');
        inputRef.current?.focus();
    };

    const statusColor = {
        'มา':       'bg-green-100 text-green-800 border-green-200',
        'ขาด':      'bg-red-100 text-red-800 border-red-200',
        'ลา':       'bg-yellow-100 text-yellow-800 border-yellow-200',
        'กิจกรรม': 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="fa-barcode" className="text-red-700" size={24}/> ระบบเช็คชื่อ (POS Style)
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        วัน{todayDay} {new Date().toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'})}
                    </p>
                </div>
                {todayClasses.length > 0 && (
                    <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-xl text-sm">
                        <p className="text-green-700 font-bold flex items-center gap-1 mb-1">
                            <Icon name="fa-table" size={13}/> ตารางสอนวันนี้
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            {todayClasses.map(c => (
                                <button key={c} onClick={()=>setSelectedClass(c)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedClass===c ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">

                        <label className="block text-sm font-bold text-gray-700 mb-2">1. เลือกห้องเรียน</label>
                        <select className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg mb-5 outline-none focus:border-red-400 font-bold text-gray-700"
                            value={selectedClass} onChange={e=>{ setSelectedClass(e.target.value); inputRef.current?.focus(); }}>
                            <option value="">— ทุกห้อง —</option>
                            {['ม.4/1','ม.4/2','ม.4/3','ม.5/1','ม.5/2','ม.5/3','ม.6/1','ม.6/2','ม.6/3'].map(c =>
                                <option key={c} value={c}>{c}
                                    {todayClasses.includes(c) ? ' 📅' : ''}
                                </option>
                            )}
                        </select>

                        <label className="block text-sm font-bold text-gray-700 mb-3">2. เลือกสถานะ</label>
                        <div className="grid grid-cols-2 gap-2 mb-6">
                            {['มา','ขาด','ลา','กิจกรรม'].map(s => (
                                <button key={s} onClick={()=>{setSelectedStatus(s);inputRef.current?.focus();}}
                                    className={`py-2 px-3 rounded border text-sm font-bold transition-all ${
                                        selectedStatus===s ? 'bg-red-700 text-white border-red-700 scale-105' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">3. สแกนรหัสนักเรียน</label>
                        <form onSubmit={handleScan}>
                            <input ref={inputRef} type="text" value={scanInput}
                                onChange={e=>setScanInput(e.target.value)}
                                placeholder="คลิกที่นี่และสแกน..."
                                className="w-full p-4 border-2 border-red-300 rounded-lg bg-red-50 text-center text-xl font-bold focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 transition-all"/>
                            <button type="submit" className="hidden"/>
                        </form>
                        {saving && (
                            <p className="text-xs text-center mt-2 text-blue-500 flex items-center justify-center gap-1">
                                <Icon name="fa-spinner fa-spin" size={12}/> กำลังบันทึก Firebase...
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                        <h3 className="font-bold text-blue-800 mb-1 flex items-center gap-2">
                            <Icon name="fa-chart-bar" size={18}/> สรุป{selectedClass ? ` ${selectedClass}` : 'วันนี้'}
                        </h3>
                        <p className="text-xs text-blue-500 mb-3">{filteredLog.length} รายการ</p>
                        {['มา','ขาด','ลา','กิจกรรม'].map(s => (
                            <div key={s} className="flex justify-between text-sm text-blue-900 mb-1">
                                <span>{s}:</span>
                                <span className="font-bold">{filteredLog.filter(l=>l.status===s).length}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Log */}
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Icon name="fa-fire" size={14} className="text-orange-500"/>
                            {selectedClass ? `${selectedClass} วันนี้` : 'ทุกห้อง วันนี้'} (Real-time)
                        </h3>
                        <span className="text-sm bg-gray-200 text-gray-600 py-1 px-3 rounded-full">{filteredLog.length} รายการ</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredLog.length===0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Icon name="fa-barcode" size={48} className="mb-4 opacity-50"/>
                                <p>รอการสแกน...</p>
                            </div>
                        ) : filteredLog.map((log,i) => (
                            <div key={log.firestoreId||i}
                                className={`p-4 rounded-lg border flex items-center justify-between ${statusColor[log.status]} animate-fade-in-down`}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/50 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">{log.no}</div>
                                    <div>
                                        <h4 className="font-bold text-lg">{log.name}</h4>
                                        <p className="text-sm opacity-80">รหัส: {log.studentId||log.id} | {log.class}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-extrabold text-xl">{log.status}</div>
                                    <div className="text-xs opacity-70">
                                        {log.timestamp?.toDate?.()?.toLocaleTimeString('th-TH') || log.time || ''}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

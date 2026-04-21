// js/components/id-card.jsx
window.IDCardGenerator = () => {
    const { useState, useEffect } = React;

    const [selectedClass,  setSelectedClass]  = useState('');
    const [classList,      setClassList]      = useState([]);
    const [students,       setStudents]       = useState([]);
    const [selectedIds,    setSelectedIds]    = useState([]);
    const [loading,        setLoading]        = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [logoB64,        setLogoB64]        = useState('');
    const [downloading,    setDownloading]    = useState(false);

    /* โหลดโลโก้เป็น base64 */
    useEffect(() => {
        const toB64 = url => fetch(url)
            .then(r => { if (!r.ok) throw new Error('fetch fail'); return r.blob(); })
            .then(blob => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload  = () => res(reader.result);
                reader.onerror = rej;
                reader.readAsDataURL(blob);
            }));

        toB64(LOGO_URL)
            .catch(() => toB64(`https://images.weserv.nl/?url=${encodeURIComponent(LOGO_URL)}&output=png`))
            .then(b64 => setLogoB64(b64))
            .catch(() => setLogoB64(''));
    }, []);

    /* โหลดรายชื่อห้องเรียนจาก settings/classrooms */
    useEffect(() => {
        db.collection('settings').doc('classrooms').get()
            .then(doc => {
                const list = (doc.exists && doc.data().list) ? doc.data().list : [];
                if (list.length > 0) {
                    setClassList(list);
                    setSelectedClass(list[0]);
                } else {
                    return db.collection('students').get().then(snap => {
                        const classes = [...new Set(snap.docs.map(d => d.data().class).filter(Boolean))].sort();
                        setClassList(classes);
                        if (classes.length > 0) setSelectedClass(classes[0]);
                    });
                }
            })
            .catch(() => {})
            .finally(() => setLoadingClasses(false));
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        setLoading(true);
        setSelectedIds([]);
        db.collection('students').where('class','==',selectedClass).get()
            .then(snap => {
                const list = snap.docs.map(d => d.data());
                list.sort((a,b) => (Number(a.no)||0) - (Number(b.no)||0));
                setStudents(list);
            })
            .catch(() => setStudents([]))
            .finally(() => setLoading(false));
    }, [selectedClass]);

    const toggleAll = e => setSelectedIds(e.target.checked ? students.map(s=>s.id) : []);
    const toggleOne = id => setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);

    const downloadCard = async (studentId) => {
        const el = document.getElementById(`card-print-${studentId}`);
        if (!el) return;
        await Promise.all(
            Array.from(el.querySelectorAll('img')).map(img =>
                img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
            )
        );
        const canvas = await html2canvas(el, {
            scale: 4,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 10000,
        });
        const a = document.createElement('a');
        a.download = `บัตรนักเรียน_${studentId}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };

    const downloadSelected = async () => {
        if (selectedIds.length === 0) { alert('กรุณาเลือกบัตรก่อน'); return; }
        setDownloading(true);
        for (const id of selectedIds) {
            await downloadCard(id);
            await new Promise(r => setTimeout(r, 800));
        }
        setDownloading(false);
    };

    /* ── สไตล์ inline — ขนาดบัตรเครดิตมาตรฐาน 85.6×54mm ── */
    const cs = {
        wrap:     { width:'324px', height:'204px', background:'#fff', fontFamily:"'Sarabun','Arial',sans-serif", overflow:'hidden', boxSizing:'border-box', borderRadius:'10px', position:'relative' },
        header:   { position:'absolute', top:0, left:0, right:0, height:'50px', background:'linear-gradient(135deg,#8B1A1A 0%,#b22222 100%)', display:'flex', alignItems:'center', gap:'8px', padding:'0 12px' },
        logoWrap: { width:'34px', height:'34px', borderRadius:'50%', background:'white', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
        logoImg:  { width:'32px', height:'32px', objectFit:'contain', display:'block' },
        logoFb:   { width:'32px', height:'32px', borderRadius:'50%', background:'#8B1A1A', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'900', fontSize:'13px', fontFamily:'Arial,sans-serif' },
        schoolTH: { color:'#fff', fontWeight:'800', fontSize:'9.5px', lineHeight:'1.35', margin:0 },
        schoolEN: { color:'rgba(255,255,255,0.75)', fontSize:'7px', letterSpacing:'0.8px', margin:'2px 0 0 0' },
        body:     { position:'absolute', top:'50px', left:0, right:0, bottom:'6px', display:'flex', alignItems:'center', gap:'10px', padding:'0 12px', background:'#fff' },
        nameArea: { flex:1, minWidth:0 },
        nameTH:   { fontWeight:'800', fontSize:'13px', color:'#111', margin:0, lineHeight:'1.3', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' },
        infoLine: { fontSize:'9px', color:'#555', margin:'5px 0 0 0' },
        infoVal:  { fontWeight:'700', color:'#222' },
        qrArea:   { display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', flexShrink:0 },
        qrImg:    { width:'72px', height:'72px', display:'block' },
        qrLabel:  { fontSize:'6.5px', color:'#bbb', fontFamily:'Arial,sans-serif' },
        footer:   { position:'absolute', bottom:0, left:0, right:0, height:'6px', background:'linear-gradient(90deg,#c0392b 0%,#e67e22 35%,#f1c40f 60%,#2980b9 100%)' },
        idBadge:  { display:'inline-block', background:'#f0f4ff', border:'1px solid #c5d0f0', borderRadius:'3px', padding:'2px 6px', fontSize:'8.5px', color:'#234', fontWeight:'700', marginTop:'6px' },
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-[#a92c32] text-white px-4 py-2 inline-block font-bold text-lg rounded-t-md mb-4 flex items-center gap-2">
                <Icon name="fa-id-card" size={20}/> สร้างบัตรประจำตัวนักเรียน (QR Code)
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Controls */}
                <div className="w-full lg:w-64 shrink-0 bg-[#f4ebd9] p-5 rounded-lg border border-[#e8dac1] shadow-sm h-fit space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">เลือกห้องเรียน</label>
                        {loadingClasses ? (
                            <div className="w-full p-2 border border-gray-200 rounded bg-white text-sm text-gray-400 flex items-center gap-2">
                                <Icon name="fa-spinner fa-spin" size={12}/> กำลังโหลด...
                            </div>
                        ) : classList.length === 0 ? (
                            <div className="w-full p-2 border border-yellow-300 rounded bg-yellow-50 text-xs text-yellow-700">
                                ยังไม่มีห้องเรียน — ตั้งค่าที่เมนู "ปีการศึกษา/เทอม"
                            </div>
                        ) : (
                            <select className="w-full p-2 border border-gray-300 rounded bg-white text-sm"
                                value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
                                {classList.map(c=><option key={c}>{c}</option>)}
                            </select>
                        )}
                    </div>
                    <button onClick={downloadSelected} disabled={downloading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded shadow flex items-center justify-center gap-2 text-sm">
                        {downloading ? <><Icon name="fa-spinner fa-spin" size={14}/> กำลังดาวน์โหลด...</> : <><Icon name="fa-image" size={14}/> ดาวน์โหลด PNG (ที่เลือก)</>}
                    </button>
                    <button onClick={()=>window.print()}
                        className="w-full bg-[#357a55] hover:bg-green-800 text-white font-bold py-2.5 px-4 rounded shadow flex items-center justify-center gap-2 text-sm">
                        <Icon name="fa-print" size={14}/> พิมพ์เอกสาร
                    </button>
                    <div className="flex items-center gap-2 pt-1">
                        <input type="checkbox" id="selectAll" className="w-4 h-4 text-red-600 rounded" onChange={toggleAll}/>
                        <label htmlFor="selectAll" className="text-sm font-bold text-gray-700 cursor-pointer">
                            เลือกทั้งหมด ({selectedIds.length}/{students.length})
                        </label>
                    </div>
                    <p className="text-xs flex items-center gap-1 text-gray-400">
                        {logoB64
                            ? <><Icon name="fa-check-circle" size={11} className="text-green-500"/> โลโก้พร้อมแล้ว</>
                            : <><Icon name="fa-spinner fa-spin" size={11}/> กำลังโหลดโลโก้...</>}
                    </p>
                </div>

                {/* Cards Grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 bg-[#fcfbf9] p-5 rounded-lg border border-gray-200">
                    {loading ? (
                        <div className="col-span-2 text-center py-10 text-gray-400">
                            <Icon name="fa-spinner fa-spin" size={32} className="mb-2 block mx-auto"/> กำลังโหลดจาก Firebase...
                        </div>
                    ) : students.map(student => (
                        <div key={student.id}
                            className={`rounded-xl shadow-md overflow-hidden flex flex-col border-2 transition-all ${selectedIds.includes(student.id)?'border-blue-400 shadow-blue-100':'border-gray-200'}`}>

                            {/* Toolbar */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedIds.includes(student.id)}
                                        onChange={()=>toggleOne(student.id)} className="w-4 h-4 accent-blue-600"/>
                                    <span className="text-xs font-bold text-gray-500">เลือก</span>
                                </label>
                                <button onClick={()=>downloadCard(student.id)}
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                    <Icon name="fa-download" size={11}/> ดาวน์โหลด PNG
                                </button>
                            </div>

                            {/* CAPTURE AREA */}
                            <div id={`card-print-${student.id}`} style={cs.wrap}>
                                {/* Header */}
                                <div style={cs.header}>
                                    <div style={cs.logoWrap}>
                                        {logoB64
                                            ? <img src={logoB64} alt="logo" style={cs.logoImg}/>
                                            : <div style={cs.logoFb}>W</div>}
                                    </div>
                                    <div>
                                        <p style={cs.schoolTH}>{SCHOOL_NAME}</p>
                                        <p style={cs.schoolEN}>{CLASS_NAME}</p>
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={cs.body}>
                                    <div style={cs.nameArea}>
                                        <p style={cs.nameTH}>{student.name}</p>
                                        <p style={cs.infoLine}>
                                            ชั้น <span style={cs.infoVal}>{student.class}</span>
                                            {'  '}เลขที่ <span style={cs.infoVal}>{student.no}</span>
                                        </p>
                                        <div style={cs.idBadge}>รหัส: {student.id}</div>
                                    </div>
                                    <div style={cs.qrArea}>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${student.id}&bgcolor=ffffff&color=111111&margin=3`}
                                            alt="QR" style={cs.qrImg} crossOrigin="anonymous"/>
                                        <span style={cs.qrLabel}>Scan for ID</span>
                                    </div>
                                </div>

                                {/* Footer gradient bar */}
                                <div style={cs.footer}/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

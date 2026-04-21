// js/components/student-manager.jsx
window.StudentManager = () => {
    const { useState, useEffect, useRef } = React;

    const [activeTab,    setActiveTab]    = useState('list');
    const [students,     setStudents]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [filterClass,  setFilterClass]  = useState('ทั้งหมด');

    /* form เพิ่มทีละคน */
    const [form,         setForm]         = useState({ id:'', name:'', class:'', no:'' });
    const [saving,       setSaving]       = useState(false);
    const [addMsg,       setAddMsg]       = useState(null); // { type:'success'|'error', text }
    const [settingsCls,  setSettingsCls]  = useState([]);

    /* edit modal */
    const [editStudent,  setEditStudent]  = useState(null);
    const [editForm,     setEditForm]     = useState({ name:'', class:'', no:'' });
    const [editSaving,   setEditSaving]   = useState(false);
    const [editMsg,      setEditMsg]      = useState(null);

    /* CSV */
    const [csvRows,      setCsvRows]      = useState([]);
    const [csvError,     setCsvError]     = useState('');
    const [importing,    setImporting]    = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    /* โหลดรายชื่อ real-time */
    useEffect(() => {
        const unsub = db.collection('students').orderBy('no').onSnapshot(
            snap => { setStudents(snap.docs.map(d => d.data())); setLoading(false); },
            ()   => { setStudents([]); setLoading(false); }
        );
        return () => unsub();
    }, []);

    /* โหลดห้องเรียนจาก settings */
    useEffect(() => {
        db.collection('settings').doc('classrooms').get()
            .then(doc => { if (doc.exists && doc.data().list) setSettingsCls(doc.data().list); })
            .catch(() => {});
    }, []);

    /* ─── เพิ่มนักเรียนทีละคน ─── */
    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (form.id.length !== 5 || isNaN(form.id)) {
            setAddMsg({ type:'error', text:'รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก' });
            return;
        }
        setSaving(true);
        try {
            const exists = await db.collection('students').doc(form.id).get();
            if (exists.exists) {
                setAddMsg({ type:'error', text:`รหัส ${form.id} มีในระบบแล้ว` });
                setSaving(false);
                return;
            }
            await db.collection('students').doc(form.id).set({
                id:       form.id,
                name:     form.name,
                class:    form.class,
                no:       Number(form.no),
                password: '1234',
            });
            setForm({ id:'', name:'', class: form.class, no:'' });
            setAddMsg({ type:'success', text:'เพิ่มนักเรียนสำเร็จ! รหัสผ่านเริ่มต้น: 1234' });
        } catch (err) {
            setAddMsg({ type:'error', text:'เกิดข้อผิดพลาด: ' + err.message });
        }
        setSaving(false);
    };

    /* ─── ลบนักเรียน ─── */
    const handleDelete = async (id, name) => {
        if (!window.confirm(`ยืนยันลบ "${name}" ออกจากระบบ?\nข้อมูลเช็คชื่อและคะแนนจะยังคงอยู่`)) return;
        await db.collection('students').doc(id).delete();
    };

    /* ─── รีเซ็ตรหัสผ่าน ─── */
    const handleResetPW = async (id, name) => {
        if (!window.confirm(`รีเซ็ตรหัสผ่านของ "${name}" กลับเป็น 1234?`)) return;
        await db.collection('students').doc(id).update({ password: '1234' });
        alert('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
    };

    /* ─── เปิด / ปิด Edit Modal ─── */
    const openEdit = (s) => {
        setEditStudent(s);
        setEditForm({ name: s.name || '', class: s.class || '', no: s.no || '' });
        setEditMsg(null);
    };
    const closeEdit = () => { setEditStudent(null); setEditMsg(null); };

    /* ─── บันทึกการแก้ไข ─── */
    const handleEditSave = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) return setEditMsg({ type:'error', text:'กรุณากรอกชื่อ-นามสกุล' });
        if (!editForm.class.trim()) return setEditMsg({ type:'error', text:'กรุณากรอกห้องเรียน' });
        setEditSaving(true);
        try {
            await db.collection('students').doc(editStudent.id).update({
                name:  editForm.name.trim(),
                class: editForm.class.trim(),
                no:    Number(editForm.no) || 0,
            });
            setEditMsg({ type:'success', text:'บันทึกข้อมูลสำเร็จ' });
            setTimeout(() => closeEdit(), 1200);
        } catch(err) {
            setEditMsg({ type:'error', text:'เกิดข้อผิดพลาด: ' + err.message });
        }
        setEditSaving(false);
    };

    /* ─── ดาวน์โหลด Template CSV ─── */
    const downloadTemplate = () => {
        const bom = '\uFEFF';
        const header = 'รหัส,ชื่อ-นามสกุล,ห้อง,เลขที่\n';
        const sample = '10001,นายตัวอย่าง นามสกุล,ม.6/1,1\n10002,นางสาวตัวอย่าง นามสกุล,ม.6/1,2\n';
        const blob = new Blob([bom + header + sample], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'template_students.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ─── อ่านไฟล์ CSV ─── */
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCsvError('');
        setCsvRows([]);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text  = evt.target.result;
                const lines = text.trim().replace(/\r/g, '').split('\n');
                if (lines.length < 2) { setCsvError('ไฟล์ต้องมีแถวข้อมูลอย่างน้อย 1 แถว'); return; }

                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    if (cols.length < 4) { setCsvError(`แถวที่ ${i+1}: ข้อมูลไม่ครบ 4 คอลัมน์`); return; }
                    const [id, name, cls, no] = cols;
                    if (!id || isNaN(id)) { setCsvError(`แถวที่ ${i+1}: รหัส "${id}" ไม่ถูกต้อง`); return; }
                    if (!name)            { setCsvError(`แถวที่ ${i+1}: ชื่อว่างเปล่า`); return; }
                    rows.push({ id: id.trim(), name, class: cls, no: Number(no), password: '1234' });
                }
                setCsvRows(rows);
            } catch {
                setCsvError('อ่านไฟล์ไม่สำเร็จ กรุณาตรวจสอบรูปแบบ CSV');
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    /* ─── นำเข้า CSV → Firestore (batch) ─── */
    const handleImport = async () => {
        if (csvRows.length === 0) return;
        setImporting(true);
        try {
            const CHUNK = 499;
            let done = 0;
            for (let i = 0; i < csvRows.length; i += CHUNK) {
                const batch = db.batch();
                csvRows.slice(i, i + CHUNK).forEach(s => {
                    batch.set(db.collection('students').doc(s.id), s);
                });
                await batch.commit();
                done += Math.min(CHUNK, csvRows.length - i);
            }
            setImportResult({ success: done, total: csvRows.length });
            setCsvRows([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            setCsvError('นำเข้าล้มเหลว: ' + err.message);
        }
        setImporting(false);
    };

    /* ─── Filter ─── */
    const classList = ['ทั้งหมด', ...new Set([...settingsCls, ...students.map(s => s.class).filter(Boolean)])].sort();
    const filtered  = students.filter(s =>
        (filterClass === 'ทั้งหมด' || s.class === filterClass) &&
        (searchQuery  === '' || s.name?.includes(searchQuery) || s.id?.includes(searchQuery))
    );

    return (
        <>
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Icon name="fa-users" className="text-red-700" size={24}/> จัดการนักเรียน
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">นักเรียนในระบบทั้งหมด {students.length} คน</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 px-2">
                    <TabBtn id="list" label="รายชื่อนักเรียน"  icon="fa-list"      activeTab={activeTab} setActiveTab={setActiveTab}/>
                    <TabBtn id="add"  label="เพิ่มทีละคน"      icon="fa-user-plus" activeTab={activeTab} setActiveTab={setActiveTab}/>
                    <TabBtn id="csv"  label="นำเข้า CSV"        icon="fa-file-csv"  activeTab={activeTab} setActiveTab={setActiveTab}/>
                </div>

                {/* ══ Tab: รายชื่อ ══ */}
                {activeTab === 'list' && (
                    <div className="p-6">
                        <div className="flex flex-wrap gap-3 mb-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Icon name="fa-search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="ค้นหาชื่อหรือรหัส..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300"
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                            </div>
                            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                                value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                {classList.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-gray-400">
                                <Icon name="fa-spinner fa-spin" size={28} className="mb-2 block mx-auto"/>
                                กำลังโหลดจาก Firebase...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Icon name="fa-users" size={40} className="mb-3 block mx-auto opacity-40"/>
                                ไม่พบนักเรียน
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 text-left">
                                        <tr>
                                            <th className="px-4 py-3 font-bold">เลขที่</th>
                                            <th className="px-4 py-3 font-bold">รหัส</th>
                                            <th className="px-4 py-3 font-bold">ชื่อ-นามสกุล</th>
                                            <th className="px-4 py-3 font-bold">ห้อง</th>
                                            <th className="px-4 py-3 font-bold text-center">รหัสผ่าน</th>
                                            <th className="px-4 py-3 font-bold text-center">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-gray-500">{s.no}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-gray-700">{s.id}</td>
                                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">{s.class}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {s.password === '1234'
                                                        ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">ยังไม่เปลี่ยน</span>
                                                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">เปลี่ยนแล้ว</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => openEdit(s)}
                                                            title="แก้ไขข้อมูล"
                                                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                                            <Icon name="fa-edit" size={13}/>
                                                        </button>
                                                        <button onClick={() => handleResetPW(s.id, s.name)}
                                                            title="รีเซ็ตรหัสผ่านเป็น 1234"
                                                            className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors">
                                                            <Icon name="fa-key" size={13}/>
                                                        </button>
                                                        <button onClick={() => handleDelete(s.id, s.name)}
                                                            title="ลบนักเรียน"
                                                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                                            <Icon name="fa-trash" size={13}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                                    แสดง {filtered.length} จาก {students.length} คน
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ Tab: เพิ่มทีละคน ══ */}
                {activeTab === 'add' && (
                    <div className="p-6 max-w-lg">
                        <h3 className="font-bold text-gray-700 mb-5 flex items-center gap-2">
                            <Icon name="fa-user-plus" className="text-red-600"/> เพิ่มนักเรียนใหม่
                        </h3>

                        {addMsg && (
                            <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                                addMsg.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                <Icon name={addMsg.type==='success' ? 'fa-check-circle' : 'fa-exclamation-circle'} size={14}/>
                                {addMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        รหัสนักเรียน <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" required maxLength={5}
                                        placeholder="เช่น 10001"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 font-mono"
                                        value={form.id}
                                        onChange={e => { setForm(p=>({...p,id:e.target.value})); setAddMsg(null); }}/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">
                                        เลขที่ <span className="text-red-500">*</span>
                                    </label>
                                    <input type="number" required min={1}
                                        placeholder="เลขที่ในห้อง"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                        value={form.no}
                                        onChange={e => setForm(p=>({...p,no:e.target.value}))}/>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                </label>
                                <input type="text" required
                                    placeholder="เช่น นายชื่อจริง นามสกุล"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.name}
                                    onChange={e => setForm(p=>({...p,name:e.target.value}))}/>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    ห้องเรียน <span className="font-normal text-gray-400 text-xs">(พิมพ์เองได้อิสระ)</span>
                                </label>
                                <input
                                    list="student-class-list"
                                    placeholder="เช่น ม.6/2 หรือพิมพ์ห้องใหม่ได้เลย"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300"
                                    value={form.class}
                                    onChange={e => setForm(p=>({...p,class:e.target.value}))}/>
                                <datalist id="student-class-list">
                                    {classList.filter(c=>c!=='ทั้งหมด').map(c=><option key={c} value={c}/>)}
                                </datalist>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                                <Icon name="fa-info-circle" size={14}/>
                                รหัสผ่านเริ่มต้นจะถูกตั้งเป็น <strong>1234</strong> นักเรียนต้องเปลี่ยนเมื่อ Login ครั้งแรก
                            </div>

                            <button type="submit" disabled={saving}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                {saving
                                    ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังบันทึก...</>
                                    : <><Icon name="fa-user-plus" size={16}/> เพิ่มนักเรียน</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* ══ Tab: CSV ══ */}
                {activeTab === 'csv' && (
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                            <div>
                                <h3 className="font-bold text-gray-700 mb-1 flex items-center gap-2">
                                    <Icon name="fa-file-csv" className="text-green-600"/> นำเข้าจากไฟล์ CSV
                                </h3>
                                <p className="text-sm text-gray-500">รองรับ Excel (.csv) ที่ Save As → CSV UTF-8</p>
                            </div>
                            <button onClick={downloadTemplate}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors">
                                <Icon name="fa-download" size={14}/> ดาวน์โหลด Template
                            </button>
                        </div>

                        <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs font-bold text-gray-600 mb-2">รูปแบบ CSV ที่รองรับ (แถวแรกเป็น Header):</p>
                            <code className="text-xs text-green-700 block font-mono leading-6">
                                รหัส,ชื่อ-นามสกุล,ห้อง,เลขที่<br/>
                                10001,นายตัวอย่าง นามสกุล,ม.6/1,1<br/>
                                10002,นางสาวตัวอย่าง นามสกุล,ม.6/1,2
                            </code>
                        </div>

                        <label className="block w-full border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl p-8 text-center cursor-pointer transition-colors group mb-4">
                            <Icon name="fa-cloud-upload-alt" size={36} className="text-gray-300 group-hover:text-red-400 mb-3 block mx-auto transition-colors"/>
                            <p className="font-bold text-gray-600 group-hover:text-red-600 transition-colors">คลิกเพื่อเลือกไฟล์ CSV</p>
                            <p className="text-sm text-gray-400 mt-1">หรือลากไฟล์มาวางที่นี่</p>
                            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange}/>
                        </label>

                        {csvError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                                <Icon name="fa-exclamation-circle" size={14}/> {csvError}
                            </div>
                        )}

                        {importResult && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
                                <Icon name="fa-check-circle" size={20}/>
                                <div>
                                    <p className="font-bold">นำเข้าสำเร็จ!</p>
                                    <p className="text-sm">เพิ่มนักเรียน {importResult.success}/{importResult.total} คน เข้า Firebase แล้ว</p>
                                </div>
                            </div>
                        )}

                        {csvRows.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-bold text-gray-700 flex items-center gap-2">
                                        <Icon name="fa-eye" size={15} className="text-blue-500"/>
                                        ตัวอย่างข้อมูล ({csvRows.length} คน)
                                    </p>
                                    <button onClick={() => { setCsvRows([]); if(fileInputRef.current) fileInputRef.current.value=''; }}
                                        className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                                        <Icon name="fa-times" size={12}/> ยกเลิก
                                    </button>
                                </div>

                                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4 max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-bold">รหัส</th>
                                                <th className="px-3 py-2 text-left font-bold">ชื่อ-นามสกุล</th>
                                                <th className="px-3 py-2 text-left font-bold">ห้อง</th>
                                                <th className="px-3 py-2 text-left font-bold">เลขที่</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {csvRows.map((r,i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 font-mono">{r.id}</td>
                                                    <td className="px-3 py-2">{r.name}</td>
                                                    <td className="px-3 py-2">{r.class}</td>
                                                    <td className="px-3 py-2">{r.no}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4 flex items-center gap-2">
                                    <Icon name="fa-exclamation-triangle" size={14}/>
                                    ถ้ารหัสนักเรียนซ้ำกับที่มีอยู่ ข้อมูลเดิมจะถูกเขียนทับ
                                </div>

                                <button onClick={handleImport} disabled={importing}
                                    className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                    {importing
                                        ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังนำเข้า {csvRows.length} คน...</>
                                        : <><Icon name="fa-upload" size={16}/> นำเข้า {csvRows.length} คน เข้า Firebase</>}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        {/* ══ Edit Modal ══ */}
        {editStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-down">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Icon name="fa-user-edit" size={16}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">แก้ไขข้อมูลนักเรียน</h3>
                                <p className="text-xs text-gray-400">รหัส: {editStudent.id}</p>
                            </div>
                        </div>
                        <button onClick={closeEdit} className="text-gray-400 hover:text-gray-700 transition-colors">
                            <Icon name="fa-times" size={18}/>
                        </button>
                    </div>

                    <form onSubmit={handleEditSave} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                            <input
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                placeholder="ชื่อ-นามสกุล"
                                value={editForm.name}
                                onChange={e => setEditForm(p=>({...p, name: e.target.value}))}/>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                ห้องเรียน <span className="text-red-500">*</span>
                                <span className="font-normal text-gray-400 text-xs ml-1">(พิมพ์เองได้)</span>
                            </label>
                            <input
                                list="edit-class-list"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                placeholder="เช่น ม.6/1"
                                value={editForm.class}
                                onChange={e => setEditForm(p=>({...p, class: e.target.value}))}/>
                            <datalist id="edit-class-list">
                                {classList.filter(c=>c!=='ทั้งหมด').map(c=><option key={c} value={c}/>)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">เลขที่</label>
                            <input type="number" min="1"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                                placeholder="เลขที่"
                                value={editForm.no}
                                onChange={e => setEditForm(p=>({...p, no: e.target.value}))}/>
                        </div>

                        {editMsg && (
                            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${editMsg.type==='success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                <Icon name={editMsg.type==='success' ? 'fa-check-circle' : 'fa-exclamation-circle'} size={14}/>
                                {editMsg.text}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={closeEdit}
                                className="flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                ยกเลิก
                            </button>
                            <button type="submit" disabled={editSaving}
                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                                {editSaving
                                    ? <><Icon name="fa-spinner fa-spin" size={14}/> กำลังบันทึก...</>
                                    : <><Icon name="fa-save" size={14}/> บันทึก</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

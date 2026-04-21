// js/components/student-manager.jsx
window.StudentManager = () => {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const [activeTab, setActiveTab] = useState('list');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ทั้งหมด');

  /* form เพิ่มทีละคน */
  const [form, setForm] = useState({
    id: '',
    name: '',
    class: '',
    no: ''
  });
  const [saving, setSaving] = useState(false);
  const [addMsg, setAddMsg] = useState(null); // { type:'success'|'error', text }
  const [settingsCls, setSettingsCls] = useState([]);

  /* edit modal */
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    class: '',
    no: ''
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  /* CSV */
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  /* โหลดรายชื่อ real-time */
  useEffect(() => {
    const unsub = db.collection('students').orderBy('no').onSnapshot(snap => {
      setStudents(snap.docs.map(d => d.data()));
      setLoading(false);
    }, () => {
      setStudents([]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  /* โหลดห้องเรียนจาก settings */
  useEffect(() => {
    db.collection('settings').doc('classrooms').get().then(doc => {
      if (doc.exists && doc.data().list) setSettingsCls(doc.data().list);
    }).catch(() => {});
  }, []);

  /* ─── เพิ่มนักเรียนทีละคน ─── */
  const handleAddStudent = async e => {
    e.preventDefault();
    if (form.id.length !== 5 || isNaN(form.id)) {
      setAddMsg({
        type: 'error',
        text: 'รหัสนักเรียนต้องเป็นตัวเลข 5 หลัก'
      });
      return;
    }
    setSaving(true);
    try {
      const exists = await db.collection('students').doc(form.id).get();
      if (exists.exists) {
        setAddMsg({
          type: 'error',
          text: `รหัส ${form.id} มีในระบบแล้ว`
        });
        setSaving(false);
        return;
      }
      await db.collection('students').doc(form.id).set({
        id: form.id,
        name: form.name,
        class: form.class,
        no: Number(form.no),
        password: '1234'
      });
      setForm({
        id: '',
        name: '',
        class: form.class,
        no: ''
      });
      setAddMsg({
        type: 'success',
        text: 'เพิ่มนักเรียนสำเร็จ! รหัสผ่านเริ่มต้น: 1234'
      });
    } catch (err) {
      setAddMsg({
        type: 'error',
        text: 'เกิดข้อผิดพลาด: ' + err.message
      });
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
    await db.collection('students').doc(id).update({
      password: '1234'
    });
    alert('รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
  };

  /* ─── เปิด / ปิด Edit Modal ─── */
  const openEdit = s => {
    setEditStudent(s);
    setEditForm({
      name: s.name || '',
      class: s.class || '',
      no: s.no || ''
    });
    setEditMsg(null);
  };
  const closeEdit = () => {
    setEditStudent(null);
    setEditMsg(null);
  };

  /* ─── บันทึกการแก้ไข ─── */
  const handleEditSave = async e => {
    e.preventDefault();
    if (!editForm.name.trim()) return setEditMsg({
      type: 'error',
      text: 'กรุณากรอกชื่อ-นามสกุล'
    });
    if (!editForm.class.trim()) return setEditMsg({
      type: 'error',
      text: 'กรุณากรอกห้องเรียน'
    });
    setEditSaving(true);
    try {
      await db.collection('students').doc(editStudent.id).update({
        name: editForm.name.trim(),
        class: editForm.class.trim(),
        no: Number(editForm.no) || 0
      });
      setEditMsg({
        type: 'success',
        text: 'บันทึกข้อมูลสำเร็จ'
      });
      setTimeout(() => closeEdit(), 1200);
    } catch (err) {
      setEditMsg({
        type: 'error',
        text: 'เกิดข้อผิดพลาด: ' + err.message
      });
    }
    setEditSaving(false);
  };

  /* ─── ดาวน์โหลด Template CSV ─── */
  const downloadTemplate = () => {
    const bom = '\uFEFF';
    const header = 'รหัส,ชื่อ-นามสกุล,ห้อง,เลขที่\n';
    const sample = '10001,นายตัวอย่าง นามสกุล,ม.6/1,1\n10002,นางสาวตัวอย่าง นามสกุล,ม.6/1,2\n';
    const blob = new Blob([bom + header + sample], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── อ่านไฟล์ CSV ─── */
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError('');
    setCsvRows([]);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target.result;
        const lines = text.trim().replace(/\r/g, '').split('\n');
        if (lines.length < 2) {
          setCsvError('ไฟล์ต้องมีแถวข้อมูลอย่างน้อย 1 แถว');
          return;
        }
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 4) {
            setCsvError(`แถวที่ ${i + 1}: ข้อมูลไม่ครบ 4 คอลัมน์`);
            return;
          }
          const [id, name, cls, no] = cols;
          if (!id || isNaN(id)) {
            setCsvError(`แถวที่ ${i + 1}: รหัส "${id}" ไม่ถูกต้อง`);
            return;
          }
          if (!name) {
            setCsvError(`แถวที่ ${i + 1}: ชื่อว่างเปล่า`);
            return;
          }
          rows.push({
            id: id.trim(),
            name,
            class: cls,
            no: Number(no),
            password: '1234'
          });
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
      setImportResult({
        success: done,
        total: csvRows.length
      });
      setCsvRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setCsvError('นำเข้าล้มเหลว: ' + err.message);
    }
    setImporting(false);
  };

  /* ─── Filter ─── */
  const classList = ['ทั้งหมด', ...new Set([...settingsCls, ...students.map(s => s.class).filter(Boolean)])].sort();
  const filtered = students.filter(s => (filterClass === 'ทั้งหมด' || s.class === filterClass) && (searchQuery === '' || s.name?.includes(searchQuery) || s.id?.includes(searchQuery)));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-users",
    className: "text-red-700",
    size: 24
  }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mt-1"
  }, "\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ", students.length, " \u0E04\u0E19"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex border-b border-gray-200 px-2"
  }, /*#__PURE__*/React.createElement(TabBtn, {
    id: "list",
    label: "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19",
    icon: "fa-list",
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), /*#__PURE__*/React.createElement(TabBtn, {
    id: "add",
    label: "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E17\u0E35\u0E25\u0E30\u0E04\u0E19",
    icon: "fa-user-plus",
    activeTab: activeTab,
    setActiveTab: setActiveTab
  }), /*#__PURE__*/React.createElement(TabBtn, {
    id: "csv",
    label: "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 CSV",
    icon: "fa-file-csv",
    activeTab: activeTab,
    setActiveTab: setActiveTab
  })), activeTab === 'list' && /*#__PURE__*/React.createElement("div", {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative flex-1 min-w-[200px]"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-search",
    size: 14,
    className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A...",
    className: "w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value)
  })), /*#__PURE__*/React.createElement("select", {
    className: "px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none",
    value: filterClass,
    onChange: e => setFilterClass(e.target.value)
  }, classList.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), loading ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 28,
    className: "mb-2 block mx-auto"
  }), "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E08\u0E32\u0E01 Firebase...") : filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-12 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-users",
    size: 40,
    className: "mb-3 block mx-auto opacity-40"
  }), "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19") : /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-lg border border-gray-200"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-gray-50 text-gray-600 text-left"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold"
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold"
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold"
  }, "\u0E2B\u0E49\u0E2D\u0E07"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold text-center"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 font-bold text-center"
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-gray-100"
  }, filtered.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id,
    className: "hover:bg-gray-50 transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-gray-500"
  }, s.no), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-mono font-bold text-gray-700"
  }, s.id), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 font-medium"
  }, s.name), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded"
  }, s.class)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-center"
  }, s.password === '1234' ? /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19") : /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold"
  }, "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E25\u0E49\u0E27")), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openEdit(s),
    title: "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    className: "p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-edit",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleResetPW(s.id, s.name),
    title: "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E1B\u0E47\u0E19 1234",
    className: "p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-key",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(s.id, s.name),
    title: "\u0E25\u0E1A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19",
    className: "p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-trash",
    size: 13
  })))))))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500"
  }, "\u0E41\u0E2A\u0E14\u0E07 ", filtered.length, " \u0E08\u0E32\u0E01 ", students.length, " \u0E04\u0E19"))), activeTab === 'add' && /*#__PURE__*/React.createElement("div", {
    className: "p-6 max-w-lg"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-700 mb-5 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-user-plus",
    className: "text-red-600"
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E2B\u0E21\u0E48"), addMsg && /*#__PURE__*/React.createElement("div", {
    className: `mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${addMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: addMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle',
    size: 14
  }), addMsg.text), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAddStudent,
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19 ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    maxLength: 5,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 10001",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 font-mono",
    value: form.id,
    onChange: e => {
      setForm(p => ({
        ...p,
        id: e.target.value
      }));
      setAddMsg(null);
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "number",
    required: true,
    min: 1,
    placeholder: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E43\u0E19\u0E2B\u0E49\u0E2D\u0E07",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.no,
    onChange: e => setForm(p => ({
      ...p,
      no: e.target.value
    }))
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E19\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E08\u0E23\u0E34\u0E07 \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.name,
    onChange: e => setForm(p => ({
      ...p,
      name: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19 ", /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-gray-400 text-xs"
  }, "(\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E2D\u0E34\u0E2A\u0E23\u0E30)")), /*#__PURE__*/React.createElement("input", {
    list: "student-class-list",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E21.6/2 \u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2B\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E25\u0E22",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.class,
    onChange: e => setForm(p => ({
      ...p,
      class: e.target.value
    }))
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "student-class-list"
  }, classList.filter(c => c !== 'ทั้งหมด').map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  })))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-info-circle",
    size: 14
  }), "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E15\u0E31\u0E49\u0E07\u0E40\u0E1B\u0E47\u0E19 ", /*#__PURE__*/React.createElement("strong", null, "1234"), " \u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E21\u0E37\u0E48\u0E2D Login \u0E04\u0E23\u0E31\u0E49\u0E07\u0E41\u0E23\u0E01"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: saving,
    className: "w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
  }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 16
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-user-plus",
    size: 16
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19")))), activeTab === 'csv' && /*#__PURE__*/React.createElement("div", {
    className: "p-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between mb-6 flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-700 mb-1 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-file-csv",
    className: "text-green-600"
  }), " \u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E08\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C CSV"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, "\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A Excel (.csv) \u0E17\u0E35\u0E48 Save As \u2192 CSV UTF-8")), /*#__PURE__*/React.createElement("button", {
    onClick: downloadTemplate,
    className: "flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-download",
    size: 14
  }), " \u0E14\u0E32\u0E27\u0E19\u0E4C\u0E42\u0E2B\u0E25\u0E14 Template")), /*#__PURE__*/React.createElement("div", {
    className: "mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-bold text-gray-600 mb-2"
  }, "\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A CSV \u0E17\u0E35\u0E48\u0E23\u0E2D\u0E07\u0E23\u0E31\u0E1A (\u0E41\u0E16\u0E27\u0E41\u0E23\u0E01\u0E40\u0E1B\u0E47\u0E19 Header):"), /*#__PURE__*/React.createElement("code", {
    className: "text-xs text-green-700 block font-mono leading-6"
  }, "\u0E23\u0E2B\u0E31\u0E2A,\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25,\u0E2B\u0E49\u0E2D\u0E07,\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48", /*#__PURE__*/React.createElement("br", null), "10001,\u0E19\u0E32\u0E22\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25,\u0E21.6/1,1", /*#__PURE__*/React.createElement("br", null), "10002,\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07 \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25,\u0E21.6/1,2")), /*#__PURE__*/React.createElement("label", {
    className: "block w-full border-2 border-dashed border-gray-300 hover:border-red-400 rounded-xl p-8 text-center cursor-pointer transition-colors group mb-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-cloud-upload-alt",
    size: 36,
    className: "text-gray-300 group-hover:text-red-400 mb-3 block mx-auto transition-colors"
  }), /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-gray-600 group-hover:text-red-600 transition-colors"
  }, "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E1F\u0E25\u0E4C CSV"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-400 mt-1"
  }, "\u0E2B\u0E23\u0E37\u0E2D\u0E25\u0E32\u0E01\u0E44\u0E1F\u0E25\u0E4C\u0E21\u0E32\u0E27\u0E32\u0E07\u0E17\u0E35\u0E48\u0E19\u0E35\u0E48"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: ".csv",
    className: "hidden",
    onChange: handleFileChange
  })), csvError && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-exclamation-circle",
    size: 14
  }), " ", csvError), importResult && /*#__PURE__*/React.createElement("div", {
    className: "mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check-circle",
    size: 20
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold"
  }, "\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19 ", importResult.success, "/", importResult.total, " \u0E04\u0E19 \u0E40\u0E02\u0E49\u0E32 Firebase \u0E41\u0E25\u0E49\u0E27"))), csvRows.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-gray-700 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-eye",
    size: 15,
    className: "text-blue-500"
  }), "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 (", csvRows.length, " \u0E04\u0E19)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCsvRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    className: "text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times",
    size: 12
  }), " \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto rounded-lg border border-gray-200 mb-4 max-h-64 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-gray-50 text-gray-600 sticky top-0"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left font-bold"
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left font-bold"
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left font-bold"
  }, "\u0E2B\u0E49\u0E2D\u0E07"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left font-bold"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-gray-100"
  }, csvRows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2 font-mono"
  }, r.id), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2"
  }, r.name), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2"
  }, r.class), /*#__PURE__*/React.createElement("td", {
    className: "px-3 py-2"
  }, r.no)))))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-exclamation-triangle",
    size: 14
  }), "\u0E16\u0E49\u0E32\u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E0B\u0E49\u0E33\u0E01\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E14\u0E34\u0E21\u0E08\u0E30\u0E16\u0E39\u0E01\u0E40\u0E02\u0E35\u0E22\u0E19\u0E17\u0E31\u0E1A"), /*#__PURE__*/React.createElement("button", {
    onClick: handleImport,
    disabled: importing,
    className: "w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
  }, importing ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 16
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 ", csvRows.length, " \u0E04\u0E19...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-upload",
    size: 16
  }), " \u0E19\u0E33\u0E40\u0E02\u0E49\u0E32 ", csvRows.length, " \u0E04\u0E19 \u0E40\u0E02\u0E49\u0E32 Firebase")))))), editStudent && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in-down"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-6 py-4 border-b border-gray-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-user-edit",
    size: 16
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-800"
  }, "\u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400"
  }, "\u0E23\u0E2B\u0E31\u0E2A: ", editStudent.id))), /*#__PURE__*/React.createElement("button", {
    onClick: closeEdit,
    className: "text-gray-400 hover:text-gray-700 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times",
    size: 18
  }))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleEditSave,
    className: "p-6 space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm",
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25",
    value: editForm.name,
    onChange: e => setEditForm(p => ({
      ...p,
      name: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19 ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*"), /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-gray-400 text-xs ml-1"
  }, "(\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E2D\u0E07\u0E44\u0E14\u0E49)")), /*#__PURE__*/React.createElement("input", {
    list: "edit-class-list",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E21.6/1",
    value: editForm.class,
    onChange: e => setEditForm(p => ({
      ...p,
      class: e.target.value
    }))
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "edit-class-list"
  }, classList.filter(c => c !== 'ทั้งหมด').map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 text-sm",
    placeholder: "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48",
    value: editForm.no,
    onChange: e => setEditForm(p => ({
      ...p,
      no: e.target.value
    }))
  })), editMsg && /*#__PURE__*/React.createElement("div", {
    className: `p-3 rounded-lg text-sm flex items-center gap-2 ${editMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: editMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle',
    size: 14
  }), editMsg.text), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: closeEdit,
    className: "flex-1 py-2.5 border border-gray-300 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm"
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: editSaving,
    className: "flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-60 text-sm flex items-center justify-center gap-2"
  }, editSaving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 14
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-save",
    size: 14
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")))))));
};
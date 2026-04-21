/* ════════════════════════════════════════════
   course-manager.jsx — CourseManager (Admin เมนู 1)
   ════════════════════════════════════════════ */

const {
  useState: useStateCM,
  useEffect: useEffectCM
} = React;

/* ══════════════════════════════════════════
   1. COURSE MANAGER — จัดการรายวิชา
══════════════════════════════════════════ */
window.CourseManager = () => {
  const GRADE_LEVELS = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6', 'ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'อื่นๆ'];
  const emptyForm = {
    code: '',
    name: '',
    credits: '1.5',
    year: '2569',
    term: '1',
    gradeLevel: 'ม.6',
    continuous: 50,
    midterm: 20,
    final: 30,
    continuousItems: [{
      label: 'คะแนนเก็บ',
      score: 50
    }],
    classrooms: []
  };
  const [courses, setCourses] = useStateCM([]);
  const [showForm, setShowForm] = useStateCM(false);
  const [saving, setSaving] = useStateCM(false);
  const [editId, setEditId] = useStateCM(null);
  const [expandedId, setExpandedId] = useStateCM(null);
  const [form, setForm] = useStateCM(emptyForm);
  const [classInput, setClassInput] = useStateCM('');

  /* ── ประกาศ ── */
  const [announceCourse, setAnnounceCourse] = useStateCM(null); // course object ที่เลือกจัดการประกาศ
  const [announceList, setAnnounceList] = useStateCM([]);
  const [announceText, setAnnounceText] = useStateCM('');
  const [announcePinned, setAnnouncePinned] = useStateCM(false);
  const [announceSaving, setAnnounceSaving] = useStateCM(false);
  const [announceLoading, setAnnounceLoading] = useStateCM(false);
  useEffectCM(() => {
    const unsub = db.collection('courses').onSnapshot(snap => setCourses(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))), () => setCourses([]));
    return () => unsub();
  }, []);

  /* โหลดประกาศเมื่อเลือกรายวิชา */
  useEffectCM(() => {
    if (!announceCourse) {
      setAnnounceList([]);
      return;
    }
    setAnnounceLoading(true);
    const unsub = db.collection('announcements').where('courseId', '==', announceCourse.id).orderBy('createdAt', 'desc').onSnapshot(snap => {
      setAnnounceList(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setAnnounceLoading(false);
    }, () => setAnnounceLoading(false));
    return () => unsub();
  }, [announceCourse?.id]);
  const openAnnounce = course => setAnnounceCourse(prev => prev?.id === course.id ? null : course);
  const saveAnnounce = async () => {
    if (!announceText.trim()) return;
    setAnnounceSaving(true);
    try {
      await db.collection('announcements').add({
        courseId: announceCourse.id,
        courseName: announceCourse.name,
        classrooms: announceCourse.classrooms || [],
        message: announceText.trim(),
        pinned: announcePinned,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setAnnounceText('');
      setAnnouncePinned(false);
    } catch {
      alert('บันทึกประกาศไม่สำเร็จ');
    }
    setAnnounceSaving(false);
  };
  const deleteAnnounce = async id => {
    if (!window.confirm('ลบประกาศนี้?')) return;
    await db.collection('announcements').doc(id).delete().catch(() => {});
  };
  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const openEdit = c => {
    setForm({
      ...emptyForm,
      ...c,
      continuousItems: c.continuousItems && c.continuousItems.length > 0 ? c.continuousItems : [{
        label: 'คะแนนเก็บ',
        score: c.continuous ?? 50
      }],
      classrooms: c.classrooms || []
    });
    setClassInput('');
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  /* ห้องเรียน helpers */
  const addClassroom = () => {
    const val = classInput.trim();
    if (!val) return;
    if (form.classrooms.includes(val)) {
      setClassInput('');
      return;
    }
    setForm(p => ({
      ...p,
      classrooms: [...p.classrooms, val]
    }));
    setClassInput('');
  };
  const removeClassroom = cls => setForm(p => ({
    ...p,
    classrooms: p.classrooms.filter(c => c !== cls)
  }));

  /* คะแนนเก็บย่อย helpers */
  const itemsSum = () => form.continuousItems.reduce((s, i) => s + Number(i.score || 0), 0);
  const addItem = () => setForm(p => ({
    ...p,
    continuousItems: [...p.continuousItems, {
      label: '',
      score: 0
    }]
  }));
  const removeItem = idx => setForm(p => ({
    ...p,
    continuousItems: p.continuousItems.filter((_, i) => i !== idx)
  }));
  const updateItem = (idx, key, val) => setForm(p => ({
    ...p,
    continuousItems: p.continuousItems.map((it, i) => i === idx ? {
      ...it,
      [key]: val
    } : it)
  }));
  const handleSave = async e => {
    e.preventDefault();
    const total = Number(form.continuous) + Number(form.midterm) + Number(form.final);
    if (total !== 100) {
      alert('สัดส่วนคะแนนหลักรวมต้องเท่ากับ 100');
      return;
    }
    if (itemsSum() !== Number(form.continuous)) {
      alert(`คะแนนเก็บย่อยรวม ${itemsSum()}% ต้องเท่ากับคะแนนเก็บ ${form.continuous}%`);
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      credits: Number(form.credits),
      continuous: Number(form.continuous),
      midterm: Number(form.midterm),
      final: Number(form.final),
      continuousItems: form.continuousItems.map(it => ({
        label: it.label,
        score: Number(it.score)
      })),
      classrooms: form.classrooms || []
    };
    try {
      if (editId) await db.collection('courses').doc(editId).update(data);else await db.collection('courses').add(data);
      setShowForm(false);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    setSaving(false);
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`ลบรายวิชา "${name}"?`)) return;
    await db.collection('courses').doc(id).delete();
  };
  const mainTotal = Number(form.continuous) + Number(form.midterm) + Number(form.final);
  const subTotal = itemsSum();
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-book-open",
    className: "text-red-700",
    size: 24
  }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mt-1"
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E30\u0E41\u0E19\u0E19\u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32")), /*#__PURE__*/React.createElement("button", {
    onClick: openAdd,
    className: "flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32")), showForm && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg mb-5 text-gray-800"
  }, editId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSave,
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement(F, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E27\u0E34\u0E0A\u0E32 *"
  }, /*#__PURE__*/React.createElement("input", {
    required: true,
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0833201",
    value: form.code,
    onChange: e => setForm(p => ({
      ...p,
      code: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(F, {
    label: "\u0E2B\u0E19\u0E48\u0E27\u0E22\u0E01\u0E34\u0E15"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.5",
    min: "0.5",
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.credits,
    onChange: e => setForm(p => ({
      ...p,
      credits: e.target.value
    }))
  }))), /*#__PURE__*/React.createElement(F, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E27\u0E34\u0E0A\u0E32 *"
  }, /*#__PURE__*/React.createElement("input", {
    required: true,
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 5",
    value: form.name,
    onChange: e => setForm(p => ({
      ...p,
      name: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement(F, {
    label: "\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E0A\u0E31\u0E49\u0E19"
  }, /*#__PURE__*/React.createElement("select", {
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.gradeLevel,
    onChange: e => setForm(p => ({
      ...p,
      gradeLevel: e.target.value
    }))
  }, GRADE_LEVELS.map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  }, g)))), /*#__PURE__*/React.createElement(F, {
    label: "\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32"
  }, /*#__PURE__*/React.createElement("input", {
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.year,
    onChange: e => setForm(p => ({
      ...p,
      year: e.target.value
    }))
  })), /*#__PURE__*/React.createElement(F, {
    label: "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19"
  }, /*#__PURE__*/React.createElement("select", {
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
    value: form.term,
    onChange: e => setForm(p => ({
      ...p,
      term: e.target.value
    }))
  }, /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48 1"), /*#__PURE__*/React.createElement("option", {
    value: "2"
  }, "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48 2")))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-green-50 rounded-lg border border-green-200 space-y-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-green-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-door-open",
    size: 14
  }), " \u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E40\u0E23\u0E35\u0E22\u0E19\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32\u0E19\u0E35\u0E49", /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-green-600 text-xs"
  }, "(\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E41\u0E25\u0E49\u0E27\u0E01\u0E14 Enter \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14 + \u0E40\u0E1E\u0E34\u0E48\u0E21)")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    value: classInput,
    onChange: e => setClassInput(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addClassroom();
      }
    },
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E21.6/2, \u0E21.5/1 ...",
    list: "course-class-suggestions",
    className: "flex-1 px-3 py-2 border border-green-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-300 bg-white"
  }), /*#__PURE__*/React.createElement("datalist", {
    id: "course-class-suggestions"
  }, ['ม.4/1', 'ม.4/2', 'ม.4/3', 'ม.4/4', 'ม.4/5', 'ม.5/1', 'ม.5/2', 'ม.5/3', 'ม.5/4', 'ม.5/5', 'ม.6/1', 'ม.6/2', 'ม.6/3', 'ม.6/4', 'ม.6/5', 'ม.1/1', 'ม.2/1', 'ม.3/1'].map(c => /*#__PURE__*/React.createElement("option", {
    key: c,
    value: c
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: addClassroom,
    className: "px-4 py-2 bg-green-700 text-white text-sm font-bold rounded-lg hover:bg-green-800 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 12
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21")), form.classrooms.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, form.classrooms.map(cls => /*#__PURE__*/React.createElement("span", {
    key: cls,
    className: "flex items-center gap-1.5 bg-green-700 text-white text-xs font-bold px-3 py-1 rounded-full"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chalkboard",
    size: 10
  }), cls, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => removeClassroom(cls),
    className: "ml-0.5 hover:text-red-200 leading-none"
  }, "\xD7")))) : /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-green-600 italic"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19 \u2014 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-gray-700"
  }, "\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E30\u0E41\u0E19\u0E19\u0E2B\u0E25\u0E31\u0E01 (\u0E23\u0E27\u0E21 = 100%)"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, [['continuous', 'คะแนนเก็บ'], ['midterm', 'กลางภาค'], ['final', 'ปลายภาค']].map(([key, lbl]) => /*#__PURE__*/React.createElement(F, {
    key: key,
    label: `${lbl} (%)`
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "100",
    required: true,
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-center font-bold",
    value: form[key],
    onChange: e => {
      const val = e.target.value;
      setForm(p => {
        const updated = {
          ...p,
          [key]: val
        };
        if (key === 'continuous') {
          /* sync item เดียวถ้ายังเป็น default */
          if (p.continuousItems.length === 1 && p.continuousItems[0].label === 'คะแนนเก็บ') {
            updated.continuousItems = [{
              label: 'คะแนนเก็บ',
              score: Number(val) || 0
            }];
          }
        }
        return updated;
      });
    }
  })))), /*#__PURE__*/React.createElement("p", {
    className: `text-sm font-bold ${mainTotal === 100 ? 'text-green-600' : 'text-red-500'}`
  }, "\u0E23\u0E27\u0E21: ", mainTotal, "% ", mainTotal === 100 ? '✓' : '(ต้องรวมเป็น 100)'), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-gray-200 pt-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-bold text-gray-700"
  }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E01\u0E47\u0E1A", /*#__PURE__*/React.createElement("span", {
    className: "ml-2 text-xs font-normal text-gray-400"
  }, "(\u0E23\u0E27\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E17\u0E48\u0E32\u0E01\u0E31\u0E1A ", form.continuous, "%)")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: addItem,
    className: "flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 11
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, form.continuousItems.map((item, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400 w-5 text-center"
  }, idx + 1, "."), /*#__PURE__*/React.createElement("input", {
    placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E32\u0E23\u0E1A\u0E49\u0E32\u0E19, \u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E22\u0E48\u0E2D\u0E22",
    className: "flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300",
    value: item.label,
    onChange: e => updateItem(idx, 'label', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: "100",
    className: "w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-red-300 font-bold",
    value: item.score,
    onChange: e => updateItem(idx, 'score', e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, "%")), form.continuousItems.length > 1 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => removeItem(idx),
    className: "text-red-400 hover:text-red-600 p-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times",
    size: 12
  }))))), /*#__PURE__*/React.createElement("p", {
    className: `text-sm mt-2 font-bold ${subTotal === Number(form.continuous) ? 'text-green-600' : 'text-orange-500'}`
  }, "\u0E23\u0E27\u0E21\u0E22\u0E48\u0E2D\u0E22: ", subTotal, "% ", subTotal === Number(form.continuous) ? '✓' : `(ยังขาด ${Number(form.continuous) - subTotal}%)`))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setShowForm(false),
    className: "flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: saving,
    className: "flex-1 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold disabled:opacity-70 flex items-center justify-center gap-2"
  }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 14
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-save",
    size: 14
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))))), /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4"
  }, courses.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-10 rounded-xl text-center text-gray-400 border border-gray-200"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-book-open",
    size: 40,
    className: "mb-3 block mx-auto opacity-40"
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21 \"\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32\" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19") : courses.map(c => {
    const isExpanded = expandedId === c.id;
    const items = c.continuousItems || [];
    return /*#__PURE__*/React.createElement("div", {
      key: c.id,
      className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "p-5 flex items-start justify-between"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-1 flex-wrap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded"
    }, c.code), c.gradeLevel && /*#__PURE__*/React.createElement("span", {
      className: "bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded"
    }, c.gradeLevel), /*#__PURE__*/React.createElement("span", {
      className: "bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
    }, "\u0E1B\u0E35 ", c.year, " / \u0E40\u0E17\u0E2D\u0E21 ", c.term), /*#__PURE__*/React.createElement("span", {
      className: "bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded"
    }, c.credits, " \u0E2B\u0E19\u0E48\u0E27\u0E22\u0E01\u0E34\u0E15")), /*#__PURE__*/React.createElement("h3", {
      className: "text-lg font-bold text-gray-800"
    }, c.name), /*#__PURE__*/React.createElement("div", {
      className: "mt-3 space-y-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex gap-1 h-4 rounded-full overflow-hidden text-xs"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-orange-400 flex items-center justify-center text-white font-bold",
      style: {
        width: `${c.continuous ?? 50}%`
      }
    }, (c.continuous ?? 50) >= 15 ? `เก็บ ${c.continuous ?? 50}%` : ''), /*#__PURE__*/React.createElement("div", {
      className: "bg-blue-400 flex items-center justify-center text-white font-bold",
      style: {
        width: `${c.midterm ?? 20}%`
      }
    }, (c.midterm ?? 20) >= 15 ? `กลาง ${c.midterm ?? 20}%` : ''), /*#__PURE__*/React.createElement("div", {
      className: "bg-red-400 flex items-center justify-center text-white font-bold",
      style: {
        width: `${c.final ?? 30}%`
      }
    }, (c.final ?? 30) >= 15 ? `ปลาย ${c.final ?? 30}%` : '')), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-4 text-xs text-gray-500"
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "inline-block w-2 h-2 rounded-full bg-orange-400 mr-1"
    }), "\u0E40\u0E01\u0E47\u0E1A ", c.continuous ?? 50, "%"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "inline-block w-2 h-2 rounded-full bg-blue-400 mr-1"
    }), "\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04 ", c.midterm ?? 20, "%"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
      className: "inline-block w-2 h-2 rounded-full bg-red-400 mr-1"
    }), "\u0E1B\u0E25\u0E32\u0E22\u0E20\u0E32\u0E04 ", c.final ?? 30, "%"))), c.classrooms && c.classrooms.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1.5 mt-2"
    }, c.classrooms.map(cls => /*#__PURE__*/React.createElement("span", {
      key: cls,
      className: "bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-chalkboard",
      size: 9
    }), cls))), items.length > 0 && /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => setExpandedId(isExpanded ? null : c.id),
      className: "mt-2 text-xs text-red-600 hover:underline flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: isExpanded ? 'fa-chevron-up' : 'fa-chevron-down',
      size: 10
    }), isExpanded ? 'ซ่อนรายละเอียดคะแนนเก็บ' : `ดูรายละเอียดคะแนนเก็บ (${items.length} รายการ)`)), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 ml-4 shrink-0"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openAnnounce(c),
      title: "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28",
      className: `p-2 rounded-lg transition-colors ${announceCourse?.id === c.id ? 'bg-yellow-400 text-yellow-900' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-bullhorn",
      size: 14
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => openEdit(c),
      className: "p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-edit",
      size: 14
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => handleDelete(c.id, c.name),
      className: "p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-trash",
      size: 14
    })))), isExpanded && items.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "px-5 pb-4 border-t border-gray-100 bg-orange-50"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs font-bold text-orange-700 mt-3 mb-2"
    }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-2"
    }, items.map((it, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-orange-100"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-sm text-gray-700"
    }, it.label || `รายการ ${i + 1}`), /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-bold text-orange-600"
    }, it.score, "%"))))), announceCourse?.id === c.id && /*#__PURE__*/React.createElement("div", {
      className: "border-t-2 border-yellow-300 bg-yellow-50 px-5 py-5 space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-yellow-900 flex items-center gap-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-bullhorn",
      size: 15
    }), " \u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A: ", c.name), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-1"
    }, (c.classrooms || []).map(cls => /*#__PURE__*/React.createElement("span", {
      key: cls,
      className: "text-xs bg-yellow-200 text-yellow-800 font-bold px-2 py-0.5 rounded-full"
    }, cls)), (c.classrooms || []).length === 0 && /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-yellow-600 italic"
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19 \u2014 \u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28"))), /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-xl border border-yellow-200 p-4 space-y-3"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-sm font-bold text-gray-700"
    }, "\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E43\u0E2B\u0E21\u0E48"), /*#__PURE__*/React.createElement("textarea", {
      rows: 3,
      className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-300 resize-none",
      placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28...",
      value: announceText,
      onChange: e => setAnnounceText(e.target.value)
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("label", {
      className: "flex items-center gap-2 cursor-pointer select-none"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: announcePinned,
      onChange: e => setAnnouncePinned(e.target.checked),
      className: "w-4 h-4 accent-yellow-500"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-sm text-gray-600 flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-thumbtack",
      size: 12,
      className: "text-yellow-600"
    }), " \u0E1B\u0E31\u0E01\u0E2B\u0E21\u0E38\u0E14 (\u0E41\u0E2A\u0E14\u0E07\u0E01\u0E48\u0E2D\u0E19)")), /*#__PURE__*/React.createElement("button", {
      onClick: saveAnnounce,
      disabled: announceSaving || !announceText.trim(),
      className: "flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg"
    }, announceSaving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-spinner fa-spin",
      size: 13
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-paper-plane",
      size: 13
    }), " \u0E42\u0E1E\u0E2A\u0E15\u0E4C\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28")))), announceLoading ? /*#__PURE__*/React.createElement("div", {
      className: "text-center py-4 text-yellow-600"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-spinner fa-spin",
      size: 18,
      className: "block mx-auto mb-1"
    }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...") : announceList.length === 0 ? /*#__PURE__*/React.createElement("p", {
      className: "text-center text-sm text-yellow-600 italic py-2"
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32\u0E19\u0E35\u0E49") : /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, announceList.map(a => /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: `flex items-start gap-3 bg-white rounded-xl border px-4 py-3 ${a.pinned ? 'border-yellow-400' : 'border-gray-200'}`
    }, a.pinned && /*#__PURE__*/React.createElement(Icon, {
      name: "fa-thumbtack",
      size: 13,
      className: "text-yellow-500 mt-0.5 flex-shrink-0"
    }), /*#__PURE__*/React.createElement("p", {
      className: "flex-1 text-sm text-gray-800 whitespace-pre-wrap"
    }, a.message), /*#__PURE__*/React.createElement("div", {
      className: "flex-shrink-0 text-right"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-gray-400 mb-1"
    }, a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('th-TH') : ''), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteAnnounce(a.id),
      className: "text-xs text-red-400 hover:text-red-600 hover:underline"
    }, "\u0E25\u0E1A")))))));
  })));
};
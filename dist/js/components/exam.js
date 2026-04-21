// js/components/exam.jsx

/* ── helpers (backward-compat: choices เดิมเป็น string) ── */
const getChoiceText = c => typeof c === 'string' ? c : c?.text || '';
const getChoiceImg = c => typeof c === 'string' ? '' : c?.imageUrl || '';
const migrateChoice = c => typeof c === 'string' ? {
  text: c,
  imageUrl: ''
} : {
  text: c?.text || '',
  imageUrl: c?.imageUrl || ''
};

/* บันทึกคะแนนอัตโนมัติไปยัง studentScores */
const saveExamScoreToStudentScores = async (exam, userId, userName, userClass, userNo, correct) => {
  if (!exam?.targetCourseId || !exam?.targetField) return null;
  const total = exam.questions?.length || 1;
  const max = Number(exam.targetFieldMax) || total;
  const savedScore = Math.round(correct / total * max * 10) / 10;
  try {
    const existing = await db.collection('studentScores').where('studentId', '==', userId).where('courseId', '==', exam.targetCourseId).get();
    const data = {
      studentId: userId,
      studentName: userName,
      class: userClass,
      no: userNo,
      courseId: exam.targetCourseId,
      courseName: exam.targetCourseName || '',
      [exam.targetField]: savedScore,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (!existing.empty) await db.collection('studentScores').doc(existing.docs[0].id).set(data, {
      merge: true
    });else await db.collection('studentScores').add(data);
    return savedScore;
  } catch {
    return null;
  }
};

// ══════════════════════════════════════════
// ExamManager (ครู)
// ══════════════════════════════════════════
window.ExamManager = () => {
  const {
    useState,
    useEffect
  } = React;
  const [view, setView] = useState('list');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selExam, setSelExam] = useState(null);
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState([]);
  const [uploading, setUploading] = useState(''); // 'question' | 'choice-0' | ...

  const emptyExam = {
    title: '',
    description: '',
    timeLimit: 30,
    isOpen: false,
    questions: [],
    targetCourseId: '',
    targetCourseName: '',
    targetField: '',
    targetFieldMax: 0
  };
  const [form, setForm] = useState(emptyExam);
  const emptyQ = {
    text: '',
    imageUrl: '',
    choices: [{
      text: '',
      imageUrl: ''
    }, {
      text: '',
      imageUrl: ''
    }, {
      text: '',
      imageUrl: ''
    }, {
      text: '',
      imageUrl: ''
    }],
    answer: 0
  };
  const [qForm, setQForm] = useState(emptyQ);
  const [editQIdx, setEditQIdx] = useState(null);

  /* โหลดข้อสอบ */
  useEffect(() => {
    const unsub = db.collection('exams').orderBy('createdAt', 'desc').onSnapshot(snap => {
      setExams(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  /* โหลดรายวิชา */
  useEffect(() => {
    db.collection('courses').orderBy('name').get().then(snap => setCourses(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })))).catch(() => {});
  }, []);

  /* โหลดผลสอบ */
  useEffect(() => {
    if (view !== 'results' || !selExam) return;
    const unsub = db.collection('examResults').where('examId', '==', selExam.id).orderBy('submittedAt', 'desc').onSnapshot(snap => setResults(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))), () => {});
    return () => unsub();
  }, [view, selExam]);

  /* ─── Score fields helper ─── */
  const getScoreFields = courseId => {
    const c = courses.find(x => x.id === courseId);
    if (!c) return [];
    const items = c.continuousItems || [];
    return [...items.map(it => ({
      field: `cont_${it.label}`,
      label: `คะแนนเก็บ: ${it.label} (เต็ม ${it.score})`,
      max: Number(it.score)
    })), {
      field: 'midterm',
      label: `กลางภาค (เต็ม ${c.midterm || 20})`,
      max: Number(c.midterm || 20)
    }, {
      field: 'midtermRetake',
      label: `แก้กลางภาค (เต็ม ${c.midterm || 20})`,
      max: Number(c.midterm || 20)
    }, {
      field: 'final',
      label: `ปลายภาค (เต็ม ${c.final || 30})`,
      max: Number(c.final || 30)
    }];
  };

  /* ─── Image upload ─── */
  const uploadImage = async (file, field) => {
    if (!file) return '';
    setUploading(field);
    try {
      const path = `exam-images/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const snap = await storage.ref(path).put(file);
      return await snap.ref.getDownloadURL();
    } catch {
      alert('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
      return '';
    } finally {
      setUploading('');
    }
  };
  const handleUploadQImg = async e => {
    const url = await uploadImage(e.target.files?.[0], 'question');
    if (url) setQForm(p => ({
      ...p,
      imageUrl: url
    }));
    e.target.value = '';
  };
  const handleUploadChoiceImg = async (e, ci) => {
    const url = await uploadImage(e.target.files?.[0], `choice-${ci}`);
    if (url) setQForm(p => ({
      ...p,
      choices: p.choices.map((c, i) => i === ci ? {
        ...c,
        imageUrl: url
      } : c)
    }));
    e.target.value = '';
  };

  /* ─── CRUD ─── */
  const openAdd = () => {
    setForm(emptyExam);
    setSelExam(null);
    setQForm(emptyQ);
    setEditQIdx(null);
    setView('edit');
    window.scrollTo({
      top: 0
    });
  };
  const openEdit = exam => {
    setForm({
      ...emptyExam,
      ...exam,
      questions: (exam.questions || []).map(q => ({
        text: q.text || '',
        imageUrl: q.imageUrl || '',
        choices: (q.choices || []).map(migrateChoice),
        answer: q.answer || 0
      }))
    });
    setSelExam(exam);
    setQForm(emptyQ);
    setEditQIdx(null);
    setView('edit');
    window.scrollTo({
      top: 0
    });
  };
  const openResults = exam => {
    setSelExam(exam);
    setView('results');
  };
  const saveExam = async () => {
    if (!form.title.trim()) return alert('กรุณากรอกชื่อชุดข้อสอบ');
    if (form.questions.length === 0) return alert('กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ');
    setSaving(true);
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      timeLimit: Number(form.timeLimit) || 30,
      isOpen: form.isOpen || false,
      questions: form.questions,
      targetCourseId: form.targetCourseId || '',
      targetCourseName: form.targetCourseName || '',
      targetField: form.targetField || '',
      targetFieldMax: Number(form.targetFieldMax) || 0,
      createdAt: selExam ? form.createdAt : firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      if (selExam) await db.collection('exams').doc(selExam.id).update(data);else await db.collection('exams').add(data);
      setView('list');
    } catch {
      alert('บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };
  const deleteExam = async id => {
    if (!window.confirm('ลบชุดข้อสอบนี้?')) return;
    await db.collection('exams').doc(id).delete().catch(() => {});
  };
  const toggleOpen = async exam => db.collection('exams').doc(exam.id).update({
    isOpen: !exam.isOpen
  }).catch(() => {});
  const addOrUpdateQ = () => {
    if (!qForm.text.trim() && !qForm.imageUrl) return alert('กรุณากรอกคำถามหรืออัปโหลดรูปภาพ');
    if (qForm.choices.some(c => !c.text.trim() && !c.imageUrl)) return alert('กรุณากรอกข้อความหรืออัปโหลดรูปให้ครบทุกตัวเลือก');
    const qs = [...form.questions];
    if (editQIdx !== null) qs[editQIdx] = {
      ...qForm
    };else qs.push({
      ...qForm
    });
    setForm(p => ({
      ...p,
      questions: qs
    }));
    setQForm(emptyQ);
    setEditQIdx(null);
  };
  const editQ = idx => {
    setQForm({
      ...form.questions[idx]
    });
    setEditQIdx(idx);
  };
  const deleteQ = idx => setForm(p => ({
    ...p,
    questions: p.questions.filter((_, i) => i !== idx)
  }));

  /* ─── Upload button helper ─── */
  const UploadBtn = ({
    field,
    onFile,
    label = 'อัปโหลดรูป'
  }) => /*#__PURE__*/React.createElement("label", {
    className: `inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 text-xs text-gray-500 transition-colors ${uploading === field ? 'opacity-60 pointer-events-none' : ''}`
  }, uploading === field ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 12
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-image",
    size: 12
  }), " ", label), /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: onFile
  }));
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 32,
    className: "text-red-600 block mx-auto mb-2"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."));

  /* ══ ผลสอบ ══ */
  if (view === 'results') {
    const total = selExam?.questions?.length || 1;
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setView('list'),
      className: "text-gray-500 hover:text-gray-800"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("h2", {
      className: "text-xl font-bold text-gray-800"
    }, "\u0E1C\u0E25\u0E2A\u0E2D\u0E1A: ", selExam?.title)), selExam?.targetCourseId && /*#__PURE__*/React.createElement("div", {
      className: "bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm text-blue-700 flex items-center gap-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-link",
      size: 13
    }), "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E2A\u0E48\u0E07\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34 \u2192 ", /*#__PURE__*/React.createElement("strong", null, selExam.targetCourseName), " \u2014 ", selExam.targetField, " (\u0E40\u0E15\u0E47\u0E21 ", selExam.targetFieldMax, ")"), results.length === 0 ? /*#__PURE__*/React.createElement("div", {
      className: "text-center py-16 text-gray-400"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-inbox",
      size: 40,
      className: "block mx-auto mb-3"
    }), /*#__PURE__*/React.createElement("p", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1C\u0E39\u0E49\u0E2A\u0E48\u0E07\u0E04\u0E33\u0E15\u0E2D\u0E1A")) : /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    }, /*#__PURE__*/React.createElement("div", {
      className: "overflow-x-auto"
    }, /*#__PURE__*/React.createElement("table", {
      className: "w-full text-sm"
    }, /*#__PURE__*/React.createElement("thead", {
      className: "bg-gray-50 text-gray-600 text-xs uppercase"
    }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-left"
    }, "\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-left"
    }, "\u0E2B\u0E49\u0E2D\u0E07"), /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-center"
    }, "\u0E04\u0E30\u0E41\u0E19\u0E19"), /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-center"
    }, "%"), selExam?.targetCourseId && /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-center"
    }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("th", {
      className: "px-4 py-3 text-center"
    }, "\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07"))), /*#__PURE__*/React.createElement("tbody", {
      className: "divide-y divide-gray-100"
    }, results.map(r => {
      const pct = Math.round(r.score / total * 100);
      return /*#__PURE__*/React.createElement("tr", {
        key: r.id,
        className: "hover:bg-gray-50"
      }, /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 font-medium"
      }, r.studentName), /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 text-gray-500"
      }, r.class), /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 text-center font-bold"
      }, r.score, "/", total), /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 text-center"
      }, /*#__PURE__*/React.createElement("span", {
        className: `font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`
      }, pct, "%")), selExam?.targetCourseId && /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 text-center"
      }, r.savedScore != null ? /*#__PURE__*/React.createElement("span", {
        className: "text-green-600 text-xs font-bold flex items-center gap-1 justify-center"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "fa-check-circle",
        size: 11
      }), " ", r.savedScore) : /*#__PURE__*/React.createElement("span", {
        className: "text-gray-300 text-xs"
      }, "\u2014")), /*#__PURE__*/React.createElement("td", {
        className: "px-4 py-3 text-center text-gray-400 text-xs"
      }, r.submittedAt?.toDate ? r.submittedAt.toDate().toLocaleString('th-TH') : '-'));
    })))), /*#__PURE__*/React.createElement("div", {
      className: "p-4 bg-gray-50 border-t border-gray-100 flex justify-between text-sm text-gray-600"
    }, /*#__PURE__*/React.createElement("span", null, "\u0E1C\u0E39\u0E49\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E2D\u0E1A ", /*#__PURE__*/React.createElement("strong", null, results.length), " \u0E04\u0E19"), /*#__PURE__*/React.createElement("span", null, "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 ", /*#__PURE__*/React.createElement("strong", null, (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)), " / ", total))));
  }

  /* ══ สร้าง/แก้ไข ══ */
  if (view === 'edit') {
    const scoreFields = getScoreFields(form.targetCourseId);
    return /*#__PURE__*/React.createElement("div", {
      className: "space-y-5 max-w-3xl"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setView('list'),
      className: "text-gray-500 hover:text-gray-800"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-arrow-left",
      size: 18
    })), /*#__PURE__*/React.createElement("h2", {
      className: "text-xl font-bold text-gray-800"
    }, selExam ? 'แก้ไขชุดข้อสอบ' : 'สร้างชุดข้อสอบใหม่')), /*#__PURE__*/React.createElement("div", {
      className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-gray-700"
    }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A"), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-sm font-bold text-gray-700 mb-1"
    }, "\u0E0A\u0E37\u0E48\u0E2D\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A"), /*#__PURE__*/React.createElement("input", {
      className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
      placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2A\u0E2D\u0E1A\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04 \u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 5",
      value: form.title,
      onChange: e => setForm(p => ({
        ...p,
        title: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-sm font-bold text-gray-700 mb-1"
    }, "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22"), /*#__PURE__*/React.createElement("input", {
      className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
      placeholder: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)",
      value: form.description,
      onChange: e => setForm(p => ({
        ...p,
        description: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-sm font-bold text-gray-700 mb-1"
    }, "\u0E40\u0E27\u0E25\u0E32 (\u0E19\u0E32\u0E17\u0E35)"), /*#__PURE__*/React.createElement("input", {
      type: "number",
      min: "1",
      className: "w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300",
      value: form.timeLimit,
      onChange: e => setForm(p => ({
        ...p,
        timeLimit: e.target.value
      }))
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3 pt-6"
    }, /*#__PURE__*/React.createElement("label", {
      className: "relative inline-flex items-center cursor-pointer"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      className: "sr-only peer",
      checked: form.isOpen,
      onChange: e => setForm(p => ({
        ...p,
        isOpen: e.target.checked
      }))
    }), /*#__PURE__*/React.createElement("div", {
      className: "w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-sm font-medium text-gray-700"
    }, "\u0E40\u0E1B\u0E34\u0E14\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E2D\u0E1A")))), /*#__PURE__*/React.createElement("div", {
      className: "bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200 space-y-4"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-blue-900 flex items-center gap-2 mb-1"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-link",
      size: 15
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-blue-600"
    }, "\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A \u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E04\u0E33\u0E19\u0E27\u0E13\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19\u0E25\u0E07\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E31\u0E19\u0E17\u0E35 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A)")), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 gap-4"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs font-bold text-gray-700 mb-1"
    }, "\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("select", {
      className: "w-full px-3 py-2 border border-blue-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white",
      value: form.targetCourseId,
      onChange: e => {
        const c = courses.find(x => x.id === e.target.value);
        setForm(p => ({
          ...p,
          targetCourseId: e.target.value,
          targetCourseName: c?.name || '',
          targetField: '',
          targetFieldMax: 0
        }));
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "\u2014 \u0E44\u0E21\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E01\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32 \u2014"), courses.map(c => /*#__PURE__*/React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.code ? `[${c.code}] ` : '', c.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs font-bold text-gray-700 mb-1"
    }, "\u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E30\u0E41\u0E19\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"), /*#__PURE__*/React.createElement("select", {
      disabled: !form.targetCourseId,
      className: "w-full px-3 py-2 border border-blue-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300 bg-white disabled:opacity-50",
      value: form.targetField,
      onChange: e => {
        const sf = scoreFields.find(f => f.field === e.target.value);
        setForm(p => ({
          ...p,
          targetField: e.target.value,
          targetFieldMax: sf?.max || 0
        }));
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: ""
    }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E30\u0E41\u0E19\u0E19 \u2014"), scoreFields.map(sf => /*#__PURE__*/React.createElement("option", {
      key: sf.field,
      value: sf.field
    }, sf.label))))), form.targetField && /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-lg px-4 py-3 text-sm border border-blue-200 flex items-center gap-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-calculator",
      size: 13,
      className: "text-blue-600 flex-shrink-0"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-gray-700"
    }, "\u0E2A\u0E39\u0E15\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13: ", /*#__PURE__*/React.createElement("strong", {
      className: "text-blue-800"
    }, "(\u0E15\u0E2D\u0E1A\u0E16\u0E39\u0E01 \xF7 ", form.questions.length || 'จำนวนข้อ', ") \xD7 ", form.targetFieldMax), ' ', "= \u0E04\u0E30\u0E41\u0E19\u0E19\u0E17\u0E35\u0E48\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))), /*#__PURE__*/React.createElement("div", {
      className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-gray-700"
    }, "\u0E04\u0E33\u0E16\u0E32\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (", form.questions.length, " \u0E02\u0E49\u0E2D)"), form.questions.map((q, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "p-4 bg-gray-50 rounded-lg border border-gray-200"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-start justify-between gap-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: "font-medium text-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-red-700 font-bold mr-1"
    }, "\u0E02\u0E49\u0E2D ", i + 1, "."), q.text || /*#__PURE__*/React.createElement("span", {
      className: "text-gray-400 italic"
    }, "(\u0E21\u0E35\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E)")), q.imageUrl && /*#__PURE__*/React.createElement("img", {
      src: q.imageUrl,
      alt: "",
      className: "mt-2 h-20 object-contain rounded bg-gray-100"
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-1 shrink-0"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => editQ(i),
      className: "text-blue-500 px-2 py-1 text-xs border border-blue-200 rounded hover:bg-blue-50"
    }, "\u0E41\u0E01\u0E49\u0E44\u0E02"), /*#__PURE__*/React.createElement("button", {
      onClick: () => deleteQ(i),
      className: "text-red-500 px-2 py-1 text-xs border border-red-200 rounded hover:bg-red-50"
    }, "\u0E25\u0E1A"))), /*#__PURE__*/React.createElement("div", {
      className: "mt-2 grid grid-cols-2 gap-1"
    }, (q.choices || []).map((c, ci) => {
      const txt = getChoiceText(c);
      const img = getChoiceImg(c);
      return /*#__PURE__*/React.createElement("div", {
        key: ci,
        className: `text-xs px-2 py-1.5 rounded flex items-center gap-1 ${ci === q.answer ? 'bg-green-100 text-green-800 font-bold' : 'text-gray-500 bg-white border border-gray-100'}`
      }, /*#__PURE__*/React.createElement("span", {
        className: "font-bold shrink-0"
      }, String.fromCharCode(65 + ci), "."), img ? /*#__PURE__*/React.createElement("img", {
        src: img,
        alt: "",
        className: "h-8 object-contain rounded"
      }) : /*#__PURE__*/React.createElement("span", null, txt));
    })))), /*#__PURE__*/React.createElement("div", {
      className: "p-5 bg-red-50 rounded-xl border border-red-200 space-y-4"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-sm text-red-800"
    }, editQIdx !== null ? `✏️ แก้ไขข้อ ${editQIdx + 1}` : '➕ เพิ่มคำถามใหม่'), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs font-bold text-gray-700"
    }, "\u0E04\u0E33\u0E16\u0E32\u0E21"), /*#__PURE__*/React.createElement("input", {
      className: "w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-sm bg-white",
      placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E04\u0E33\u0E16\u0E32\u0E21 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E16\u0E49\u0E32\u0E21\u0E35\u0E23\u0E39\u0E1B)",
      value: qForm.text,
      onChange: e => setQForm(p => ({
        ...p,
        text: e.target.value
      }))
    }), qForm.imageUrl ? /*#__PURE__*/React.createElement("div", {
      className: "relative inline-block"
    }, /*#__PURE__*/React.createElement("img", {
      src: qForm.imageUrl,
      alt: "",
      className: "max-h-40 rounded border border-gray-200 bg-white object-contain"
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setQForm(p => ({
        ...p,
        imageUrl: ''
      })),
      className: "absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700 font-bold"
    }, "\xD7")) : /*#__PURE__*/React.createElement(UploadBtn, {
      field: "question",
      onFile: handleUploadQImg,
      label: "\u0E2D\u0E31\u0E1B\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E39\u0E1B\u0E20\u0E32\u0E1E\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E04\u0E33\u0E16\u0E32\u0E21"
    })), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
    }, qForm.choices.map((c, ci) => /*#__PURE__*/React.createElement("div", {
      key: ci,
      className: "space-y-1.5 bg-white p-3 rounded-lg border border-gray-200"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs font-bold text-gray-700"
    }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01 ", String.fromCharCode(65 + ci), ci === qForm.answer && /*#__PURE__*/React.createElement("span", {
      className: "ml-2 text-green-600 font-bold"
    }, "\u2713 \u0E40\u0E09\u0E25\u0E22")), /*#__PURE__*/React.createElement("input", {
      className: "w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-red-300",
      placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21 (\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E16\u0E49\u0E32\u0E21\u0E35\u0E23\u0E39\u0E1B)",
      value: c.text,
      onChange: e => setQForm(p => ({
        ...p,
        choices: p.choices.map((x, i) => i === ci ? {
          ...x,
          text: e.target.value
        } : x)
      }))
    }), c.imageUrl ? /*#__PURE__*/React.createElement("div", {
      className: "relative inline-block"
    }, /*#__PURE__*/React.createElement("img", {
      src: c.imageUrl,
      alt: "",
      className: "max-h-20 rounded border border-gray-100 object-contain bg-gray-50"
    }), /*#__PURE__*/React.createElement("button", {
      onClick: () => setQForm(p => ({
        ...p,
        choices: p.choices.map((x, i) => i === ci ? {
          ...x,
          imageUrl: ''
        } : x)
      })),
      className: "absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700 font-bold"
    }, "\xD7")) : /*#__PURE__*/React.createElement(UploadBtn, {
      field: `choice-${ci}`,
      onFile: e => handleUploadChoiceImg(e, ci),
      label: "\u0E43\u0E2A\u0E48\u0E23\u0E39\u0E1B"
    })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs font-bold text-gray-700 mb-2"
    }, "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01 (\u0E40\u0E09\u0E25\u0E22)"), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, ['A', 'B', 'C', 'D'].map((l, ci) => /*#__PURE__*/React.createElement("button", {
      key: ci,
      type: "button",
      onClick: () => setQForm(p => ({
        ...p,
        answer: ci
      })),
      className: `flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${qForm.answer === ci ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`
    }, l)))), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 pt-1"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: addOrUpdateQ,
      className: "flex-1 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg"
    }, editQIdx !== null ? '✓ อัปเดตคำถาม' : '+ เพิ่มคำถาม'), editQIdx !== null && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setQForm(emptyQ);
        setEditQIdx(null);
      },
      className: "px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold rounded-lg"
    }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")))), /*#__PURE__*/React.createElement("button", {
      onClick: saveExam,
      disabled: saving,
      className: "w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-xl shadow disabled:opacity-60 flex items-center justify-center gap-2"
    }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-spinner fa-spin",
      size: 16
    }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-save",
      size: 16
    }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A")));
  }

  /* ══ รายการข้อสอบ ══ */
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-desktop",
    className: "text-red-700",
    size: 22
  }), " \u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C"), /*#__PURE__*/React.createElement("button", {
    onClick: openAdd,
    className: "flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 14
  }), " \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A")), exams.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-file-alt",
    size: 48,
    className: "block mx-auto mb-4"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-lg font-medium"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A")) : /*#__PURE__*/React.createElement("div", {
    className: "grid gap-4"
  }, exams.map(exam => /*#__PURE__*/React.createElement("div", {
    key: exam.id,
    className: `bg-white p-5 rounded-xl shadow-sm border-2 transition-all ${exam.isOpen ? 'border-green-400' : 'border-gray-200'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-wrap mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xs font-bold px-2 py-0.5 rounded-full ${exam.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`
  }, exam.isOpen ? '🟢 เปิดรับสอบ' : '⚫ ปิดสอบ'), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, exam.questions?.length || 0, " \u0E02\u0E49\u0E2D \xB7 ", exam.timeLimit, " \u0E19\u0E32\u0E17\u0E35"), exam.targetCourseId && /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-link",
    size: 9
  }), " ", exam.targetCourseName)), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-bold text-gray-800"
  }, exam.title), exam.description && /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mt-0.5"
  }, exam.description), exam.targetField && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-blue-500 mt-1 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-arrow-right",
    size: 9
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E1B: ", exam.targetField, " (\u0E40\u0E15\u0E47\u0E21 ", exam.targetFieldMax, ")")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0 flex-wrap justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => toggleOpen(exam),
    className: `px-3 py-1.5 text-xs font-bold rounded-lg border ${exam.isOpen ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`
  }, exam.isOpen ? 'ปิดสอบ' : 'เปิดสอบ'), /*#__PURE__*/React.createElement("button", {
    onClick: () => openResults(exam),
    className: "px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chart-bar",
    size: 12
  }), " \u0E1C\u0E25\u0E2A\u0E2D\u0E1A"), /*#__PURE__*/React.createElement("button", {
    onClick: () => openEdit(exam),
    className: "px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-edit",
    size: 12
  }), " \u0E41\u0E01\u0E49\u0E44\u0E02"), /*#__PURE__*/React.createElement("button", {
    onClick: () => deleteExam(exam.id),
    className: "px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-trash",
    size: 12
  }))))))));
};

// ══════════════════════════════════════════
// StudentExam (นักเรียนทำข้อสอบ)
// ══════════════════════════════════════════
window.StudentExam = ({
  user
}) => {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const [examState, setExamState] = useState('loading');
  const [openExams, setOpenExams] = useState([]);
  const [selExam, setSelExam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [savedScore, setSavedScore] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const selExamRef = useRef(null);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    selExamRef.current = selExam;
  }, [selExam]);
  useEffect(() => {
    db.collection('exams').where('isOpen', '==', true).get().then(snap => {
      setOpenExams(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setExamState('select');
    }).catch(() => setExamState('select'));
  }, []);

  /* Timer — ใช้ ref ป้องกัน stale closure */
  useEffect(() => {
    if (examState !== 'testing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const exam = selExamRef.current;
          const ans = answersRef.current;
          const qs = exam?.questions || [];
          const correct = qs.filter((q, i) => ans[i] === q.answer).length;
          setScore(correct);
          db.collection('examResults').add({
            examId: exam.id,
            examTitle: exam.title,
            studentId: user.id,
            studentName: user.name,
            class: user.class,
            no: user.no,
            answers: ans,
            score: correct,
            total: qs.length,
            timeout: true,
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(async () => {
            const sv = await saveExamScoreToStudentScores(exam, user.id, user.name, user.class, user.no, correct);
            if (sv !== null) setSavedScore(sv);
            /* อัปเดต savedScore ใน examResults */
            if (sv !== null) db.collection('examResults').where('examId', '==', exam.id).where('studentId', '==', user.id).get().then(s => {
              if (!s.empty) s.docs[0].ref.update({
                savedScore: sv
              });
            }).catch(() => {});
          }).catch(() => {});
          setExamState('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examState]);
  useEffect(() => {
    const onBlur = () => {
      if (examState === 'testing') alert('คำเตือน! ระบบตรวจพบการสลับหน้าจอ (Anti-Cheat) ระบบบันทึกรายงานส่งครูแล้ว');
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [examState]);
  const pickExam = async exam => {
    try {
      const snap = await db.collection('examResults').where('examId', '==', exam.id).where('studentId', '==', user.id).get();
      if (!snap.empty) {
        const prev = snap.docs[0].data();
        setSelExam(exam);
        setScore(prev.score);
        setSavedScore(prev.savedScore ?? null);
        setAlreadyDone(true);
        setExamState('done');
        return;
      }
    } catch {}
    setSelExam(exam);
    setExamState('ready');
  };
  const startExam = () => {
    answersRef.current = {};
    setAnswers({});
    setTimeLeft((Number(selExam.timeLimit) || 30) * 60);
    setExamState('testing');
  };
  const submitExam = async () => {
    clearInterval(timerRef.current);
    const qs = selExam?.questions || [];
    const correct = qs.filter((q, i) => answers[i] === q.answer).length;
    setScore(correct);
    try {
      const docRef = await db.collection('examResults').add({
        examId: selExam.id,
        examTitle: selExam.title,
        studentId: user.id,
        studentName: user.name,
        class: user.class,
        no: user.no,
        answers: answers,
        score: correct,
        total: qs.length,
        timeout: false,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const sv = await saveExamScoreToStudentScores(selExam, user.id, user.name, user.class, user.no, correct);
      if (sv !== null) {
        setSavedScore(sv);
        docRef.update({
          savedScore: sv
        }).catch(() => {});
      }
    } catch {}
    setExamState('done');
  };
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  if (examState === 'loading') return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 32,
    className: "text-red-600 block mx-auto mb-2"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A..."));
  if (examState === 'select') return /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto mt-10 space-y-6"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-desktop",
    className: "text-red-600",
    size: 22
  }), " \u0E41\u0E1A\u0E1A\u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C"), openExams.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-10 rounded-xl shadow text-center text-gray-500"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-lock",
    size: 40,
    className: "block mx-auto mb-4 text-gray-300"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-lg font-bold"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E41\u0E1A\u0E1A\u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm mt-1"
  }, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E2D\u0E04\u0E23\u0E39\u0E40\u0E1B\u0E34\u0E14\u0E41\u0E1A\u0E1A\u0E17\u0E14\u0E2A\u0E2D\u0E1A")) : openExams.map(exam => /*#__PURE__*/React.createElement("div", {
    key: exam.id,
    className: "bg-white p-6 rounded-xl shadow border-2 border-green-300"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold text-gray-800 mb-1"
  }, exam.title), exam.description && /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-sm mb-2"
  }, exam.description), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mb-4"
  }, exam.questions?.length || 0, " \u0E02\u0E49\u0E2D \xB7 ", exam.timeLimit, " \u0E19\u0E32\u0E17\u0E35"), /*#__PURE__*/React.createElement("button", {
    onClick: () => pickExam(exam),
    className: "bg-red-700 text-white font-bold py-2 px-8 rounded-lg hover:bg-red-800"
  }, "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 / \u0E40\u0E02\u0E49\u0E32\u0E2A\u0E2D\u0E1A"))));
  if (examState === 'ready') return /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto mt-10 bg-white p-8 rounded-xl shadow-md border-t-4 border-red-700 text-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-exclamation-circle",
    size: 48,
    className: "mx-auto text-red-600 mb-4 block"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold mb-1"
  }, selExam?.title), selExam?.description && /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-sm mb-3"
  }, selExam.description), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-600 mb-6"
  }, "\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A\u0E1B\u0E23\u0E19\u0E31\u0E22 ", selExam?.questions?.length || 0, " \u0E02\u0E49\u0E2D \xB7 \u0E40\u0E27\u0E25\u0E32 ", selExam?.timeLimit, " \u0E19\u0E32\u0E17\u0E35"), selExam?.targetCourseId && /*#__PURE__*/React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 text-left mb-4 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-info-circle",
    size: 13
  }), "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E08\u0E30\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E1B\u0E17\u0E35\u0E48 ", /*#__PURE__*/React.createElement("strong", null, selExam.targetCourseName), " \u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34"), /*#__PURE__*/React.createElement("div", {
    className: "bg-red-50 text-red-800 p-4 rounded text-left text-sm mb-6 space-y-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-bold"
  }, "\u0E01\u0E0E\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E2D\u0E1A:"), /*#__PURE__*/React.createElement("ul", {
    className: "list-disc pl-5 space-y-1"
  }, /*#__PURE__*/React.createElement("li", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E21\u0E35\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E01\u0E32\u0E23\u0E17\u0E38\u0E08\u0E23\u0E34\u0E15"), /*#__PURE__*/React.createElement("li", null, "\u0E2B\u0E49\u0E32\u0E21\u0E2A\u0E25\u0E31\u0E1A\u0E41\u0E17\u0E47\u0E1A \u0E22\u0E48\u0E2D\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E2D \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E42\u0E1B\u0E23\u0E41\u0E01\u0E23\u0E21\u0E2D\u0E37\u0E48\u0E19\u0E02\u0E13\u0E30\u0E2A\u0E2D\u0E1A"), /*#__PURE__*/React.createElement("li", null, "\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E30\u0E41\u0E08\u0E49\u0E07\u0E04\u0E23\u0E39\u0E17\u0E31\u0E19\u0E17\u0E35\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E1A"))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 justify-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExamState('select'),
    className: "px-6 py-3 bg-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-300"
  }, "\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A"), /*#__PURE__*/React.createElement("button", {
    onClick: startExam,
    className: "bg-red-700 text-white font-bold text-lg py-3 px-10 rounded-full shadow-lg hover:bg-red-800 hover:scale-105 transition-all"
  }, "\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E41\u0E25\u0E30\u0E40\u0E23\u0E34\u0E48\u0E21\u0E17\u0E33\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A")));
  if (examState === 'testing') {
    const questions = selExam?.questions || [];
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 bg-white z-50 flex flex-col"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-red-800 text-white p-4 flex justify-between items-center"
    }, /*#__PURE__*/React.createElement("h2", {
      className: "font-bold truncate mr-4"
    }, selExam?.title), /*#__PURE__*/React.createElement("div", {
      className: `text-xl font-black px-4 py-1 rounded font-mono flex-shrink-0 ${timeLeft < 300 ? 'bg-red-500 animate-pulse' : 'bg-black/30'}`
    }, fmt(timeLeft))), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full space-y-6"
    }, questions.map((q, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "bg-gray-50 p-6 rounded-lg border border-gray-200"
    }, /*#__PURE__*/React.createElement("div", {
      className: "font-bold mb-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-red-700 font-black mr-1"
    }, "\u0E02\u0E49\u0E2D ", i + 1, "."), q.text && /*#__PURE__*/React.createElement("span", null, q.text)), q.imageUrl && /*#__PURE__*/React.createElement("img", {
      src: q.imageUrl,
      alt: "",
      className: "max-h-48 object-contain rounded mb-4 bg-white border border-gray-200 mx-auto block"
    }), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, (q.choices || []).map((opt, ci) => {
      const txt = getChoiceText(opt);
      const img = getChoiceImg(opt);
      return /*#__PURE__*/React.createElement("label", {
        key: ci,
        className: `flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${answers[i] === ci ? 'bg-red-50 border-red-400' : 'hover:bg-gray-100 border-gray-200'}`
      }, /*#__PURE__*/React.createElement("input", {
        type: "radio",
        name: `q${i}`,
        checked: answers[i] === ci,
        onChange: () => {
          const next = {
            ...answersRef.current,
            [i]: ci
          };
          answersRef.current = next;
          setAnswers(next);
        },
        className: "w-4 h-4 text-red-600 flex-shrink-0"
      }), /*#__PURE__*/React.createElement("span", {
        className: "font-bold text-gray-600 flex-shrink-0"
      }, String.fromCharCode(65 + ci), "."), img ? /*#__PURE__*/React.createElement("img", {
        src: img,
        alt: "",
        className: "max-h-20 object-contain rounded border border-gray-100"
      }) : /*#__PURE__*/React.createElement("span", null, txt));
    })))), /*#__PURE__*/React.createElement("button", {
      onClick: submitExam,
      className: "w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 shadow"
    }, "\u0E2A\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E2A\u0E2D\u0E1A (", Object.keys(answers).length, "/", questions.length, " \u0E02\u0E49\u0E2D\u0E17\u0E35\u0E48\u0E15\u0E2D\u0E1A)")));
  }

  /* ── ส่งแล้ว ── */
  return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check",
    size: 48
  })), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-bold text-gray-800 mb-2"
  }, alreadyDone ? 'คุณส่งข้อสอบนี้ไปแล้ว' : 'ส่งข้อสอบเรียบร้อย!'), /*#__PURE__*/React.createElement("p", {
    className: "text-xl text-gray-600 mb-1"
  }, "\u0E15\u0E2D\u0E1A\u0E16\u0E39\u0E01 ", /*#__PURE__*/React.createElement("strong", {
    className: "text-red-600"
  }, score), " / ", selExam?.questions?.length || 0, " \u0E02\u0E49\u0E2D"), savedScore !== null && /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 mt-2 mb-3 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm text-blue-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check-circle",
    size: 14,
    className: "text-blue-600"
  }), "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E04\u0E30\u0E41\u0E19\u0E19 ", /*#__PURE__*/React.createElement("strong", null, savedScore), " \u0E44\u0E1B\u0E22\u0E31\u0E07 ", selExam?.targetCourseName, " \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-400 mb-6 block"
  }, "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A\u0E41\u0E25\u0E49\u0E27"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setAlreadyDone(false);
      setSavedScore(null);
      setExamState('select');
    },
    className: "text-blue-600 hover:underline"
  }, "\u0E01\u0E25\u0E31\u0E1A"));
};
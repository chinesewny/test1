// js/components/grading.jsx

// ── POSGrading — ให้คะแนน (POS Scan) ──
window.POSGrading = () => {
  const {
    useState,
    useEffect,
    useRef
  } = React;

  /* ── 3-step selection ── */
  const [allClasses, setAllClasses] = useState([]); // ห้องทั้งหมด
  const [selectedClass, setSelectedClass] = useState('');
  const [allCourses, setAllCourses] = useState([]); // วิชาทั้งหมด
  const [filteredCourses, setFilteredCourses] = useState([]); // วิชาที่มีห้องนี้
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [allAssignments, setAllAssignments] = useState([]); // งานทั้งหมด
  const [filteredAssigns, setFilteredAssigns] = useState([]); // งานในวิชานี้
  const [selectedAssign, setSelectedAssign] = useState(null); // {id,title,maxScore,...}

  /* ── grading ── */
  const [scanInput, setScanInput] = useState('');
  const [selectedScore, setSelectedScore] = useState(null);
  const [manualScore, setManualScore] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [currentScannedStudent, setCurrentScannedStudent] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── right panel ── */
  const [rightTab, setRightTab] = useState('roster'); // 'log' | 'roster'
  const [gradeLog, setGradeLog] = useState([]);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [gradedMap, setGradedMap] = useState({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const inputRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const maxScore = selectedAssign ? Number(selectedAssign.maxScore) : 10;

  /* ── Step 0: โหลดห้อง / วิชา / งาน ทั้งหมดครั้งเดียว ── */
  useEffect(() => {
    Promise.all([db.collection('students').get(), db.collection('courses').get(), db.collection('assignments').get()]).then(([sSnap, cSnap, aSnap]) => {
      const classes = [...new Set(sSnap.docs.map(d => d.data().class).filter(Boolean))].sort();
      setAllClasses(classes);
      if (classes.length === 1) setSelectedClass(classes[0]);
      const courseList = cSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
      setAllCourses(courseList);
      setAllAssignments(aSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
    }).catch(() => {});
  }, []);

  /* ── Step 1→2: เมื่อเลือกห้องแล้ว แสดงวิชาทั้งหมด ── */
  useEffect(() => {
    setSelectedCourseId('');
    setFilteredCourses([]);
    setFilteredAssigns([]);
    setSelectedAssign(null);
    if (!selectedClass) return;
    setFilteredCourses(allCourses);
    if (allCourses.length === 1) setSelectedCourseId(allCourses[0].id);
  }, [selectedClass, allCourses]);

  /* ── Step 2→3: กรองงานตามวิชา ── */
  useEffect(() => {
    setSelectedAssign(null);
    setFilteredAssigns([]);
    if (!selectedCourseId) return;
    const fa = allAssignments.filter(a => a.targetCourseId === selectedCourseId);
    setFilteredAssigns(fa);
    if (fa.length === 1) setSelectedAssign(fa[0]);
  }, [selectedCourseId, allAssignments]);

  /* ── คะแนนวันนี้ real-time ── */
  useEffect(() => {
    setGradeLog([]);
    if (!selectedAssign) return;
    inputRef.current?.focus();
    const unsub = db.collection('grades').where('date', '==', today).where('assignment', '==', selectedAssign.title).orderBy('timestamp', 'desc').onSnapshot(snap => setGradeLog(snap.docs.map(d => ({
      firestoreId: d.id,
      ...d.data()
    }))), () => {});
    return () => unsub();
  }, [selectedAssign]);

  /* ── โหลด roster นักเรียนในห้อง + ประวัติคะแนนงานนี้ ── */
  useEffect(() => {
    setRosterStudents([]);
    setGradedMap({});
    if (!selectedClass || !selectedAssign) return;
    setRosterLoading(true);
    Promise.all([db.collection('students').where('class', '==', selectedClass).get(), db.collection('grades').where('assignment', '==', selectedAssign.title).where('class', '==', selectedClass).get()]).then(([sSnap, gSnap]) => {
      const list = sSnap.docs.map(d => d.data()).sort((a, b) => (Number(a.no) || 0) - (Number(b.no) || 0));
      setRosterStudents(list);
      const map = {};
      gSnap.docs.forEach(d => {
        const g = d.data();
        if (!map[g.studentId] || (g.timestamp?.seconds || 0) > (map[g.studentId].ts || 0)) map[g.studentId] = {
          score: g.score,
          ts: g.timestamp?.seconds || 0
        };
      });
      setGradedMap(map);
    }).catch(() => {}).finally(() => setRosterLoading(false));
  }, [selectedClass, selectedAssign]);

  /* อัปเดต gradedMap เมื่อสแกนใหม่ */
  useEffect(() => {
    if (!gradeLog.length) return;
    setGradedMap(prev => {
      const next = {
        ...prev
      };
      gradeLog.forEach(g => {
        if (!next[g.studentId] || (g.timestamp?.seconds || 0) >= (next[g.studentId].ts || 0)) next[g.studentId] = {
          score: g.score,
          ts: g.timestamp?.seconds || 0
        };
      });
      return next;
    });
  }, [gradeLog]);
  const handleScan = async e => {
    e.preventDefault();
    const rawInput = fixThaiKeyboard(scanInput.trim());
    if (!rawInput) return;
    if (!selectedAssign) {
      alert('กรุณาเลือกงานก่อน');
      setScanInput('');
      return;
    }
    let student = null;
    try {
      const doc = await db.collection('students').doc(rawInput).get();
      if (doc.exists) student = doc.data();
    } catch {
      alert('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      setScanInput('');
      return;
    }
    if (!student) {
      alert('ไม่พบรหัสนักเรียน');
      setScanInput('');
      return;
    }
    setCurrentScannedStudent(student);
    if (selectedScore !== null) recordGrade(student, selectedScore);else setShowManualModal(true);
    setScanInput('');
  };
  const recordGrade = async (student, score) => {
    const s = Number(score);
    if (s < 0 || s > maxScore) {
      alert(`คะแนนต้องอยู่ระหว่าง 0–${maxScore}`);
      return;
    }
    setSaving(true);
    try {
      await db.collection('grades').add({
        studentId: student.id,
        name: student.name,
        class: student.class,
        no: student.no,
        assignment: selectedAssign.title,
        score: s,
        maxScore,
        date: today,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch {
      alert('บันทึกไม่สำเร็จ');
    }
    setSaving(false);
    setShowManualModal(false);
    setManualScore('');
    setSelectedScore(null);
    inputRef.current?.focus();
  };
  const gradedCount = rosterStudents.filter(s => gradedMap[s.id]).length;
  const ungradedCount = rosterStudents.length - gradedCount;
  const ready = !!selectedAssign;

  /* ── Selector step indicator ── */
  const Step = ({
    num,
    label,
    done
  }) => /*#__PURE__*/React.createElement("div", {
    className: `flex items-center gap-1.5 text-xs font-bold ${done ? 'text-green-600' : 'text-gray-400'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`
  }, done ? /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check",
    size: 9
  }) : num), label);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4 max-w-5xl mx-auto"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-barcode",
    className: "text-red-700",
    size: 24
  }), " \u0E23\u0E30\u0E1A\u0E1A\u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19 (POS Scan)"), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl border border-gray-200 shadow-sm p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3 flex-wrap"
  }, /*#__PURE__*/React.createElement(Step, {
    num: "1",
    label: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07",
    done: !!selectedClass
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chevron-right",
    size: 10,
    className: "text-gray-300"
  }), /*#__PURE__*/React.createElement(Step, {
    num: "2",
    label: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E34\u0E0A\u0E32",
    done: !!selectedCourseId
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chevron-right",
    size: 10,
    className: "text-gray-300"
  }), /*#__PURE__*/React.createElement(Step, {
    num: "3",
    label: "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19",
    done: !!selectedAssign
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-gray-500 mb-1"
  }, "1. \u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("select", {
    value: selectedClass,
    onChange: e => setSelectedClass(e.target.value),
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07 \u2014"), allClasses.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-gray-500 mb-1"
  }, "2. \u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("select", {
    value: selectedCourseId,
    disabled: !selectedClass,
    onChange: e => setSelectedCourseId(e.target.value),
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white disabled:opacity-50"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E34\u0E0A\u0E32 \u2014"), filteredCourses.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.code ? `[${c.code}] ` : '', c.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-gray-500 mb-1"
  }, "3. \u0E0A\u0E34\u0E49\u0E19\u0E07\u0E32\u0E19"), /*#__PURE__*/React.createElement("select", {
    value: selectedAssign?.id || '',
    disabled: !selectedCourseId,
    onChange: e => setSelectedAssign(filteredAssigns.find(a => a.id === e.target.value) || null),
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white disabled:opacity-50"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E07\u0E32\u0E19 \u2014"), filteredAssigns.map(a => /*#__PURE__*/React.createElement("option", {
    key: a.id,
    value: a.id
  }, a.title, a.chapterLabel ? ` (${a.chapterLabel})` : ''))), selectedCourseId && filteredAssigns.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-orange-500 mt-1"
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E07\u0E32\u0E19\u0E43\u0E19\u0E27\u0E34\u0E0A\u0E32\u0E19\u0E35\u0E49"))), ready && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 flex items-center gap-2 flex-wrap text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full"
  }, selectedClass), /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chevron-right",
    size: 9,
    className: "text-gray-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full"
  }, filteredCourses.find(c => c.id === selectedCourseId)?.name), /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chevron-right",
    size: 9,
    className: "text-gray-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full"
  }, selectedAssign.title, " \xB7 \u0E40\u0E15\u0E47\u0E21 ", maxScore))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `md:col-span-1 bg-white p-5 rounded-xl shadow-sm border space-y-4 ${ready ? 'border-gray-200' : 'border-gray-100 opacity-60 pointer-events-none'}`
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-2"
  }, "1. \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E25\u0E47\u0E2D\u0E04\u0E04\u0E30\u0E41\u0E19\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, [10, 9, 8, 7, 5, null].map(score => /*#__PURE__*/React.createElement("button", {
    key: score ?? 'm',
    onClick: () => {
      setSelectedScore(score);
      inputRef.current?.focus();
    },
    className: `py-2 px-3 rounded-lg border text-sm font-bold flex-1 text-center transition-all ${selectedScore === score ? 'bg-yellow-500 text-white border-yellow-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`
  }, score === null ? 'พิมพ์เอง' : score)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-2"
  }, "2. \u0E2A\u0E41\u0E01\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleScan
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: scanInput,
    onChange: e => setScanInput(e.target.value),
    placeholder: ready ? 'สแกนรหัสนักเรียน...' : 'เลือกห้อง/วิชา/งานก่อน',
    className: "w-full p-4 border-2 border-yellow-400 rounded-lg bg-yellow-50 text-center text-xl font-bold focus:outline-none focus:border-yellow-600"
  })), saving && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-center mt-2 text-blue-500 flex items-center justify-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 12
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01..."))), /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col",
    style: {
      height: '480px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex border-b border-gray-200 bg-gray-50"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setRightTab('roster'),
    className: `flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${rightTab === 'roster' ? 'bg-white text-red-700 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-users",
    size: 13
  }), " \u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19", rosterStudents.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: `text-xs font-bold rounded-full px-1.5 py-0.5 leading-none ${ungradedCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`
  }, gradedCount, "/", rosterStudents.length)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setRightTab('log'),
    className: `flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${rightTab === 'log' ? 'bg-white text-red-700 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-fire",
    size: 13,
    className: "text-orange-500"
  }), " \u0E04\u0E30\u0E41\u0E19\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", gradeLog.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-orange-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none"
  }, gradeLog.length))), rightTab === 'roster' && /*#__PURE__*/React.createElement(React.Fragment, null, ready && rosterStudents.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2.5 border-b border-gray-100 flex gap-2 text-xs bg-gray-50/50"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check-circle",
    size: 10
  }), " \u0E43\u0E2B\u0E49\u0E41\u0E25\u0E49\u0E27 ", gradedCount), /*#__PURE__*/React.createElement("span", {
    className: "bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times-circle",
    size: 10
  }), " \u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49 ", ungradedCount)), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-3 space-y-1"
  }, !ready ? /*#__PURE__*/React.createElement("div", {
    className: "h-full flex flex-col items-center justify-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-hand-point-up",
    size: 36,
    className: "mb-3 opacity-40"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07 \u2192 \u0E27\u0E34\u0E0A\u0E32 \u2192 \u0E07\u0E32\u0E19 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19")) : rosterLoading ? /*#__PURE__*/React.createElement("div", {
    className: "h-full flex items-center justify-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 22,
    className: "mr-2"
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...") : rosterStudents.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "h-full flex flex-col items-center justify-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-users",
    size: 36,
    className: "mb-2 opacity-40"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E19\u0E2B\u0E49\u0E2D\u0E07 ", selectedClass)) : rosterStudents.map(s => {
    const graded = gradedMap[s.id];
    return /*#__PURE__*/React.createElement("div", {
      key: s.id,
      className: `flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-colors
                                                ${graded ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                                                ${graded ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`
    }, graded ? /*#__PURE__*/React.createElement(Icon, {
      name: "fa-check",
      size: 10
    }) : s.no), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 min-w-0"
    }, /*#__PURE__*/React.createElement("p", {
      className: `font-medium truncate ${graded ? 'text-green-800' : 'text-gray-700'}`
    }, s.name), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-gray-400"
    }, s.id)), /*#__PURE__*/React.createElement("div", {
      className: "flex-shrink-0"
    }, graded ? /*#__PURE__*/React.createElement("span", {
      className: "font-black text-green-600 text-base"
    }, graded.score, /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-normal text-gray-400"
    }, "/", maxScore)) : /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-gray-400"
    }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49")));
  }))), rightTab === 'log' && /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-4 space-y-2"
  }, gradeLog.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "h-full flex flex-col items-center justify-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-barcode",
    size: 40,
    className: "mb-3 opacity-50"
  }), /*#__PURE__*/React.createElement("p", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49")) : gradeLog.map((log, i) => /*#__PURE__*/React.createElement("div", {
    key: log.firestoreId || i,
    className: "p-3 rounded border border-gray-100 flex items-center justify-between bg-white shadow-sm animate-fade-in-down"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center font-bold text-xs"
  }, log.no), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-sm"
  }, log.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400"
  }, log.class))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-black text-green-600"
  }, log.score), /*#__PURE__*/React.createElement("span", {
    className: "text-gray-400 text-sm"
  }, "/", log.maxScore || maxScore))))))), showManualModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold mb-2"
  }, currentScannedStudent?.name), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 mb-1 text-sm"
  }, currentScannedStudent?.class), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 mb-6"
  }, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E04\u0E30\u0E41\u0E19\u0E19 (\u0E40\u0E15\u0E47\u0E21 ", maxScore, ")"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    max: maxScore,
    autoFocus: true,
    className: "w-full text-center text-4xl font-bold p-4 border-b-4 border-red-500 outline-none mb-6 bg-gray-50",
    value: manualScore,
    onChange: e => setManualScore(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') recordGrade(currentScannedStudent, manualScore);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowManualModal(false),
    className: "flex-1 py-3 bg-gray-200 text-gray-700 rounded font-bold"
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("button", {
    onClick: () => recordGrade(currentScannedStudent, manualScore),
    className: "flex-1 py-3 bg-red-700 text-white rounded font-bold"
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")))));
};

// ── GradeManager — จัดการคะแนนทั้งหมด ──
window.GradeManager = () => {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const [courses, setCourses] = useState([]);
  const [selCourse, setSelCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({}); // {studentId: {_docId, ...fields}}
  const [gradeAverages, setGradeAverages] = useState({}); // {studentId: {label: {score, count}}}
  const [filterClass, setFilterClass] = useState('ทั้งหมด');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editCell, setEditCell] = useState(null); // {studentId, field}
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState('table');
  const editRef = useRef(null);
  const savingRef = useRef(false);

  /* โหลดรายวิชา */
  useEffect(() => {
    db.collection('courses').orderBy('name').get().then(snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setCourses(list);
      if (list.length > 0) setSelCourse(list[0]);
    }).catch(() => {}).finally(() => setLoadingCourses(false));
  }, []);

  /* โหลดนักเรียนในรายวิชา */
  useEffect(() => {
    if (!selCourse) return;
    setLoadingStudents(true);
    setFilterClass('ทั้งหมด');
    const rooms = selCourse.classrooms || [];
    const load = rooms.length > 0 ? (() => {
      const chunks = [];
      for (let i = 0; i < rooms.length; i += 10) chunks.push(rooms.slice(i, i + 10));
      return Promise.all(chunks.map(ch => db.collection('students').where('class', 'in', ch).get())).then(snaps => {
        const list = [];
        snaps.forEach(snap => snap.docs.forEach(d => list.push(d.data())));
        return list;
      });
    })() : db.collection('students').get().then(s => s.docs.map(d => d.data()));
    load.then(list => {
      list.sort((a, b) => {
        const cc = (a.class || '').localeCompare(b.class || '');
        return cc !== 0 ? cc : (Number(a.no) || 0) - (Number(b.no) || 0);
      });
      setStudents(list);
    }).catch(() => setStudents([])).finally(() => setLoadingStudents(false));
  }, [selCourse?.id]);

  /* โหลดค่าเฉลี่ยจากงานที่ผูกกับ continuousItem ของรายวิชานี้ */
  useEffect(() => {
    if (!selCourse || students.length === 0) {
      setGradeAverages({});
      return;
    }
    const items = getItems(selCourse);
    const studentIds = new Set(students.map(s => s.id));

    /* 1. โหลด assignments ที่ผูกกับ course นี้ */
    db.collection('assignments').where('targetCourseId', '==', selCourse.id).get().then(aSnap => {
      const allAssign = aSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      if (allAssign.length === 0) {
        setGradeAverages({});
        return;
      }

      /* 2. แมป chapterLabel → [assignmentTitle] */
      const byChapter = {}; // {chapterLabel: [{title, maxScore}]}
      allAssign.forEach(a => {
        if (!a.chapterLabel) return;
        if (!byChapter[a.chapterLabel]) byChapter[a.chapterLabel] = [];
        byChapter[a.chapterLabel].push({
          title: a.title,
          maxScore: Number(a.maxScore) || 10
        });
      });
      const allTitles = allAssign.map(a => a.title);
      if (allTitles.length === 0) {
        setGradeAverages({});
        return;
      }

      /* 3. โหลด grades ของงานเหล่านี้ (chunk ทีละ 10) */
      const chunks = [];
      for (let i = 0; i < allTitles.length; i += 10) chunks.push(allTitles.slice(i, i + 10));
      return Promise.all(chunks.map(ch => db.collection('grades').where('assignment', 'in', ch).get())).then(snaps => {
        /* 4. จัดกลุ่มคะแนนต่อ studentId+assignmentTitle */
        const gradeMap = {}; // {studentId: {title: [scores]}}
        snaps.forEach(snap => snap.docs.forEach(d => {
          const g = d.data();
          if (!studentIds.has(g.studentId)) return;
          if (!gradeMap[g.studentId]) gradeMap[g.studentId] = {};
          if (!gradeMap[g.studentId][g.assignment]) gradeMap[g.studentId][g.assignment] = [];
          gradeMap[g.studentId][g.assignment].push(Number(g.score));
        }));

        /* 5. คำนวณค่าเฉลี่ยต่อ student ต่อ chapter
              สูตร: เฉลี่ยคะแนนทุกชิ้นในบท → cap ที่ item.score */
        const result = {};
        students.forEach(s => {
          items.forEach(item => {
            const assignsInChapter = byChapter[item.label];
            if (!assignsInChapter || assignsInChapter.length === 0) return;

            /* เก็บคะแนนทุกครั้งของทุกชิ้นงานในบทนี้ */
            const allScores = [];
            assignsInChapter.forEach(a => {
              const sc = gradeMap[s.id]?.[a.title];
              if (sc) allScores.push(...sc);
            });
            if (allScores.length === 0) return;
            const avg = allScores.reduce((sum, v) => sum + v, 0) / allScores.length;
            const capped = Math.round(Math.min(avg, Number(item.score)) * 10) / 10;
            if (!result[s.id]) result[s.id] = {};
            result[s.id][item.label] = {
              score: capped,
              count: allScores.length,
              assigns: assignsInChapter.length
            };
          });
        });
        setGradeAverages(result);
      });
    }).catch(() => {});
  }, [selCourse?.id, students]);

  /* โหลดคะแนน real-time */
  useEffect(() => {
    if (!selCourse) return;
    const unsub = db.collection('studentScores').where('courseId', '==', selCourse.id).onSnapshot(snap => {
      const map = {};
      snap.docs.forEach(d => {
        map[d.data().studentId] = {
          _docId: d.id,
          ...d.data()
        };
      });
      setScores(map);
    }, () => {});
    return () => unsub();
  }, [selCourse?.id]);

  /* โฟกัส input เมื่อเปิด edit */
  useEffect(() => {
    if (editCell) setTimeout(() => editRef.current?.focus(), 30);
  }, [editCell]);

  /* helpers */
  const getItems = c => c?.continuousItems?.length > 0 ? c.continuousItems : [{
    label: 'คะแนนเก็บ',
    score: Number(c?.continuous) || 50
  }];

  /* คืนค่าคะแนนที่ใช้จริง: ถ้ามี POS-average ให้ใช้แทน manual */
  const effectiveCont = (studentId, label) => {
    const auto = gradeAverages[studentId]?.[label];
    if (auto) return auto.score;
    return scores[studentId]?.[`cont_${label}`] ?? null;
  };
  const calcTotal = (sd, c, studentId) => {
    if (!c) return 0;
    const items = getItems(c);
    const contSum = items.reduce((s, it) => {
      const v = studentId ? effectiveCont(studentId, it.label) : sd?.[`cont_${it.label}`];
      return s + Number(v || 0);
    }, 0);
    const mid = Number(sd?.midterm || 0);
    const midR = Number(sd?.midtermRetake || 0);
    const fin = Number(sd?.final || 0);
    return Math.round((contSum + Math.max(mid, midR) + fin) * 10) / 10;
  };
  const calcGrade = total => {
    if (total >= 80) return {
      gpa: '4.0',
      letter: 'A',
      tw: 'bg-green-100 text-green-800'
    };
    if (total >= 75) return {
      gpa: '3.5',
      letter: 'B+',
      tw: 'bg-green-50 text-green-700'
    };
    if (total >= 70) return {
      gpa: '3.0',
      letter: 'B',
      tw: 'bg-blue-50 text-blue-700'
    };
    if (total >= 65) return {
      gpa: '2.5',
      letter: 'C+',
      tw: 'bg-blue-50 text-blue-600'
    };
    if (total >= 60) return {
      gpa: '2.0',
      letter: 'C',
      tw: 'bg-yellow-50 text-yellow-700'
    };
    if (total >= 55) return {
      gpa: '1.5',
      letter: 'D+',
      tw: 'bg-orange-50 text-orange-600'
    };
    if (total >= 50) return {
      gpa: '1.0',
      letter: 'D',
      tw: 'bg-orange-100 text-orange-700'
    };
    return {
      gpa: '0.0',
      letter: 'F',
      tw: 'bg-red-100 text-red-700'
    };
  };
  const scoreColor = (val, max) => {
    if (val === undefined || val === null || val === '') return 'text-gray-300';
    const pct = Number(val) / Number(max);
    if (pct >= 0.8) return 'text-green-700 font-bold';
    if (pct >= 0.6) return 'text-blue-600 font-bold';
    if (pct >= 0.5) return 'text-yellow-600 font-bold';
    return 'text-red-500 font-bold';
  };
  const openEdit = (studentId, field, curVal) => {
    setEditCell({
      studentId,
      field
    });
    setEditVal(curVal !== undefined && curVal !== null ? String(curVal) : '');
  };
  const commitSave = async student => {
    if (!editCell || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const docId = `${student.id}_${selCourse.id}`;
    const existing = scores[student.id];
    const val = editVal === '' ? 0 : Number(editVal);
    try {
      const data = {
        studentId: student.id,
        studentName: student.name,
        class: student.class,
        no: student.no,
        courseId: selCourse.id,
        courseName: selCourse.name,
        [editCell.field]: val,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const ref = existing ? db.collection('studentScores').doc(existing._docId) : db.collection('studentScores').doc(docId);
      await ref.set(data, {
        merge: true
      });
    } catch {
      alert('บันทึกไม่สำเร็จ');
    }
    setSaving(false);
    savingRef.current = false;
    setEditCell(null);
  };
  const cancelEdit = () => setEditCell(null);

  /* Export CSV */
  const exportCSV = () => {
    if (!selCourse) return;
    const items = getItems(selCourse);
    const midMax = Number(selCourse.midterm || 20);
    const finMax = Number(selCourse.final || 30);
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`; // ครอบ text ป้องกัน comma
    const bom = '\uFEFF';
    const header = ['เลขที่', 'รหัส', q('ชื่อ-สกุล'), q('ห้อง'), ...items.map(it => q(`${it.label}(${it.score})`)), q(`รวมเก็บ(${Number(selCourse.continuous || 50)})`), q(`กลางภาค(${midMax})`), q(`แก้กลางภาค(${midMax})`), q(`ปลายภาค(${finMax})`), 'รวม(100)', q('เกรด'), 'GPA'].join(',');
    const rows = filteredStudents.map(s => {
      const sd = scores[s.id] || {};
      const total = calcTotal(sd, selCourse, s.id);
      const grade = calcGrade(total);
      const contSum = items.reduce((sum, it) => sum + Number(effectiveCont(s.id, it.label) || 0), 0);
      return [s.no, s.id, q(s.name), q(s.class), ...items.map(it => effectiveCont(s.id, it.label) ?? ''), contSum, sd.midterm ?? '', sd.midtermRetake ?? '', sd.final ?? '', total || '', grade.letter, grade.gpa].join(',');
    }).join('\n');
    const blob = new Blob([bom + header + '\n' + rows], {
      type: 'text/csv;charset=utf-8;'
    });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: `คะแนน_${selCourse.name}_${filterClass}_${new Date().toISOString().split('T')[0]}.csv`
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* Derived */
  const items = getItems(selCourse);
  const midMax = Number(selCourse?.midterm || 20);
  const finMax = Number(selCourse?.final || 30);
  const contMax = Number(selCourse?.continuous || 50);
  const classList = ['ทั้งหมด', ...new Set(students.map(s => s.class).filter(Boolean))].sort();
  const filteredStudents = filterClass === 'ทั้งหมด' ? students : students.filter(s => s.class === filterClass);

  /* สรุปรายห้อง */
  const classSummary = classList.filter(c => c !== 'ทั้งหมด').map(cls => {
    const ss = students.filter(s => s.class === cls);
    const totals = ss.map(s => calcTotal(scores[s.id] || {}, selCourse, s.id));
    const filled = totals.filter(t => t > 0);
    const avg = filled.length ? (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1) : '-';
    const dist = {};
    totals.forEach(t => {
      const g = calcGrade(t).letter;
      dist[g] = (dist[g] || 0) + 1;
    });
    return {
      cls,
      total: ss.length,
      filled: filled.length,
      avg,
      dist
    };
  });
  const statCards = [{
    label: 'นักเรียนทั้งหมด',
    value: filteredStudents.length,
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  }, {
    label: 'กรอกข้อมูลแล้ว',
    value: filteredStudents.filter(s => scores[s.id] || gradeAverages[s.id]).length,
    color: 'text-green-600',
    bg: 'bg-green-50'
  }, {
    label: 'คะแนนเฉลี่ย',
    value: (() => {
      const ts = filteredStudents.map(s => calcTotal(scores[s.id] || {}, selCourse, s.id)).filter(t => t > 0);
      return ts.length ? (ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(1) : '-';
    })(),
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  }, {
    label: 'ผ่าน (≥50%)',
    value: filteredStudents.filter(s => calcTotal(scores[s.id] || {}, selCourse, s.id) >= 50).length,
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  }];

  /* ── Cell helper ── */
  const renderScoreCell = (student, field, maxVal) => {
    const sd = scores[student.id] || {};
    const curVal = sd[field];
    const isEdit = editCell?.studentId === student.id && editCell?.field === field;

    /* ตรวจสอบ POS auto-average */
    const label = field.startsWith('cont_') ? field.slice(5) : null;
    const auto = label ? gradeAverages[student.id]?.[label] : null;
    if (isEdit) return /*#__PURE__*/React.createElement("td", {
      key: `${student.id}_${field}`,
      className: "px-2 py-1 text-center bg-yellow-50"
    }, /*#__PURE__*/React.createElement("input", {
      ref: editRef,
      type: "number",
      min: 0,
      max: maxVal,
      className: "w-16 text-center border-b-2 border-yellow-500 outline-none bg-transparent font-bold text-sm",
      value: editVal,
      onChange: e => setEditVal(e.target.value),
      onKeyDown: e => {
        if (e.key === 'Enter') commitSave(student);
        if (e.key === 'Escape') cancelEdit();
      },
      onBlur: () => commitSave(student)
    }));

    /* มีค่าคำนวณอัตโนมัติจากงานที่ผูกไว้ */
    if (auto && curVal === undefined) return /*#__PURE__*/React.createElement("td", {
      key: `${student.id}_${field}`,
      className: "px-2 py-2 text-center bg-blue-50/40 cursor-pointer hover:bg-yellow-50 transition-colors",
      onClick: () => openEdit(student.id, field, auto.score),
      title: `เฉลี่ยจาก ${auto.count} คะแนน (${auto.assigns} ชิ้นงาน) • คลิกเพื่อแก้ไขเอง`
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-sm ${scoreColor(auto.score, maxVal)}`
    }, auto.score), /*#__PURE__*/React.createElement("span", {
      className: "block text-[10px] text-blue-400 leading-none mt-0.5"
    }, auto.assigns, "\u0E0A\u0E34\u0E49\u0E19/", auto.count, "\u0E04\u0E23\u0E31\u0E49\u0E07"));
    return /*#__PURE__*/React.createElement("td", {
      key: `${student.id}_${field}`,
      className: "px-2 py-2 text-center cursor-pointer hover:bg-yellow-50 transition-colors group",
      onClick: () => openEdit(student.id, field, curVal),
      title: `คลิกเพื่อแก้ไข (เต็ม ${maxVal})`
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-sm ${scoreColor(curVal, maxVal)}`
    }, curVal !== undefined && curVal !== null ? curVal : /*#__PURE__*/React.createElement("span", {
      className: "text-gray-200 group-hover:text-gray-400"
    }, "-")));
  };

  /* ── Render ── */
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chart-bar",
    className: "text-red-700",
    size: 24
  }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E30\u0E41\u0E19\u0E19"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mt-1"
  }, "\u0E04\u0E25\u0E34\u0E01\u0E17\u0E35\u0E48\u0E0A\u0E48\u0E2D\u0E07\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E41\u0E01\u0E49\u0E44\u0E02 \u2022 Enter \u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E25\u0E34\u0E01\u0E2D\u0E2D\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 \u2022 Esc \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, saving && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-blue-500 flex items-center gap-1 animate-pulse"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 12
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01..."), /*#__PURE__*/React.createElement("button", {
    onClick: exportCSV,
    disabled: !selCourse || filteredStudents.length === 0,
    className: "flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-40 text-sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-download",
    size: 14
  }), " Export CSV"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-[200px]"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-gray-500 mb-1.5"
  }, "\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), loadingCourses ? /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-400"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14...") : courses.length === 0 ? /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-orange-500"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32 \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32\u0E01\u0E48\u0E2D\u0E19") : /*#__PURE__*/React.createElement("select", {
    className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300",
    onChange: e => setSelCourse(courses.find(c => c.id === e.target.value) || null)
  }, courses.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.code ? `[${c.code}] ` : '', c.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-gray-500 mb-1.5"
  }, "\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("select", {
    className: "px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-300",
    value: filterClass,
    onChange: e => setFilterClass(e.target.value)
  }, classList.map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), selCourse && /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 text-xs"
  }, [{
    label: 'คะแนนเก็บ',
    val: contMax,
    color: 'bg-blue-100 text-blue-700'
  }, {
    label: 'กลางภาค',
    val: midMax,
    color: 'bg-yellow-100 text-yellow-700'
  }, {
    label: 'ปลายภาค',
    val: finMax,
    color: 'bg-red-100 text-red-700'
  }].map(b => /*#__PURE__*/React.createElement("span", {
    key: b.label,
    className: `px-2 py-1 rounded-full font-bold ${b.color}`
  }, b.label, ": ", b.val)))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3"
  }, statCards.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `${s.bg} p-3 rounded-xl text-center`
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-0.5"
  }, s.label), /*#__PURE__*/React.createElement("p", {
    className: `text-2xl font-black ${s.color}`
  }, s.value)))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 bg-gray-100 p-1 rounded-lg w-fit"
  }, [['table', 'fa-table', 'ตารางคะแนน'], ['summary', 'fa-chart-pie', 'สรุปรายห้อง']].map(([v, ic, lb]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setActiveView(v),
    className: `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeView === v ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 13
  }), lb))), activeView === 'table' && (loadingStudents ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 32,
    className: "block mx-auto mb-2"
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25...") : filteredStudents.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-users",
    size: 40,
    className: "block mx-auto mb-3 opacity-40"
  }), /*#__PURE__*/React.createElement("p", null, selCourse?.classrooms?.length === 0 ? 'รายวิชานี้ยังไม่ได้ผูกห้องเรียน — ไปที่ "จัดการรายวิชา" เพื่อเพิ่มห้องเรียน' : 'ไม่พบนักเรียน')) : /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-red-800 text-white text-xs"
  }, /*#__PURE__*/React.createElement("th", {
    colSpan: 4,
    className: "px-3 py-2 text-left border-r border-red-700"
  }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
    colSpan: items.length + 1,
    className: "px-3 py-2 text-center border-r border-red-700 bg-blue-700"
  }, "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E01\u0E47\u0E1A (\u0E40\u0E15\u0E47\u0E21 ", contMax, ")"), /*#__PURE__*/React.createElement("th", {
    colSpan: 2,
    className: "px-3 py-2 text-center border-r border-red-700 bg-yellow-600"
  }, "\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04 (\u0E40\u0E15\u0E47\u0E21 ", midMax, ")"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-red-700 bg-red-600"
  }, "\u0E1B\u0E25\u0E32\u0E22\u0E20\u0E32\u0E04", /*#__PURE__*/React.createElement("br", null), "(\u0E40\u0E15\u0E47\u0E21 ", finMax, ")"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-red-700 bg-gray-700"
  }, "\u0E23\u0E27\u0E21", /*#__PURE__*/React.createElement("br", null), "(100)"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center bg-purple-700"
  }, "\u0E40\u0E01\u0E23\u0E14")), /*#__PURE__*/React.createElement("tr", {
    className: "bg-gray-100 text-gray-700 text-xs font-bold border-b-2 border-gray-300"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center whitespace-nowrap"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left whitespace-nowrap"
  }, "\u0E23\u0E2B\u0E31\u0E2A"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-left whitespace-nowrap min-w-[120px]"
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap"
  }, "\u0E2B\u0E49\u0E2D\u0E07"), items.map(it => /*#__PURE__*/React.createElement("th", {
    key: it.label,
    className: "px-3 py-2 text-center whitespace-nowrap text-blue-700 bg-blue-50"
  }, it.label, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-blue-500"
  }, "(", it.score, ")"))), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap bg-blue-50 text-blue-800"
  }, "\u0E23\u0E27\u0E21\u0E40\u0E01\u0E47\u0E1A"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center whitespace-nowrap text-yellow-700 bg-yellow-50"
  }, "\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "font-normal"
  }, "(", midMax, ")")), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-yellow-700 bg-yellow-50"
  }, "\u0E41\u0E01\u0E49\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "font-normal text-xs"
  }, "(\u0E16\u0E49\u0E32\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E41\u0E17\u0E19)")), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-red-700 bg-red-50"
  }, "\u0E1B\u0E25\u0E32\u0E22\u0E20\u0E32\u0E04", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "font-normal"
  }, "(", finMax, ")")), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center border-r border-gray-300 whitespace-nowrap text-gray-800 bg-gray-100 font-black"
  }, "\u0E23\u0E27\u0E21"), /*#__PURE__*/React.createElement("th", {
    className: "px-3 py-2 text-center whitespace-nowrap text-purple-700 bg-purple-50"
  }, "\u0E40\u0E01\u0E23\u0E14 / GPA"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-gray-100"
  }, filteredStudents.map((s, idx) => {
    const sd = scores[s.id] || {};
    const contSum = items.reduce((sum, it) => sum + Number(effectiveCont(s.id, it.label) || 0), 0);
    const total = calcTotal(sd, selCourse, s.id);
    const grade = calcGrade(total);
    const hasData = Object.keys(sd).filter(k => k !== '_docId' && k !== 'studentId' && k !== 'courseId' && k !== 'updatedAt').length > 0 || !!gradeAverages[s.id];
    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
    const midUsed = Math.max(Number(sd.midterm || 0), Number(sd.midtermRetake || 0));
    return /*#__PURE__*/React.createElement("tr", {
      key: s.id,
      className: `${rowBg} hover:bg-yellow-50/30 transition-colors`
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center text-gray-500 text-xs"
    }, s.no), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 font-mono text-xs text-gray-500"
    }, s.id), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 font-medium text-gray-800 whitespace-nowrap"
    }, s.name), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-200"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded"
    }, s.class)), items.map(it => renderScoreCell(s, `cont_${it.label}`, Number(it.score))), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-200 bg-blue-50/50"
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-sm font-bold ${scoreColor(contSum, contMax)}`
    }, hasData ? contSum : /*#__PURE__*/React.createElement("span", {
      className: "text-gray-200"
    }, "-"))), renderScoreCell(s, 'midterm', midMax), (() => {
      const isEdit = editCell?.studentId === s.id && editCell?.field === 'midtermRetake';
      const retakeVal = sd.midtermRetake;
      if (isEdit) return /*#__PURE__*/React.createElement("td", {
        key: `${s.id}_midtermRetake`,
        className: "px-2 py-1 text-center bg-yellow-50 border-r border-gray-200"
      }, /*#__PURE__*/React.createElement("input", {
        ref: editRef,
        type: "number",
        min: 0,
        max: midMax,
        className: "w-16 text-center border-b-2 border-yellow-500 outline-none bg-transparent font-bold text-sm",
        value: editVal,
        onChange: e => setEditVal(e.target.value),
        onKeyDown: e => {
          if (e.key === 'Enter') commitSave(s);
          if (e.key === 'Escape') cancelEdit();
        },
        onBlur: () => commitSave(s)
      }));
      return /*#__PURE__*/React.createElement("td", {
        key: `${s.id}_midtermRetake`,
        className: "px-2 py-2 text-center cursor-pointer hover:bg-yellow-50 transition-colors group border-r border-gray-200",
        onClick: () => openEdit(s.id, 'midtermRetake', retakeVal),
        title: `คลิกเพื่อแก้ไข (เต็ม ${midMax})`
      }, /*#__PURE__*/React.createElement("span", {
        className: `text-sm ${scoreColor(retakeVal, midMax)}`
      }, retakeVal !== undefined ? /*#__PURE__*/React.createElement(React.Fragment, null, retakeVal, retakeVal > Number(sd.midterm || 0) && /*#__PURE__*/React.createElement("span", {
        className: "ml-1 text-green-500 text-xs"
      }, "\u2191")) : /*#__PURE__*/React.createElement("span", {
        className: "text-gray-200 group-hover:text-gray-400"
      }, "-")));
    })(), renderScoreCell(s, 'final', finMax), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-200 bg-gray-50"
    }, hasData ? /*#__PURE__*/React.createElement("span", {
      className: `text-base font-black ${scoreColor(total, 100)}`
    }, total) : /*#__PURE__*/React.createElement("span", {
      className: "text-gray-200"
    }, "-")), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center"
    }, hasData ? /*#__PURE__*/React.createElement("span", {
      className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${grade.tw}`
    }, grade.letter, " ", /*#__PURE__*/React.createElement("span", {
      className: "opacity-70"
    }, "(", grade.gpa, ")")) : /*#__PURE__*/React.createElement("span", {
      className: "text-gray-200"
    }, "-")));
  })), filteredStudents.length > 0 && (() => {
    const validTotals = filteredStudents.map(s => calcTotal(scores[s.id] || {}, selCourse, s.id)).filter(t => t > 0);
    const avg = validTotals.length ? (validTotals.reduce((a, b) => a + b, 0) / validTotals.length).toFixed(1) : '-';
    return /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
      className: "bg-gray-100 font-bold text-xs text-gray-600 border-t-2 border-gray-300"
    }, /*#__PURE__*/React.createElement("td", {
      colSpan: 4,
      className: "px-3 py-2 border-r border-gray-300"
    }, "\u0E23\u0E27\u0E21 ", filteredStudents.length, " \u0E04\u0E19 / \u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27 ", validTotals.length, " \u0E04\u0E19"), items.map(it => {
      const vals = filteredStudents.map(s => effectiveCont(s.id, it.label)).filter(v => v !== null && v !== undefined);
      const a = vals.length ? (vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(1) : '-';
      return /*#__PURE__*/React.createElement("td", {
        key: it.label,
        className: "px-3 py-2 text-center text-blue-700"
      }, "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 ", a);
    }), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-300 text-blue-700"
    }, "-"), /*#__PURE__*/React.createElement("td", {
      colSpan: 2,
      className: "px-3 py-2 text-center text-yellow-700"
    }, "-"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-300 text-red-700"
    }, "-"), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center border-r border-gray-300 text-gray-800"
    }, "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22 ", avg), /*#__PURE__*/React.createElement("td", {
      className: "px-3 py-2 text-center text-purple-700"
    }, avg !== '-' ? calcGrade(Number(avg)).letter : '-')));
  })())))), activeView === 'summary' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, classSummary.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200"
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19") : classSummary.map(cs => {
    const gradeOrder = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];
    return /*#__PURE__*/React.createElement("div", {
      key: cs.cls,
      className: "bg-white p-5 rounded-xl border border-gray-200 shadow-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between mb-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-lg font-black text-red-700"
    }, cs.cls), /*#__PURE__*/React.createElement("span", {
      className: "text-sm text-gray-500"
    }, cs.filled, "/", cs.total, " \u0E04\u0E19 (\u0E01\u0E23\u0E2D\u0E01\u0E41\u0E25\u0E49\u0E27)")), /*#__PURE__*/React.createElement("div", {
      className: "text-right"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-gray-400"
    }, "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22"), /*#__PURE__*/React.createElement("p", {
      className: `text-2xl font-black ${cs.avg !== '-' ? scoreColor(Number(cs.avg), 100) : 'text-gray-300'}`
    }, cs.avg))), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-4 sm:grid-cols-8 gap-2"
    }, gradeOrder.map(g => {
      const count = cs.dist[g] || 0;
      const grade = calcGrade(g === 'A' ? 80 : g === 'B+' ? 75 : g === 'B' ? 70 : g === 'C+' ? 65 : g === 'C' ? 60 : g === 'D+' ? 55 : g === 'D' ? 50 : 0);
      return /*#__PURE__*/React.createElement("div", {
        key: g,
        className: `p-3 rounded-xl text-center border ${count > 0 ? `${grade.tw} border-current/20` : 'bg-gray-50 text-gray-300 border-gray-100'}`
      }, /*#__PURE__*/React.createElement("p", {
        className: "text-lg font-black"
      }, count), /*#__PURE__*/React.createElement("p", {
        className: "text-xs font-bold"
      }, g));
    })), cs.filled > 0 && /*#__PURE__*/React.createElement("div", {
      className: "mt-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex rounded-full overflow-hidden h-3 bg-gray-100"
    }, gradeOrder.filter(g => cs.dist[g]).map(g => {
      const pct = ((cs.dist[g] || 0) / cs.total * 100).toFixed(1);
      const grade = calcGrade(g === 'A' ? 80 : g === 'B+' ? 75 : g === 'B' ? 70 : g === 'C+' ? 65 : g === 'C' ? 60 : g === 'D+' ? 55 : g === 'D' ? 50 : 0);
      return /*#__PURE__*/React.createElement("div", {
        key: g,
        style: {
          width: `${pct}%`
        },
        className: `${grade.tw.split(' ')[0].replace('bg-', 'bg-').replace('50', '400').replace('100', '500')} transition-all`,
        title: `${g}: ${cs.dist[g]} คน`
      });
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2 mt-2"
    }, gradeOrder.filter(g => cs.dist[g]).map(g => /*#__PURE__*/React.createElement("span", {
      key: g,
      className: "text-xs text-gray-500"
    }, g, ": ", cs.dist[g], " \u0E04\u0E19 (", ((cs.dist[g] || 0) / cs.total * 100).toFixed(0), "%)")))));
  })));
};
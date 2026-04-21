// js/components/randomizer.jsx
window.RandomizerGame = () => {
  const {
    useState,
    useEffect,
    useRef
  } = React;
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [filterClass, setFilterClass] = useState('ทั้งหมด');
  const [loadingStudents, setLoadingStudents] = useState(true);
  const intervalRef = useRef(null);
  useEffect(() => {
    db.collection('students').orderBy('class').get().then(snap => {
      const list = snap.docs.map(d => d.data());
      setAllStudents(list);
      setAvailableStudents(list);
    }).catch(() => {}).finally(() => setLoadingStudents(false));
  }, []);
  const classList = ['ทั้งหมด', ...new Set(allStudents.map(s => s.class).filter(Boolean))].sort();
  const handleFilterClass = cls => {
    setFilterClass(cls);
    const base = cls === 'ทั้งหมด' ? allStudents : allStudents.filter(s => s.class === cls);
    setAvailableStudents(base);
    setSelectedStudent(null);
  };
  const resetList = () => {
    const base = filterClass === 'ทั้งหมด' ? allStudents : allStudents.filter(s => s.class === filterClass);
    setAvailableStudents(base);
    setSelectedStudent(null);
  };
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);
  const startRandom = () => {
    if (availableStudents.length === 0) {
      alert('รายชื่อหมดแล้ว! กรุณารีเซ็ต');
      return;
    }
    setIsSpinning(true);
    setSelectedStudent(null);
    let counter = 0;
    intervalRef.current = setInterval(() => {
      setSelectedStudent(availableStudents[Math.floor(Math.random() * availableStudents.length)]);
      counter++;
      if (counter >= 20) {
        clearInterval(intervalRef.current);
        setIsSpinning(false);
        const winner = availableStudents[Math.floor(Math.random() * availableStudents.length)];
        setSelectedStudent(winner);
        if (!allowRepeat) setAvailableStudents(prev => prev.filter(s => s.id !== winner.id));
      }
    }, 100);
  };
  if (loadingStudents) return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20 text-white bg-red-900 rounded-3xl"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 36,
    className: "mb-3 block mx-auto"
  }), /*#__PURE__*/React.createElement("p", null, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19..."));
  return /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col items-center justify-center min-h-[70vh] bg-gradient-to-b from-red-900 to-red-800 rounded-3xl p-8 shadow-2xl border-4 border-yellow-500 relative overflow-hidden"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-4xl font-black text-yellow-400 mb-4 flex items-center gap-4"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-gamepad",
    size: 40
  }), " \u0E2A\u0E38\u0E48\u0E21\u0E1C\u0E39\u0E49\u0E42\u0E0A\u0E04\u0E14\u0E35\u0E15\u0E2D\u0E1A\u0E04\u0E33\u0E16\u0E32\u0E21"), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-6 justify-center"
  }, classList.map(cls => /*#__PURE__*/React.createElement("button", {
    key: cls,
    onClick: () => handleFilterClass(cls),
    className: `px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterClass === cls ? 'bg-yellow-400 text-red-900' : 'bg-white/20 text-white hover:bg-white/30'}`
  }, cls))), allStudents.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-white/70 text-xl py-10"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E01\u0E48\u0E2D\u0E19") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "bg-white/10 backdrop-blur-md p-8 rounded-2xl w-full max-w-2xl text-center border border-white/20 shadow-xl mb-8 min-h-[200px] flex items-center justify-center"
  }, selectedStudent ? /*#__PURE__*/React.createElement("div", {
    className: `transition-all duration-300 ${isSpinning ? 'scale-90 opacity-70 blur-sm' : 'scale-110 opacity-100'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-2xl text-red-200 mb-2"
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", selectedStudent.no, " | ", selectedStudent.class), /*#__PURE__*/React.createElement("div", {
    className: "text-5xl font-black text-white drop-shadow-lg mb-4"
  }, selectedStudent.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xl text-yellow-300 bg-black/30 inline-block px-6 py-2 rounded-full"
  }, "\u0E23\u0E2B\u0E31\u0E2A: ", selectedStudent.id)) : /*#__PURE__*/React.createElement("div", {
    className: "text-3xl font-bold text-white/50"
  }, "\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21\u0E2A\u0E38\u0E48\u0E21\u0E40\u0E25\u0E22!")), /*#__PURE__*/React.createElement("button", {
    onClick: startRandom,
    disabled: isSpinning || availableStudents.length === 0,
    className: "bg-yellow-500 hover:bg-yellow-400 text-red-900 font-black text-2xl py-4 px-12 rounded-full shadow-[0_6px_0_#b45309] hover:shadow-[0_2px_0_#b45309] hover:translate-y-[4px] transition-all disabled:opacity-50 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-play"
  }), " ", isSpinning ? 'กำลังสุ่ม...' : 'สุ่มเลย!'), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 flex gap-6 text-white bg-black/20 p-4 rounded-xl flex-wrap justify-center"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: allowRepeat,
    onChange: e => setAllowRepeat(e.target.checked),
    className: "w-5 h-5 accent-yellow-500"
  }), /*#__PURE__*/React.createElement("span", null, "\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E43\u0E2B\u0E49\u0E2A\u0E38\u0E48\u0E21\u0E0B\u0E49\u0E33")), /*#__PURE__*/React.createElement("div", {
    className: "w-px bg-white/20"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: resetList,
    className: "text-yellow-300 hover:text-white underline"
  }, "\u0E23\u0E35\u0E40\u0E0B\u0E47\u0E15 (", availableStudents.length, "/", filterClass === 'ทั้งหมด' ? allStudents.length : allStudents.filter(s => s.class === filterClass).length, " \u0E04\u0E19)"))));
};
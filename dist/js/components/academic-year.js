// js/components/academic-year.jsx
window.AcademicYearManager = () => {
  const {
    useState,
    useEffect
  } = React;
  const [settings, setSettings] = useState({
    year: '2569',
    term: '1'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [newClassroom, setNewClassroom] = useState('');
  const [savingCls, setSavingCls] = useState(false);
  const [savedCls, setSavedCls] = useState(false);
  useEffect(() => {
    db.collection('settings').doc('academic').get().then(doc => {
      if (doc.exists) setSettings(doc.data());
    }).catch(() => {});
    db.collection('settings').doc('classrooms').get().then(doc => {
      if (doc.exists && doc.data().list) setClassrooms(doc.data().list);
    }).catch(() => {});
  }, []);
  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.collection('settings').doc('academic').set(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
    setSaving(false);
  };
  const addClassroom = () => {
    const val = newClassroom.trim();
    if (!val || classrooms.includes(val)) return;
    setClassrooms(prev => [...prev, val].sort());
    setNewClassroom('');
  };
  const removeClassroom = cls => setClassrooms(prev => prev.filter(c => c !== cls));
  const saveClassrooms = async () => {
    setSavingCls(true);
    try {
      await db.collection('settings').doc('classrooms').set({
        list: classrooms
      });
      setSavedCls(true);
      setTimeout(() => setSavedCls(false), 3000);
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
    setSavingCls(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-calendar-alt",
    className: "text-red-700",
    size: 24
  }), " \u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32 / \u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-8 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg mb-6 text-gray-700"
  }, "\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSave,
    className: "space-y-5"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32 (\u0E1E.\u0E28.)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    className: "w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-xl font-bold",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 2569",
    value: settings.year,
    onChange: e => setSettings(p => ({
      ...p,
      year: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-2"
  }, "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, ['1', '2'].map(t => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: t,
    onClick: () => setSettings(p => ({
      ...p,
      term: t
    })),
    className: `py-4 rounded-xl font-bold text-lg border-2 transition-all ${settings.term === t ? 'bg-red-700 text-white border-red-700 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`
  }, "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48 ", t)))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-exclamation-triangle",
    size: 14
  }), "\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E04\u0E48\u0E32\u0E19\u0E35\u0E49\u0E08\u0E30\u0E21\u0E35\u0E1C\u0E25\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E31\u0E48\u0E27\u0E17\u0E31\u0E49\u0E07\u0E23\u0E30\u0E1A\u0E1A"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: saving,
    className: "w-full py-3 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
  }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 16
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : saved ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check",
    size: 16
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27!") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-save",
    size: 16
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-gray-700 mb-4"
  }, "\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center p-6 bg-red-50 rounded-xl flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mb-1"
  }, "\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32"), /*#__PURE__*/React.createElement("p", {
    className: "text-4xl font-black text-red-700"
  }, settings.year)), /*#__PURE__*/React.createElement("div", {
    className: "text-center p-6 bg-gray-50 rounded-xl flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mb-1"
  }, "\u0E20\u0E32\u0E04\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("p", {
    className: "text-4xl font-black text-gray-700"
  }, settings.term)))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-8 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg mb-1 text-gray-700 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-door-open",
    size: 18,
    className: "text-red-700"
  }), " \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500 mb-6"
  }, "\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E44\u0E27\u0E49\u0E08\u0E30\u0E16\u0E39\u0E01\u0E43\u0E0A\u0E49\u0E43\u0E19\u0E17\u0E38\u0E01\u0E40\u0E21\u0E19\u0E39\u0E02\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E1A \u0E40\u0E0A\u0E48\u0E19 \u0E1A\u0E31\u0E15\u0E23\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19, \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19, \u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mb-4"
  }, /*#__PURE__*/React.createElement("input", {
    className: "flex-1 px-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-300 text-sm",
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E21.4/1, \u0E21.5/2, \u0E21.6/3 ...",
    value: newClassroom,
    onChange: e => setNewClassroom(e.target.value),
    onKeyDown: e => e.key === 'Enter' && (e.preventDefault(), addClassroom())
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: addClassroom,
    className: "px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg flex items-center gap-1.5 transition-colors"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 13
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21")), classrooms.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-door-closed",
    size: 28,
    className: "mb-2"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E43\u0E19\u0E23\u0E30\u0E1A\u0E1A")) : /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2 mb-4"
  }, classrooms.map(cls => /*#__PURE__*/React.createElement("span", {
    key: cls,
    className: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-800 text-sm font-semibold rounded-full border border-red-200"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-chalkboard",
    size: 11
  }), " ", cls, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => removeClassroom(cls),
    className: "ml-1 text-red-400 hover:text-red-700 transition-colors leading-none"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times",
    size: 11
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-4 border-t border-gray-100"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, classrooms.length, " \u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: saveClassrooms,
    disabled: savingCls,
    className: "px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
  }, savingCls ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 14
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : savedCls ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check",
    size: 14
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E49\u0E27!") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-save",
    size: 14
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19")))));
};
// js/components/timetable.jsx
window.TimetableManager = function TimetableManager() {
  const {
    useState,
    useEffect
  } = React;
  const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
  const emptyForm = {
    day: 'จันทร์',
    dayIndex: 1,
    period: 1,
    startTime: '08:00',
    endTime: '09:00',
    class: '',
    subject: ''
  };
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  useEffect(() => {
    const unsub = db.collection('timetable').orderBy('dayIndex').onSnapshot(snap => {
      setEntries(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);
  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = entry => {
    setForm({
      ...entry
    });
    setEditId(entry.id);
    setShowForm(true);
  };
  const save = async () => {
    if (!form.class.trim() || !form.subject.trim()) return alert('กรุณากรอกห้องและวิชา');
    setSaving(true);
    const data = {
      ...form,
      dayIndex: DAYS.indexOf(form.day) + 1
    };
    if (editId) await db.collection('timetable').doc(editId).update(data);else await db.collection('timetable').add(data);
    setSaving(false);
    setShowForm(false);
  };
  const remove = async id => {
    if (!window.confirm('ลบรายการนี้?')) return;
    await db.collection('timetable').doc(id).delete();
  };
  const cellFor = (day, period) => entries.filter(e => e.day === day && e.period === period);
  return /*#__PURE__*/React.createElement("div", {
    className: "p-6 max-w-6xl mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between mb-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800"
  }, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E2D\u0E19"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-sm"
  }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E2D\u0E19\u0E23\u0E32\u0E22\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C \u2014 \u0E25\u0E34\u0E07\u0E01\u0E4C\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E47\u0E04\u0E0A\u0E37\u0E48\u0E2D\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setViewMode(v => v === 'grid' ? 'list' : 'grid'),
    className: "flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: viewMode === 'grid' ? 'fa-list' : 'fa-table-cells',
    size: 14
  }), viewMode === 'grid' ? 'มุมมองรายการ' : 'มุมมองตาราง'), /*#__PURE__*/React.createElement("button", {
    onClick: openAdd,
    className: "flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 14
  }), " \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E32\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E19"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4 flex items-start gap-3 text-sm text-blue-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-circle-info",
    size: 16,
    className: "mt-0.5 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, "\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E1B\u0E38\u0E48\u0E21\u0E25\u0E31\u0E14 ", /*#__PURE__*/React.createElement("strong", null, "\uD83D\uDCC5"), " \u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E0A\u0E47\u0E04\u0E0A\u0E37\u0E48\u0E2D \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E44\u0E14\u0E49\u0E23\u0E27\u0E14\u0E40\u0E23\u0E47\u0E27\u0E15\u0E32\u0E21\u0E27\u0E31\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19")), loading ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 32
  })) : viewMode === 'grid' ? /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm border-collapse"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-red-700 text-white"
  }, /*#__PURE__*/React.createElement("th", {
    className: "border border-red-800 px-3 py-2 w-16"
  }, "\u0E04\u0E32\u0E1A"), DAYS.map(d => /*#__PURE__*/React.createElement("th", {
    key: d,
    className: "border border-red-800 px-3 py-2"
  }, d)))), /*#__PURE__*/React.createElement("tbody", null, PERIODS.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p,
    className: p % 2 === 0 ? 'bg-gray-50' : 'bg-white'
  }, /*#__PURE__*/React.createElement("td", {
    className: "border border-gray-200 px-3 py-2 text-center font-bold text-gray-500"
  }, p), DAYS.map(d => /*#__PURE__*/React.createElement("td", {
    key: d,
    className: "border border-gray-200 px-2 py-1 min-w-[120px] align-top"
  }, cellFor(d, p).map(e => /*#__PURE__*/React.createElement("div", {
    key: e.id,
    className: "bg-red-50 border border-red-200 rounded p-1 mb-1 group relative"
  }, /*#__PURE__*/React.createElement("p", {
    className: "font-semibold text-red-800 text-xs leading-tight"
  }, e.subject), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-xs"
  }, e.class), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-400 text-xs"
  }, e.startTime, "\u2013", e.endTime), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1 right-1 hidden group-hover:flex gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => openEdit(e),
    className: "bg-blue-500 text-white rounded p-0.5 hover:bg-blue-600"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-pen",
    size: 10
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => remove(e.id),
    className: "bg-red-500 text-white rounded p-0.5 hover:bg-red-600"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-trash",
    size: 10
  }))))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setForm({
        ...emptyForm,
        day: d,
        dayIndex: DAYS.indexOf(d) + 1,
        period: p
      });
      setEditId(null);
      setShowForm(true);
    },
    className: "text-gray-300 hover:text-red-500 text-xs w-full text-left pl-1"
  }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21")))))))) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, DAYS.map(d => {
    const dayEntries = entries.filter(e => e.day === d).sort((a, b) => a.period - b.period);
    if (dayEntries.length === 0) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: d
    }, /*#__PURE__*/React.createElement("h4", {
      className: "font-bold text-red-700 border-b border-red-200 pb-1 mb-2"
    }, d), dayEntries.map(e => /*#__PURE__*/React.createElement("div", {
      key: e.id,
      className: "flex items-center justify-between bg-white border rounded-lg px-4 py-2 mb-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-4"
    }, /*#__PURE__*/React.createElement("span", {
      className: "bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded"
    }, "\u0E04\u0E32\u0E1A ", e.period), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "font-semibold text-sm"
    }, e.subject, " ", /*#__PURE__*/React.createElement("span", {
      className: "text-gray-500 font-normal"
    }, "\u2014 ", e.class)), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-gray-400"
    }, e.startTime, " \u2013 ", e.endTime))), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openEdit(e),
      className: "text-blue-500 hover:text-blue-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-pen",
      size: 13
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => remove(e.id),
      className: "text-red-500 hover:text-red-700"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-trash",
      size: 13
    }))))));
  }), entries.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-gray-400 text-center py-10"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E2D\u0E19 \u2014 \u0E01\u0E14 \"+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E04\u0E32\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E19\" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19")), showForm && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-md"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-red-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg"
  }, editId ? 'แก้ไขคาบเรียน' : 'เพิ่มคาบเรียน'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowForm(false),
    className: "hover:opacity-75"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-xmark",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E27\u0E31\u0E19"), /*#__PURE__*/React.createElement("select", {
    value: form.day,
    onChange: e => setForm(f => ({
      ...f,
      day: e.target.value,
      dayIndex: DAYS.indexOf(e.target.value) + 1
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }, DAYS.map(d => /*#__PURE__*/React.createElement("option", {
    key: d,
    value: d
  }, d)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E04\u0E32\u0E1A\u0E17\u0E35\u0E48"), /*#__PURE__*/React.createElement("select", {
    value: form.period,
    onChange: e => setForm(f => ({
      ...f,
      period: Number(e.target.value)
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }, PERIODS.map(p => /*#__PURE__*/React.createElement("option", {
    key: p,
    value: p
  }, "\u0E04\u0E32\u0E1A ", p))))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E40\u0E27\u0E25\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: form.startTime,
    onChange: e => setForm(f => ({
      ...f,
      startTime: e.target.value
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14"), /*#__PURE__*/React.createElement("input", {
    type: "time",
    value: form.endTime,
    onChange: e => setForm(f => ({
      ...f,
      endTime: e.target.value
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("input", {
    value: form.class,
    onChange: e => setForm(f => ({
      ...f,
      class: e.target.value
    })),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E21.6/2",
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("input", {
    value: form.subject,
    onChange: e => setForm(f => ({
      ...f,
      subject: e.target.value
    })),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 5",
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowForm(false),
    className: "flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50"
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("button", {
    onClick: save,
    disabled: saving,
    className: "flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50"
  }, saving ? 'กำลังบันทึก...' : editId ? 'บันทึกการแก้ไข' : 'เพิ่มคาบเรียน'))))));
};
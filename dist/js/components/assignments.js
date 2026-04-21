// js/components/assignments.jsx
window.AssignmentReview = () => {
  const {
    useState,
    useEffect
  } = React;
  const emptyForm = {
    title: '',
    description: '',
    deadline: '',
    maxScore: 10,
    course: ''
  };
  const [tab, setTab] = useState('assign');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scoreInputs, setScoreInputs] = useState({});
  const [filterAssign, setFilterAssign] = useState('ทั้งหมด');
  useEffect(() => {
    const unsubA = db.collection('assignments').orderBy('createdAt', 'desc').onSnapshot(snap => {
      setAssignments(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoading(false);
    }, () => setLoading(false));
    const unsubS = db.collection('submissions').orderBy('timestamp', 'desc').onSnapshot(snap => setSubmissions(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))), () => {});
    return () => {
      unsubA();
      unsubS();
    };
  }, []);
  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = a => {
    setForm({
      ...a
    });
    setEditId(a.id);
    setShowForm(true);
  };
  const removeAssign = async id => {
    if (!window.confirm('ลบงานนี้?')) return;
    await db.collection('assignments').doc(id).delete();
  };
  const save = async () => {
    if (!form.title.trim()) return alert('กรุณากรอกชื่องาน');
    setSaving(true);
    const data = {
      ...form,
      maxScore: Number(form.maxScore) || 10,
      createdAt: editId ? form.createdAt : firebase.firestore.FieldValue.serverTimestamp()
    };
    if (editId) await db.collection('assignments').doc(editId).update(data);else await db.collection('assignments').add(data);
    setSaving(false);
    setShowForm(false);
  };
  const giveScore = async subId => {
    const s = scoreInputs[subId];
    if (s === undefined || s === '') return alert('กรุณากรอกคะแนน');
    await db.collection('submissions').doc(subId).update({
      status: 'reviewed',
      score: Number(s)
    });
    setScoreInputs(prev => {
      const n = {
        ...prev
      };
      delete n[subId];
      return n;
    });
  };
  const filteredSubs = filterAssign === 'ทั้งหมด' ? submissions : submissions.filter(s => s.assignmentTitle === filterAssign);
  const assignTitles = ['ทั้งหมด', ...assignments.map(a => a.title)];
  if (loading) return /*#__PURE__*/React.createElement("div", {
    className: "text-center py-20"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 32,
    className: "text-red-600 block mx-auto mb-2"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."));
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800"
  }, "4. \u0E2A\u0E31\u0E48\u0E07\u0E07\u0E32\u0E19 / \u0E15\u0E23\u0E27\u0E08\u0E07\u0E32\u0E19"), tab === 'assign' && /*#__PURE__*/React.createElement("button", {
    onClick: openAdd,
    className: "flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-plus",
    size: 14
  }), " \u0E2A\u0E31\u0E48\u0E07\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 bg-gray-100 p-1 rounded-lg w-fit"
  }, [['assign', 'fa-tasks', 'สั่งงาน'], ['review', 'fa-inbox', 'ตรวจงาน']].map(([t, ic, lb]) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    className: `flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white shadow text-red-700' : 'text-gray-500 hover:text-gray-700'}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 14
  }), lb, t === 'review' && submissions.filter(s => s.status === 'pending').length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
  }, submissions.filter(s => s.status === 'pending').length)))), tab === 'assign' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, assignments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-10 rounded-xl text-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-tasks",
    size: 48,
    className: "mb-4 block mx-auto opacity-30"
  }), /*#__PURE__*/React.createElement("p", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E48\u0E07 \u2014 \u0E01\u0E14 \"\u0E2A\u0E31\u0E48\u0E07\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19")) : assignments.map(a => {
    const subCount = submissions.filter(s => s.assignmentTitle === a.title).length;
    const pendCount = submissions.filter(s => s.assignmentTitle === a.title && s.status === 'pending').length;
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: "bg-white p-5 rounded-xl shadow-sm border border-gray-200"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start gap-4 flex-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-1"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-lg text-gray-800"
    }, a.title), a.course && /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
    }, a.course)), a.description && /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-gray-500 mb-2"
    }, a.description), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-4 text-xs text-gray-400 flex-wrap"
    }, a.deadline && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-calendar",
      size: 11,
      className: "mr-1"
    }), "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2A\u0E48\u0E07: ", a.deadline), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-star",
      size: 11,
      className: "mr-1"
    }), "\u0E04\u0E30\u0E41\u0E19\u0E19: ", a.maxScore), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-file-upload",
      size: 11,
      className: "mr-1"
    }), "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27: ", subCount, " \u0E04\u0E19"), pendCount > 0 && /*#__PURE__*/React.createElement("span", {
      className: "text-orange-600 font-bold"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-clock",
      size: 11,
      className: "mr-1"
    }), "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08: ", pendCount, " \u0E04\u0E19"))), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 shrink-0"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => openEdit(a),
      className: "text-blue-500 hover:text-blue-700 p-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-pen",
      size: 14
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => removeAssign(a.id),
      className: "text-red-400 hover:text-red-600 p-2"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-trash",
      size: 14
    })), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setFilterAssign(a.title);
        setTab('review');
      },
      className: "bg-red-50 text-red-700 text-xs px-3 py-1 rounded-lg hover:bg-red-100 font-medium"
    }, "\u0E15\u0E23\u0E27\u0E08\u0E07\u0E32\u0E19 \u2192"))));
  })), tab === 'review' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 flex-wrap"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600"
  }, "\u0E01\u0E23\u0E2D\u0E07\u0E15\u0E32\u0E21\u0E07\u0E32\u0E19:"), /*#__PURE__*/React.createElement("select", {
    value: filterAssign,
    onChange: e => setFilterAssign(e.target.value),
    className: "border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }, assignTitles.map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t))), /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-400"
  }, "(", filteredSubs.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)")), filteredSubs.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-10 rounded-xl text-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-inbox",
    size: 48,
    className: "mb-4 block mx-auto opacity-50"
  }), "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E07") : filteredSubs.map(sub => /*#__PURE__*/React.createElement("div", {
    key: sub.id,
    className: "bg-white p-5 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-start flex-wrap gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-base"
  }, sub.studentName, /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-gray-400 font-normal ml-2"
  }, "(", sub.studentId, ") ", sub.studentClass)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-500 mb-1"
  }, sub.assignmentTitle), /*#__PURE__*/React.createElement("a", {
    href: sub.link,
    target: "_blank",
    rel: "noreferrer",
    className: "text-blue-600 hover:underline text-sm break-all"
  }, sub.link), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-400 mt-1"
  }, sub.timestamp?.toDate?.()?.toLocaleString('th-TH') || '')), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 shrink-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-1 rounded font-bold ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`
  }, sub.status === 'pending' ? 'รอตรวจ' : 'ตรวจแล้ว'), sub.status === 'pending' ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    placeholder: "\u0E04\u0E30\u0E41\u0E19\u0E19",
    value: scoreInputs[sub.id] || '',
    onChange: e => setScoreInputs(prev => ({
      ...prev,
      [sub.id]: e.target.value
    })),
    className: "w-20 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => giveScore(sub.id),
    className: "bg-red-700 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-800"
  }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")) : /*#__PURE__*/React.createElement("span", {
    className: "font-black text-green-600 text-lg"
  }, sub.score, " \u0E04\u0E30\u0E41\u0E19\u0E19")))))), showForm && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-red-700 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg"
  }, editId ? 'แก้ไขงาน' : 'สั่งงานใหม่'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowForm(false),
    className: "hover:opacity-75"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-xmark",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E0A\u0E37\u0E48\u0E2D\u0E07\u0E32\u0E19 / \u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D ", /*#__PURE__*/React.createElement("span", {
    className: "text-red-500"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    value: form.title,
    onChange: e => setForm(f => ({
      ...f,
      title: e.target.value
    })),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E31\u0E14\u0E04\u0E25\u0E34\u0E1B\u0E41\u0E19\u0E30\u0E19\u0E33\u0E15\u0E31\u0E27\u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19",
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14 / \u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22"), /*#__PURE__*/React.createElement("textarea", {
    rows: 3,
    value: form.description,
    onChange: e => setForm(f => ({
      ...f,
      description: e.target.value
    })),
    placeholder: "\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21...",
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2A\u0E48\u0E07"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.deadline,
    onChange: e => setForm(f => ({
      ...f,
      deadline: e.target.value
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E15\u0E47\u0E21"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    value: form.maxScore,
    onChange: e => setForm(f => ({
      ...f,
      maxScore: e.target.value
    })),
    className: "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "text-sm font-medium text-gray-600 mb-1 block"
  }, "\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32"), /*#__PURE__*/React.createElement("input", {
    value: form.course,
    onChange: e => setForm(f => ({
      ...f,
      course: e.target.value
    })),
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E0833201 \u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 5",
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
  }, saving ? 'กำลังบันทึก...' : editId ? 'บันทึกการแก้ไข' : 'สั่งงาน'))))));
};
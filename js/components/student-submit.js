// js/components/student-submit.jsx

// ── StudentSubmitWork — ส่งงานออนไลน์ ──
window.StudentSubmitWork = ({
  user
}) => {
  const {
    useState,
    useEffect
  } = React;
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [link, setLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');
  useEffect(() => {
    const unsubA = db.collection('assignments').orderBy('createdAt', 'desc').onSnapshot(snap => {
      setAssignments(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoading(false);
    }, () => setLoading(false));
    const unsubS = db.collection('submissions').where('studentId', '==', user.id).orderBy('timestamp', 'desc').onSnapshot(snap => setMySubmissions(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }))), () => {});
    return () => {
      unsubA();
      unsubS();
    };
  }, [user.id]);
  const alreadySubmitted = title => mySubmissions.find(s => s.assignmentTitle === title);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!selected) return;
    if (!isPublic) {
      alert('กรุณายืนยันว่าเปิดสิทธิ์เข้าถึงลิงก์แล้ว');
      return;
    }
    setSubmitting(true);
    try {
      await db.collection('submissions').add({
        studentId: user.id,
        studentName: user.name,
        studentClass: user.class,
        assignmentTitle: selected.title,
        assignmentId: selected.id,
        link,
        status: 'pending',
        score: null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      setDoneMsg(selected.title);
      setSelected(null);
      setLink('');
      setIsPublic(false);
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
    setSubmitting(false);
  };
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
    className: "max-w-3xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-gray-800"
  }, "\u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C"), doneMsg && /*#__PURE__*/React.createElement("div", {
    className: "bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check-circle",
    size: 20,
    className: "text-green-600"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-green-700 font-medium"
  }, "\u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19 \"", /*#__PURE__*/React.createElement("strong", null, doneMsg), "\" \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27 \u0E04\u0E23\u0E39\u0E08\u0E30\u0E15\u0E23\u0E27\u0E08\u0E41\u0E25\u0E30\u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19\u0E40\u0E23\u0E47\u0E27\u0E46 \u0E19\u0E35\u0E49"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDoneMsg(''),
    className: "ml-auto text-gray-400 hover:text-gray-600"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-xmark",
    size: 16
  }))), assignments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-10 rounded-xl text-center text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-tasks",
    size: 48,
    className: "mb-4 block mx-auto opacity-30"
  }), /*#__PURE__*/React.createElement("p", null, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E07\u0E32\u0E19\u0E17\u0E35\u0E48\u0E04\u0E23\u0E39\u0E2A\u0E31\u0E48\u0E07")) : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, assignments.map(a => {
    const sub = alreadySubmitted(a.title);
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      className: `bg-white rounded-xl shadow-sm border p-5 transition-all ${selected?.id === a.id ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200'}`
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between items-start flex-wrap gap-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 mb-1"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "font-bold text-base text-gray-800"
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
    }), "\u0E04\u0E30\u0E41\u0E19\u0E19: ", a.maxScore))), /*#__PURE__*/React.createElement("div", {
      className: "shrink-0"
    }, sub ? /*#__PURE__*/React.createElement("div", {
      className: "text-right"
    }, /*#__PURE__*/React.createElement("span", {
      className: `text-xs px-2 py-1 rounded font-bold ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`
    }, sub.status === 'pending' ? 'รอตรวจ' : `ได้ ${sub.score}/${a.maxScore} คะแนน`), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-gray-400 mt-1"
    }, "\u0E2A\u0E48\u0E07\u0E41\u0E25\u0E49\u0E27")) : /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelected(selected?.id === a.id ? null : a),
      className: `text-sm px-4 py-2 rounded-lg font-medium transition-all ${selected?.id === a.id ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`
    }, selected?.id === a.id ? 'ยกเลิก' : 'ส่งงาน'))), selected?.id === a.id && /*#__PURE__*/React.createElement("form", {
      onSubmit: handleSubmit,
      className: "mt-4 pt-4 border-t border-red-100 space-y-3"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-sm font-bold text-gray-700 mb-1"
    }, "\u0E27\u0E32\u0E07\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E1C\u0E25\u0E07\u0E32\u0E19 (URL)"), /*#__PURE__*/React.createElement("input", {
      type: "url",
      required: true,
      placeholder: "https://drive.google.com/... \u0E2B\u0E23\u0E37\u0E2D https://youtu.be/...",
      className: "w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300",
      value: link,
      onChange: e => setLink(e.target.value)
    })), /*#__PURE__*/React.createElement("div", {
      className: "p-3 bg-blue-50 border border-blue-200 rounded-lg"
    }, /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-blue-700 mb-2"
    }, "\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E43\u0E2B\u0E49\u0E41\u0E19\u0E48\u0E43\u0E08\u0E27\u0E48\u0E32\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19 ", /*#__PURE__*/React.createElement("strong", null, "\"\u0E17\u0E38\u0E01\u0E04\u0E19\u0E17\u0E35\u0E48\u0E21\u0E35\u0E25\u0E34\u0E07\u0E01\u0E4C\""), " \u0E21\u0E34\u0E09\u0E30\u0E19\u0E31\u0E49\u0E19\u0E08\u0E30\u0E44\u0E14\u0E49 0 \u0E04\u0E30\u0E41\u0E19\u0E19"), /*#__PURE__*/React.createElement("label", {
      className: "flex items-center gap-2 cursor-pointer"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      required: true,
      checked: isPublic,
      onChange: e => setIsPublic(e.target.checked),
      className: "w-4 h-4"
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-bold text-red-700"
    }, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E34\u0E14\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E01\u0E32\u0E23\u0E40\u0E02\u0E49\u0E32\u0E16\u0E36\u0E07\u0E25\u0E34\u0E07\u0E01\u0E4C\u0E41\u0E25\u0E49\u0E27"))), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      disabled: submitting,
      className: "w-full bg-red-700 text-white font-bold py-2.5 rounded-lg hover:bg-red-800 disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
    }, submitting ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-spinner fa-spin",
      size: 16
    }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E48\u0E07...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "fa-paper-plane",
      size: 14
    }), " \u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19"))));
  })), mySubmissions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-gray-200 p-5"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-base text-gray-700 mb-3"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-history",
    size: 14,
    className: "mr-2"
  }), "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, mySubmissions.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    className: "flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gray-700"
  }, s.assignmentTitle), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("a", {
    href: s.link,
    target: "_blank",
    rel: "noreferrer",
    className: "text-blue-500 hover:underline text-xs"
  }, "\u0E14\u0E39\u0E25\u0E34\u0E07\u0E01\u0E4C"), /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-0.5 rounded font-bold ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`
  }, s.status === 'pending' ? 'รอตรวจ' : `${s.score} คะแนน`)))))));
};

// ── StudentDashboard ──
window.StudentDashboard = ({
  user
}) => {
  const {
    useState,
    useEffect
  } = React;
  const [stats, setStats] = useState({
    score: null,
    pending: null,
    attendance: null
  });
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [gradesSnap, pendingSnap, attSnap] = await Promise.all([db.collection('grades').where('studentId', '==', user.id).get(), db.collection('submissions').where('studentId', '==', user.id).where('status', '==', 'pending').get(), db.collection('attendance').where('studentId', '==', user.id).where('status', '==', 'มา').get()]);
        setStats({
          score: gradesSnap.docs.reduce((sum, d) => sum + (d.data().score || 0), 0),
          pending: pendingSnap.size,
          attendance: attSnap.size
        });
      } catch {}
    };
    loadStats();
  }, [user.id]);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl font-bold mb-2"
  }, "\u4F60\u597D, ", user.name, " \uD83D\uDC4B"), /*#__PURE__*/React.createElement("p", {
    className: "text-red-100"
  }, "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E2A\u0E39\u0E48\u0E2B\u0E49\u0E2D\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 \u0E04\u0E23\u0E39\u0E01\u0E35\u0E23\u0E15\u0E34 | ", user.class, " \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", user.no)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-3 gap-6"
  }, [{
    icon: 'fa-chart-bar',
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    label: 'คะแนนเก็บสะสม',
    val: stats.score !== null ? stats.score : '—'
  }, {
    icon: 'fa-cloud-upload-alt',
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    label: 'งานรอตรวจ',
    val: stats.pending !== null ? React.createElement('span', {
      className: stats.pending > 0 ? 'text-red-500' : 'text-green-600'
    }, `${stats.pending} งาน`) : '—'
  }, {
    icon: 'fa-check-square',
    bg: 'bg-green-100',
    color: 'text-green-600',
    label: 'วันที่มาเรียน',
    val: stats.attendance !== null ? `${stats.attendance} วัน` : '—'
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `p-4 ${c.bg} ${c.color} rounded-full w-12 h-12 flex items-center justify-center`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, c.label), /*#__PURE__*/React.createElement("p", {
    className: "text-2xl font-bold"
  }, c.val))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E08\u0E32\u0E01\u0E04\u0E23\u0E39\u0E1C\u0E39\u0E49\u0E2A\u0E2D\u0E19"), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-yellow-800"
  }, "\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E2B\u0E19\u0E49\u0E32\u0E08\u0E30\u0E21\u0E35\u0E01\u0E32\u0E23\u0E2A\u0E2D\u0E1A\u0E01\u0E25\u0E32\u0E07\u0E20\u0E32\u0E04 \u0E02\u0E2D\u0E43\u0E2B\u0E49\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E04\u0E33\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E1A\u0E17\u0E17\u0E35\u0E48 1-3 \u0E41\u0E25\u0E30\u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E04\u0E2D\u0E21\u0E1E\u0E34\u0E27\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E43\u0E2B\u0E49\u0E1E\u0E23\u0E49\u0E2D\u0E21"))));
};
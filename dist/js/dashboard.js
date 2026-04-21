/* ════════════════════════════════════════════
   dashboard.jsx — AdminDashboard, StudentDashboard
   ════════════════════════════════════════════ */

const {
  useState: useStateDash,
  useEffect: useEffectDash
} = React;

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
window.AdminDashboard = ({
  setCurrentView
}) => {
  const [studentCount, setStudentCount] = useStateDash(0);
  const [courseCount, setCourseCount] = useStateDash(0);
  const [pendingCount, setPendingCount] = useStateDash(0);
  useEffectDash(() => {
    const u1 = db.collection('students').onSnapshot(s => setStudentCount(s.size), () => {});
    const u2 = db.collection('submissions').where('status', '==', 'pending').onSnapshot(s => setPendingCount(s.size), () => {});
    const u3 = db.collection('courses').onSnapshot(s => setCourseCount(s.size), () => {});
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-red-800 to-red-600 rounded-2xl p-8 text-white shadow-lg"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-3xl font-bold mb-2"
  }, "\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A, \u0E04\u0E23\u0E39\u0E01\u0E35\u0E23\u0E15\u0E34 \u0E1B\u0E23\u0E30\u0E2A\u0E1E\u0E1E\u0E23\u0E23\u0E31\u0E07\u0E2A\u0E35"), /*#__PURE__*/React.createElement("p", {
    className: "text-red-100"
  }, "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E23\u0E30\u0E1A\u0E1A\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E2A\u0E2D\u0E19\u0E20\u0E32\u0E29\u0E32\u0E08\u0E35\u0E19 \u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32 2569")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
  }, [{
    icon: 'fa-users',
    bg: 'bg-blue-100',
    color: 'text-blue-600',
    label: 'นักเรียนทั้งหมด',
    value: `${studentCount} คน`
  }, {
    icon: 'fa-book-open',
    bg: 'bg-green-100',
    color: 'text-green-600',
    label: 'รายวิชา',
    value: `${courseCount} วิชา`
  }, {
    icon: 'fa-check-square',
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    label: 'รอตรวจงาน',
    value: /*#__PURE__*/React.createElement("span", {
      className: pendingCount > 0 ? 'text-red-500' : 'text-green-600'
    }, pendingCount, " \u0E07\u0E32\u0E19")
  }, {
    icon: 'fa-fire',
    bg: 'bg-orange-100',
    color: 'text-orange-600',
    label: 'ฐานข้อมูล',
    value: /*#__PURE__*/React.createElement("span", {
      className: "text-orange-500 font-bold"
    }, "Firebase")
  }].map((card, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: `p-3 md:p-4 ${card.bg} ${card.color} rounded-full w-11 h-11 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: card.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, card.label), /*#__PURE__*/React.createElement("p", {
    className: "text-lg md:text-2xl font-bold truncate"
  }, card.value))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-sm border border-gray-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\u0E40\u0E21\u0E19\u0E39\u0E25\u0E31\u0E14 (Quick Actions)"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, [{
    view: 'attendance',
    icon: 'fa-barcode',
    color: 'text-red-700',
    label: 'เช็คชื่อเข้าเรียน'
  }, {
    view: 'randomizer',
    icon: 'fa-gamepad',
    color: 'text-yellow-600',
    label: 'สุ่มรายชื่อเกม'
  }, {
    view: 'id-card',
    icon: 'fa-id-card',
    color: 'text-blue-600',
    label: 'สร้างบัตร QR Code'
  }, {
    view: 'assignments',
    icon: 'fa-inbox',
    color: 'text-purple-600',
    label: 'ตรวจงานออนไลน์'
  }].map(btn => /*#__PURE__*/React.createElement("button", {
    key: btn.view,
    onClick: () => setCurrentView && setCurrentView(btn.view),
    className: "p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition text-center flex flex-col items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: btn.icon,
    className: btn.color,
    size: 24
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-bold text-gray-700"
  }, btn.label))))));
};

/* ══════════════════════════════════════════
   STUDENT DASHBOARD (ดึงข้อมูลจาก Firestore)
══════════════════════════════════════════ */
window.StudentDashboard = ({
  user
}) => {
  const [stats, setStats] = useStateDash({
    score: null,
    pending: null,
    attendance: null
  });
  const [announcements, setAnnouncements] = useStateDash([]);
  const [annLoading, setAnnLoading] = useStateDash(true);
  useEffectDash(() => {
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

  /* โหลดประกาศจากรายวิชาที่ห้องเรียนของนักเรียนอยู่ */
  useEffectDash(() => {
    if (!user.class) {
      setAnnLoading(false);
      return;
    }
    db.collection('announcements').where('classrooms', 'array-contains', user.class).get().then(snap => {
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      /* เรียงปักหมุดก่อน แล้วล่าสุดก่อน */
      list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setAnnouncements(list);
    }).catch(() => {}).finally(() => setAnnLoading(false));
  }, [user.class]);
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
    val: stats.pending !== null ? /*#__PURE__*/React.createElement("span", {
      className: stats.pending > 0 ? 'text-red-500' : 'text-green-600'
    }, stats.pending, " \u0E07\u0E32\u0E19") : '—'
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
    className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 border-b border-gray-100 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-bullhorn",
    size: 16,
    className: "text-yellow-600"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-lg text-gray-800"
  }, "\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E08\u0E32\u0E01\u0E04\u0E23\u0E39\u0E1C\u0E39\u0E49\u0E2A\u0E2D\u0E19"), announcements.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ml-auto text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full"
  }, announcements.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 space-y-3"
  }, annLoading ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 22,
    className: "block mx-auto mb-2"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28...")) : announcements.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-6 text-gray-400"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-bell-slash",
    size: 28,
    className: "block mx-auto mb-2 opacity-40"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm"
  }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49")) : announcements.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: `flex gap-3 p-4 rounded-xl border-l-4 ${a.pinned ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-shrink-0 mt-0.5"
  }, a.pinned ? /*#__PURE__*/React.createElement(Icon, {
    name: "fa-thumbtack",
    size: 14,
    className: "text-yellow-500"
  }) : /*#__PURE__*/React.createElement(Icon, {
    name: "fa-comment-alt",
    size: 14,
    className: "text-gray-400"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-800 whitespace-pre-wrap"
  }, a.message), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mt-1.5 flex-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-gray-400"
  }, a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : ''), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded"
  }, a.courseName), a.pinned && /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-yellow-200 text-yellow-800 font-bold px-1.5 py-0.5 rounded"
  }, "\u0E1B\u0E31\u0E01\u0E2B\u0E21\u0E38\u0E14"))))))));
};
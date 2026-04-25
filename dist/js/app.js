// js/app.jsx
// ── App หลัก ──

function App() {
  const {
    useState,
    useEffect
  } = React;
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(true);
  const [showChangePassword, setShowChangePW] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = view => {
    setCurrentView(view);
    setSidebarOpen(false);
  };
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async fbUser => {
      if (fbUser) {
        setUser({
          role: 'admin',
          name: 'ครูกีรติ ประสพพรรังสี',
          email: fbUser.email
        });
        setCurrentView('dashboard');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);
  const handleLogin = async (username, password) => {
    if (username === 'kong') {
      try {
        await auth.signInWithEmailAndPassword(ADMIN_EMAIL, password);
        return;
      } catch {
        alert('รหัสผ่าน Admin ไม่ถูกต้อง');
        return;
      }
    }
    try {
      const doc = await db.collection('students').doc(username).get();
      if (doc.exists) {
        const data = doc.data();
        if (data.password === password) {
          const studentUser = {
            role: 'student',
            ...data
          };
          setUser(studentUser);
          setCurrentView('student-dashboard');
          if (data.password === '1234') setShowChangePW(true);
          return;
        }
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      return;
    }
    alert('รหัสผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
  };
  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch {}
    setUser(null);
    setCurrentView('dashboard');
  };
  if (authLoading) return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex items-center justify-center bg-red-900"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-white text-xl flex items-center gap-3"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 24
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14..."));
  if (!user) return /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: handleLogin
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "flex h-screen bg-gray-50 overflow-hidden"
  }, sidebarOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-40 md:hidden",
    onClick: () => setSidebarOpen(false)
  }), /*#__PURE__*/React.createElement("aside", {
    className: `
                fixed inset-y-0 left-0 z-50 w-64 bg-red-800 text-white flex flex-col shadow-xl
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:flex-shrink-0
            `
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex items-center gap-3 border-b border-red-700 bg-red-900"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_URL,
    alt: "Logo",
    className: "w-10 h-10 bg-white rounded-full p-1 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "font-bold text-sm tracking-wide text-yellow-400 truncate"
  }, "Chinese Class"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-gray-300"
  }, "By Krukong")), /*#__PURE__*/React.createElement("button", {
    className: "ml-auto md:hidden text-white/70 hover:text-white",
    onClick: () => setSidebarOpen(false)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-times",
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 mb-2 text-xs font-semibold text-red-300 uppercase tracking-wider"
  }, "\u0E40\u0E21\u0E19\u0E39\u0E2B\u0E25\u0E31\u0E01"), user.role === 'admin' ? /*#__PURE__*/React.createElement("nav", {
    className: "space-y-0.5"
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-home"
    }),
    label: "\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01 (Dashboard)",
    isActive: currentView === 'dashboard',
    onClick: () => navigate('dashboard')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-book-open"
    }),
    label: "1. \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E23\u0E32\u0E22\u0E27\u0E34\u0E0A\u0E32",
    isActive: currentView === 'course',
    onClick: () => navigate('course')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-users"
    }),
    label: "2. \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19",
    isActive: currentView === 'student',
    onClick: () => navigate('student')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-calendar-alt"
    }),
    label: "3. \u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32/\u0E40\u0E17\u0E2D\u0E21",
    isActive: currentView === 'calendar',
    onClick: () => navigate('calendar')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-check-square"
    }),
    label: "4. \u0E2A\u0E31\u0E48\u0E07\u0E07\u0E32\u0E19 / \u0E15\u0E23\u0E27\u0E08\u0E07\u0E32\u0E19",
    isActive: currentView === 'assignments',
    onClick: () => navigate('assignments')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-file-alt"
    }),
    label: "5. \u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 PDF",
    isActive: currentView === 'materials',
    onClick: () => navigate('materials')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-barcode"
    }),
    label: "6. \u0E40\u0E0A\u0E47\u0E04\u0E0A\u0E37\u0E48\u0E2D (POS)",
    isActive: currentView === 'attendance',
    onClick: () => navigate('attendance')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-gamepad"
    }),
    label: "7. \u0E2A\u0E38\u0E48\u0E21\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E40\u0E01\u0E21",
    isActive: currentView === 'randomizer',
    onClick: () => navigate('randomizer')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-chart-bar"
    }),
    label: "8. \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E04\u0E30\u0E41\u0E19\u0E19",
    isActive: currentView === 'grades',
    onClick: () => navigate('grades')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-barcode"
    }),
    label: "9. \u0E43\u0E2B\u0E49\u0E04\u0E30\u0E41\u0E19\u0E19 (POS)",
    isActive: currentView === 'grading-pos',
    onClick: () => navigate('grading-pos')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-id-card"
    }),
    label: "10. \u0E1A\u0E31\u0E15\u0E23\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19 (QR)",
    isActive: currentView === 'id-card',
    onClick: () => navigate('id-card')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-desktop"
    }),
    label: "11. \u0E08\u0E31\u0E14\u0E01\u0E32\u0E23\u0E2A\u0E2D\u0E1A\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C",
    isActive: currentView === 'exam',
    onClick: () => navigate('exam')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-table"
    }),
    label: "12. \u0E15\u0E32\u0E23\u0E32\u0E07\u0E2A\u0E2D\u0E19",
    isActive: currentView === 'timetable',
    onClick: () => navigate('timetable')
  })) : /*#__PURE__*/React.createElement("nav", {
    className: "space-y-0.5"
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-book-open"
    }),
    label: "\u0E2B\u0E19\u0E49\u0E32\u0E41\u0E23\u0E01",
    isActive: currentView === 'student-dashboard',
    onClick: () => navigate('student-dashboard')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-cloud-upload-alt"
    }),
    label: "\u0E2A\u0E48\u0E07\u0E07\u0E32\u0E19\u0E2D\u0E2D\u0E19\u0E44\u0E25\u0E19\u0E4C",
    isActive: currentView === 'submit-work',
    onClick: () => navigate('submit-work')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-file-alt"
    }),
    label: "\u0E1A\u0E17\u0E40\u0E23\u0E35\u0E22\u0E19/PDF",
    isActive: currentView === 'study-materials',
    onClick: () => navigate('study-materials')
  }), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "fa-edit"
    }),
    label: "\u0E17\u0E33\u0E41\u0E1A\u0E1A\u0E17\u0E14\u0E2A\u0E2D\u0E1A",
    isActive: currentView === 'take-exam',
    onClick: () => navigate('take-exam')
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-3 border-t border-red-700"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-red-900 font-bold flex-shrink-0 text-sm"
  }, user.name.charAt(0)), /*#__PURE__*/React.createElement("div", {
    className: "min-w-0 flex-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium truncate leading-tight"
  }, user.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-red-300"
  }, user.role === 'admin' ? 'Teacher/Admin' : 'Student'))), user.role === 'student' && /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowChangePW(true),
    className: "w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-key",
    size: 12
  }), " \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19"), /*#__PURE__*/React.createElement("button", {
    onClick: handleLogout,
    className: "w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded transition-colors text-xs"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-sign-out-alt",
    size: 14
  }), " \u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A"))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col overflow-hidden min-w-0"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-white shadow-sm flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 gap-3"
  }, /*#__PURE__*/React.createElement("button", {
    className: "md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex-shrink-0",
    onClick: () => setSidebarOpen(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-bars",
    size: 20
  })), /*#__PURE__*/React.createElement("h2", {
    className: "text-base md:text-lg font-bold text-gray-800 truncate flex-1"
  }, user.role === 'admin' ? 'ระบบจัดการการสอน' : 'ห้องเรียนภาษาจีนออนไลน์'), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-shrink-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline text-xs text-gray-400"
  }, "\u0E1B\u0E35\u0E01\u0E32\u0E23\u0E28\u0E36\u0E01\u0E29\u0E32 2569 / \u0E40\u0E17\u0E2D\u0E21 1"), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-fire",
    size: 10
  }), " Firebase"))), showChangePassword && /*#__PURE__*/React.createElement(ChangePasswordModal, {
    user: user,
    isForced: user.password === '1234',
    onClose: () => setShowChangePW(false),
    onSuccess: newPw => {
      setUser(prev => ({
        ...prev,
        password: newPw
      }));
      setShowChangePW(false);
    }
  }), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-100"
  }, user.role === 'admin' && currentView === 'dashboard' && /*#__PURE__*/React.createElement(AdminDashboard, {
    setCurrentView: navigate
  }), user.role === 'admin' && currentView === 'id-card' && /*#__PURE__*/React.createElement(IDCardGenerator, null), user.role === 'admin' && currentView === 'attendance' && /*#__PURE__*/React.createElement(POSAttendance, null), user.role === 'admin' && currentView === 'grading-pos' && /*#__PURE__*/React.createElement(POSGrading, null), user.role === 'admin' && currentView === 'randomizer' && /*#__PURE__*/React.createElement(RandomizerGame, null), user.role === 'admin' && currentView === 'exam' && /*#__PURE__*/React.createElement(ExamManager, null), user.role === 'admin' && currentView === 'assignments' && /*#__PURE__*/React.createElement(AssignmentReview, null), user.role === 'admin' && currentView === 'student' && /*#__PURE__*/React.createElement(StudentManager, null), user.role === 'admin' && currentView === 'course' && /*#__PURE__*/React.createElement(CourseManager, null), user.role === 'admin' && currentView === 'calendar' && /*#__PURE__*/React.createElement(AcademicYearManager, null), user.role === 'admin' && currentView === 'materials' && /*#__PURE__*/React.createElement(MaterialsManager, null), user.role === 'admin' && currentView === 'grades' && /*#__PURE__*/React.createElement(GradeManager, null), user.role === 'admin' && currentView === 'timetable' && /*#__PURE__*/React.createElement(TimetableManager, null), user.role === 'student' && currentView === 'student-dashboard' && /*#__PURE__*/React.createElement(StudentDashboard, {
    user: user
  }), user.role === 'student' && currentView === 'submit-work' && /*#__PURE__*/React.createElement(StudentSubmitWork, {
    user: user
  }), user.role === 'student' && currentView === 'take-exam' && /*#__PURE__*/React.createElement(StudentExam, {
    user: user
  }), user.role === 'student' && currentView === 'study-materials' && /*#__PURE__*/React.createElement(StudyMaterials, null))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));

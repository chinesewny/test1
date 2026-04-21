// js/app.jsx
// ── App หลัก ──
function App() {
    const { useState, useEffect } = React;

    const [user, setUser]                       = useState(null);
    const [currentView, setCurrentView]         = useState('dashboard');
    const [authLoading, setAuthLoading]         = useState(true);
    const [showChangePassword, setShowChangePW] = useState(false);
    const [sidebarOpen, setSidebarOpen]         = useState(false);

    const navigate = (view) => { setCurrentView(view); setSidebarOpen(false); };

    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (fbUser) => {
            if (fbUser) {
                setUser({ role: 'admin', name: 'ครูกีรติ ประสพพรรังสี', email: fbUser.email });
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
                    const studentUser = { role: 'student', ...data };
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
        try { await auth.signOut(); } catch {}
        setUser(null);
        setCurrentView('dashboard');
    };

    if (authLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-red-900">
            <div className="text-white text-xl flex items-center gap-3">
                <Icon name="fa-spinner fa-spin" size={24}/> กำลังโหลด...
            </div>
        </div>
    );

    if (!user) return <LoginScreen onLogin={handleLogin}/>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Backdrop (mobile only) ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={()=>setSidebarOpen(false)}/>
            )}

            {/* ── SIDEBAR ── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-red-800 text-white flex flex-col shadow-xl
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:flex-shrink-0
            `}>
                {/* Logo */}
                <div className="p-4 flex items-center gap-3 border-b border-red-700 bg-red-900">
                    <img src={LOGO_URL} alt="Logo" className="w-10 h-10 bg-white rounded-full p-1 flex-shrink-0"/>
                    <div className="min-w-0">
                        <h1 className="font-bold text-sm tracking-wide text-yellow-400 truncate">Chinese Class</h1>
                        <p className="text-xs text-gray-300">By Krukong</p>
                    </div>
                    <button className="ml-auto md:hidden text-white/70 hover:text-white"
                        onClick={()=>setSidebarOpen(false)}>
                        <Icon name="fa-times" size={18}/>
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-3">
                    <div className="px-4 mb-2 text-xs font-semibold text-red-300 uppercase tracking-wider">เมนูหลัก</div>
                    {user.role === 'admin' ? (
                        <nav className="space-y-0.5">
                            <NavItem icon={<Icon name="fa-home"/>}         label="หน้าแรก (Dashboard)"    isActive={currentView==='dashboard'}   onClick={()=>navigate('dashboard')}/>
                            <NavItem icon={<Icon name="fa-book-open"/>}    label="1. จัดการรายวิชา"       isActive={currentView==='course'}       onClick={()=>navigate('course')}/>
                            <NavItem icon={<Icon name="fa-users"/>}        label="2. จัดการนักเรียน"      isActive={currentView==='student'}      onClick={()=>navigate('student')}/>
                            <NavItem icon={<Icon name="fa-calendar-alt"/>} label="3. ปีการศึกษา/เทอม"    isActive={currentView==='calendar'}     onClick={()=>navigate('calendar')}/>
                            <NavItem icon={<Icon name="fa-check-square"/>} label="4. สั่งงาน / ตรวจงาน"  isActive={currentView==='assignments'}  onClick={()=>navigate('assignments')}/>
                            <NavItem icon={<Icon name="fa-file-alt"/>}     label="5. เอกสาร PDF"          isActive={currentView==='materials'}    onClick={()=>navigate('materials')}/>
                            <NavItem icon={<Icon name="fa-barcode"/>}      label="6. เช็คชื่อ (POS)"      isActive={currentView==='attendance'}   onClick={()=>navigate('attendance')}/>
                            <NavItem icon={<Icon name="fa-gamepad"/>}      label="7. สุ่มรายชื่อเกม"      isActive={currentView==='randomizer'}   onClick={()=>navigate('randomizer')}/>
                            <NavItem icon={<Icon name="fa-chart-bar"/>}    label="8. จัดการคะแนน"         isActive={currentView==='grades'}       onClick={()=>navigate('grades')}/>
                            <NavItem icon={<Icon name="fa-barcode"/>}      label="9. ให้คะแนน (POS)"      isActive={currentView==='grading-pos'} onClick={()=>navigate('grading-pos')}/>
                            <NavItem icon={<Icon name="fa-id-card"/>}      label="10. บัตรนักเรียน (QR)"  isActive={currentView==='id-card'}     onClick={()=>navigate('id-card')}/>
                            <NavItem icon={<Icon name="fa-desktop"/>}      label="11. จัดการสอบออนไลน์"  isActive={currentView==='exam'}         onClick={()=>navigate('exam')}/>
                            <NavItem icon={<Icon name="fa-table"/>}        label="12. ตารางสอน"           isActive={currentView==='timetable'}    onClick={()=>navigate('timetable')}/>
                        </nav>
                    ) : (
                        <nav className="space-y-0.5">
                            <NavItem icon={<Icon name="fa-book-open"/>}        label="หน้าแรก"        isActive={currentView==='student-dashboard'} onClick={()=>navigate('student-dashboard')}/>
                            <NavItem icon={<Icon name="fa-cloud-upload-alt"/>} label="ส่งงานออนไลน์"  isActive={currentView==='submit-work'}       onClick={()=>navigate('submit-work')}/>
                            <NavItem icon={<Icon name="fa-file-alt"/>}         label="บทเรียน/PDF"    isActive={currentView==='study-materials'}   onClick={()=>navigate('study-materials')}/>
                            <NavItem icon={<Icon name="fa-edit"/>}             label="ทำแบบทดสอบ"    isActive={currentView==='take-exam'}         onClick={()=>navigate('take-exam')}/>
                        </nav>
                    )}
                </div>

                {/* User area */}
                <div className="p-3 border-t border-red-700">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-red-900 font-bold flex-shrink-0 text-sm">
                            {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate leading-tight">{user.name}</p>
                            <p className="text-xs text-red-300">{user.role==='admin' ? 'Teacher/Admin' : 'Student'}</p>
                        </div>
                    </div>
                    {user.role === 'student' && (
                        <button onClick={() => setShowChangePW(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors text-xs">
                            <Icon name="fa-key" size={12}/> เปลี่ยนรหัสผ่าน
                        </button>
                    )}
                    <button onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900 hover:bg-red-950 text-white rounded transition-colors text-xs">
                        <Icon name="fa-sign-out-alt" size={14}/> ออกจากระบบ
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Top Header */}
                <header className="bg-white shadow-sm flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 gap-3">
                    <button className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 flex-shrink-0"
                        onClick={()=>setSidebarOpen(true)}>
                        <Icon name="fa-bars" size={20}/>
                    </button>

                    <h2 className="text-base md:text-lg font-bold text-gray-800 truncate flex-1">
                        {user.role==='admin' ? 'ระบบจัดการการสอน' : 'ห้องเรียนภาษาจีนออนไลน์'}
                    </h2>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline text-xs text-gray-400">ปีการศึกษา 2569 / เทอม 1</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                            <Icon name="fa-fire" size={10}/> Firebase
                        </span>
                    </div>
                </header>

                {showChangePassword && (
                    <ChangePasswordModal
                        user={user}
                        isForced={user.password === '1234'}
                        onClose={() => setShowChangePW(false)}
                        onSuccess={(newPw) => {
                            setUser(prev => ({ ...prev, password: newPw }));
                            setShowChangePW(false);
                        }}
                    />
                )}

                <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-100">
                    {user.role==='admin' && currentView==='dashboard'   && <AdminDashboard setCurrentView={navigate}/>}
                    {user.role==='admin' && currentView==='id-card'     && <IDCardGenerator/>}
                    {user.role==='admin' && currentView==='attendance'  && <POSAttendance/>}
                    {user.role==='admin' && currentView==='grading-pos' && <POSGrading/>}
                    {user.role==='admin' && currentView==='randomizer'  && <RandomizerGame/>}
                    {user.role==='admin' && currentView==='exam'        && <ExamManager/>}
                    {user.role==='admin' && currentView==='assignments' && <AssignmentReview/>}
                    {user.role==='admin' && currentView==='student'   && <StudentManager/>}
                    {user.role==='admin' && currentView==='course'    && <CourseManager/>}
                    {user.role==='admin' && currentView==='calendar'  && <AcademicYearManager/>}
                    {user.role==='admin' && currentView==='materials' && <MaterialsManager/>}
                    {user.role==='admin' && currentView==='grades'     && <GradeManager/>}
                    {user.role==='admin' && currentView==='timetable' && <TimetableManager/>}

                    {user.role==='student' && currentView==='student-dashboard'  && <StudentDashboard user={user}/>}
                    {user.role==='student' && currentView==='submit-work'         && <StudentSubmitWork user={user}/>}
                    {user.role==='student' && currentView==='take-exam'           && <StudentExam user={user}/>}
                    {user.role==='student' && currentView==='study-materials'     && <StudyMaterials/>}
                </main>
            </div>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

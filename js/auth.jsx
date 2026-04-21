/* ════════════════════════════════════════════
   auth.jsx — LoginScreen, ChangePasswordModal
   ════════════════════════════════════════════ */

const { useState: useStateAuth } = React;

/* ══════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════ */
window.LoginScreen = ({ onLogin }) => {
    const [username, setUsername] = useStateAuth('');
    const [password, setPassword] = useStateAuth('');
    const [loading,  setLoading]  = useStateAuth(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onLogin(username, password);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-cover bg-center flex items-center justify-center relative"
            style={{backgroundImage:`url('https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`}}>
            <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm"></div>
            <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-2xl z-10 w-full max-w-md mx-4 border-t-8 border-yellow-500">
                <div className="text-center mb-6">
                    <img src={LOGO_URL} alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 border-4 border-gray-100 rounded-full shadow-sm bg-white"/>
                    <h1 className="text-2xl font-bold text-red-800">Chinese Class</h1>
                    <p className="text-gray-500 text-sm mt-1">โรงเรียนวังน้ำเย็นวิทยาคม</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสประจำตัว (Username)</label>
                        <input type="text" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            placeholder="Admin: kong  หรือ  รหัสนักเรียน 5 หลัก"
                            value={username} onChange={e=>setUsername(e.target.value)}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (Password)</label>
                        <input type="password" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            placeholder="รหัสผ่าน"
                            value={password} onChange={e=>setPassword(e.target.value)}/>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg shadow-md transition-colors text-lg disabled:opacity-70 flex items-center justify-center gap-2">
                        {loading ? <><Icon name="fa-spinner fa-spin" size={18}/> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
                    </button>
                </form>
                <p className="mt-6 text-center text-xs text-gray-400">
                <span className="text-orange-500">ครูกีรติ ประสพพรรังสี • กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ</span>
                </p>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════
   CHANGE PASSWORD MODAL
   - isForced=true  → Login ครั้งแรก (รหัสผ่านยังเป็น 1234) ปิดไม่ได้
   - isForced=false → เปลี่ยนเองตามต้องการ
══════════════════════════════════════════ */
window.ChangePasswordModal = ({ user, isForced, onClose, onSuccess }) => {
    const [currentPw,  setCurrentPw]  = useStateAuth('');
    const [newPw,      setNewPw]      = useStateAuth('');
    const [confirmPw,  setConfirmPw]  = useStateAuth('');
    const [saving,     setSaving]     = useStateAuth(false);
    const [error,      setError]      = useStateAuth('');

    const validate = () => {
        if (!isForced && currentPw !== user.password)
            return 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
        if (newPw.length < 6)
            return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
        if (newPw === '1234')
            return 'ไม่อนุญาตให้ใช้รหัสผ่าน 1234';
        if (newPw !== confirmPw)
            return 'รหัสผ่านใหม่ไม่ตรงกัน';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) { setError(err); return; }

        setSaving(true);
        try {
            await db.collection('students').doc(user.id).update({ password: newPw });
        } catch {
            /* Firestore ไม่พร้อม — อัปเดตแค่ใน state ไปก่อน */
        }
        setSaving(false);
        onSuccess(newPw);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-yellow-500 animate-fade-in-down">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                            <Icon name="fa-key" size={18}/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {isForced ? '⚠️ กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน' : 'เปลี่ยนรหัสผ่าน'}
                            </h2>
                            <p className="text-sm text-gray-500">{user.name} • รหัส {user.id}</p>
                        </div>
                    </div>
                    {isForced && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            รหัสผ่านเริ่มต้น <strong>1234</strong> ไม่ปลอดภัย กรุณาตั้งรหัสผ่านใหม่ก่อนเข้าใช้งาน
                        </div>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* รหัสผ่านปัจจุบัน (แสดงเฉพาะเมื่อเปลี่ยนเอง) */}
                    {!isForced && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                รหัสผ่านปัจจุบัน
                            </label>
                            <input type="password" required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                                placeholder="รหัสผ่านที่ใช้อยู่ตอนนี้"
                                value={currentPw} onChange={e => { setCurrentPw(e.target.value); setError(''); }}/>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            รหัสผ่านใหม่ <span className="text-gray-400 font-normal">(อย่างน้อย 6 ตัว)</span>
                        </label>
                        <input type="password" required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
                            placeholder="ตั้งรหัสผ่านใหม่"
                            value={newPw} onChange={e => { setNewPw(e.target.value); setError(''); }}/>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            ยืนยันรหัสผ่านใหม่
                        </label>
                        <input type="password" required
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none ${
                                confirmPw && confirmPw !== newPw ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                            value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setError(''); }}/>
                        {confirmPw && confirmPw !== newPw && (
                            <p className="text-xs text-red-500 mt-1">รหัสผ่านไม่ตรงกัน</p>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                            <Icon name="fa-exclamation-circle" size={14}/> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        {!isForced && (
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors">
                                ยกเลิก
                            </button>
                        )}
                        <button type="submit" disabled={saving}
                            className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                            {saving
                                ? <><Icon name="fa-spinner fa-spin" size={16}/> กำลังบันทึก...</>
                                : <><Icon name="fa-check" size={16}/> บันทึกรหัสผ่านใหม่</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

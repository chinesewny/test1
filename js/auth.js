/* ════════════════════════════════════════════
   auth.jsx — LoginScreen, ChangePasswordModal
   ════════════════════════════════════════════ */

const {
  useState: useStateAuth
} = React;

/* ══════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════ */
window.LoginScreen = ({
  onLogin
}) => {
  const [username, setUsername] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await onLogin(username, password);
    setLoading(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-cover bg-center flex items-center justify-center relative",
    style: {
      backgroundImage: `url('https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-red-900/80 backdrop-blur-sm"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 sm:p-10 rounded-2xl shadow-2xl z-10 w-full max-w-md mx-4 border-t-8 border-yellow-500"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center mb-6"
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_URL,
    alt: "Logo",
    className: "w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 border-4 border-gray-100 rounded-full shadow-sm bg-white"
  }), /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-bold text-red-800"
  }, "Chinese Class"), /*#__PURE__*/React.createElement("p", {
    className: "text-gray-500 text-sm mt-1"
  }, "\u0E42\u0E23\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E27\u0E31\u0E07\u0E19\u0E49\u0E33\u0E40\u0E22\u0E47\u0E19\u0E27\u0E34\u0E17\u0E22\u0E32\u0E04\u0E21")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27 (Username)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all",
    placeholder: "Admin: kong  \u0E2B\u0E23\u0E37\u0E2D  \u0E23\u0E2B\u0E31\u0E2A\u0E19\u0E31\u0E01\u0E40\u0E23\u0E35\u0E22\u0E19 5 \u0E2B\u0E25\u0E31\u0E01",
    value: username,
    onChange: e => setUsername(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-gray-700 mb-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19 (Password)"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all",
    placeholder: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19",
    value: password,
    onChange: e => setPassword(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg shadow-md transition-colors text-lg disabled:opacity-70 flex items-center justify-center gap-2"
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 18
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A...") : 'เข้าสู่ระบบ')), /*#__PURE__*/React.createElement("p", {
    className: "mt-6 text-center text-xs text-gray-400"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-500"
  }, "\u0E04\u0E23\u0E39\u0E01\u0E35\u0E23\u0E15\u0E34 \u0E1B\u0E23\u0E30\u0E2A\u0E1E\u0E1E\u0E23\u0E23\u0E31\u0E07\u0E2A\u0E35 \u2022 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E2A\u0E32\u0E23\u0E30\u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E19\u0E23\u0E39\u0E49\u0E20\u0E32\u0E29\u0E32\u0E15\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28"))));
};

/* ══════════════════════════════════════════
   CHANGE PASSWORD MODAL
   - isForced=true  → Login ครั้งแรก (รหัสผ่านยังเป็น 1234) ปิดไม่ได้
   - isForced=false → เปลี่ยนเองตามต้องการ
══════════════════════════════════════════ */
window.ChangePasswordModal = ({
  user,
  isForced,
  onClose,
  onSuccess
}) => {
  const [currentPw, setCurrentPw] = useStateAuth('');
  const [newPw, setNewPw] = useStateAuth('');
  const [confirmPw, setConfirmPw] = useStateAuth('');
  const [saving, setSaving] = useStateAuth(false);
  const [error, setError] = useStateAuth('');
  const validate = () => {
    if (!isForced && currentPw !== user.password) return 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
    if (newPw.length < 6) return 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    if (newPw === '1234') return 'ไม่อนุญาตให้ใช้รหัสผ่าน 1234';
    if (newPw !== confirmPw) return 'รหัสผ่านใหม่ไม่ตรงกัน';
    return '';
  };
  const handleSubmit = async e => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    try {
      await db.collection('students').doc(user.id).update({
        password: newPw
      });
    } catch {
      /* Firestore ไม่พร้อม — อัปเดตแค่ใน state ไปก่อน */
    }
    setSaving(false);
    onSuccess(newPw);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-yellow-500 animate-fade-in-down"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-6 pb-4 border-b border-gray-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-key",
    size: 18
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-bold text-gray-800"
  }, isForced ? '⚠️ กรุณาเปลี่ยนรหัสผ่านก่อนใช้งาน' : 'เปลี่ยนรหัสผ่าน'), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-gray-500"
  }, user.name, " \u2022 \u0E23\u0E2B\u0E31\u0E2A ", user.id))), isForced && /*#__PURE__*/React.createElement("div", {
    className: "mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 ", /*#__PURE__*/React.createElement("strong", null, "1234"), " \u0E44\u0E21\u0E48\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit,
    className: "p-6 space-y-4"
  }, !isForced && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none",
    placeholder: "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E2D\u0E22\u0E39\u0E48\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49",
    value: currentPw,
    onChange: e => {
      setCurrentPw(e.target.value);
      setError('');
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48 ", /*#__PURE__*/React.createElement("span", {
    className: "text-gray-400 font-normal"
  }, "(\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22 6 \u0E15\u0E31\u0E27)")), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    className: "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none",
    placeholder: "\u0E15\u0E31\u0E49\u0E07\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48",
    value: newPw,
    onChange: e => {
      setNewPw(e.target.value);
      setError('');
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-bold text-gray-700 mb-1"
  }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    className: `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none ${confirmPw && confirmPw !== newPw ? 'border-red-400 bg-red-50' : 'border-gray-300'}`,
    placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07",
    value: confirmPw,
    onChange: e => {
      setConfirmPw(e.target.value);
      setError('');
    }
  }), confirmPw && confirmPw !== newPw && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-red-500 mt-1"
  }, "\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19")), error && /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-exclamation-circle",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-3 pt-2"
  }, !isForced && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold transition-colors"
  }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: saving,
    className: "flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
  }, saving ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-spinner fa-spin",
    size: 16
  }), " \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "fa-check",
    size: 16
  }), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E23\u0E2B\u0E31\u0E2A\u0E1C\u0E48\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48"))))));
};
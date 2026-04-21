/* ════════════════════════════════════════════
   utils.jsx — Icon, F, TabBtn, NavItem, PlaceholderView
   ════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   Icon Helper
────────────────────────────────────────── */
window.Icon = ({ name, size = 18, className = '' }) => (
    <i className={`fas ${name} ${className}`} style={{ fontSize: `${size}px` }}></i>
);

/* ──────────────────────────────────────────
   F — Form field wrapper
────────────────────────────────────────── */
window.F = ({ label, children }) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

/* ──────────────────────────────────────────
   TabBtn — Tab button helper
────────────────────────────────────────── */
window.TabBtn = ({ id, label, icon, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === id
                ? 'border-red-700 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
        <Icon name={icon} size={15}/> {label}
    </button>
);

/* ──────────────────────────────────────────
   NavItem — Sidebar navigation item
────────────────────────────────────────── */
window.NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick}
        className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
            isActive ? 'bg-red-900 border-r-4 border-yellow-400 text-white'
                     : 'text-gray-300 hover:bg-red-700 hover:text-white'}`}>
        {icon}<span>{label}</span>
    </button>
);

/* ──────────────────────────────────────────
   PlaceholderView
────────────────────────────────────────── */
window.PlaceholderView = ({ title, desc }) => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center h-[60vh]">
        <Icon name="fa-cog" size={48} className="text-gray-300 mb-4"/>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-500">{desc}</p>
    </div>
);

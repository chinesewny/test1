/* ════════════════════════════════════════════
   utils.jsx — Icon, F, TabBtn, NavItem, PlaceholderView
   ════════════════════════════════════════════ */

/* ──────────────────────────────────────────
   Icon Helper
────────────────────────────────────────── */
window.Icon = ({
  name,
  size = 18,
  className = ''
}) => /*#__PURE__*/React.createElement("i", {
  className: `fas ${name} ${className}`,
  style: {
    fontSize: `${size}px`
  }
});

/* ──────────────────────────────────────────
   F — Form field wrapper
────────────────────────────────────────── */
window.F = ({
  label,
  children
}) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
  className: "block text-sm font-bold text-gray-700 mb-1"
}, label), children);

/* ──────────────────────────────────────────
   TabBtn — Tab button helper
────────────────────────────────────────── */
window.TabBtn = ({
  id,
  label,
  icon,
  activeTab,
  setActiveTab
}) => /*#__PURE__*/React.createElement("button", {
  onClick: () => setActiveTab(id),
  className: `flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === id ? 'border-red-700 text-red-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`
}, /*#__PURE__*/React.createElement(Icon, {
  name: icon,
  size: 15
}), " ", label);

/* ──────────────────────────────────────────
   NavItem — Sidebar navigation item
────────────────────────────────────────── */
window.NavItem = ({
  icon,
  label,
  isActive,
  onClick
}) => /*#__PURE__*/React.createElement("button", {
  onClick: onClick,
  className: `w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${isActive ? 'bg-red-900 border-r-4 border-yellow-400 text-white' : 'text-gray-300 hover:bg-red-700 hover:text-white'}`
}, icon, /*#__PURE__*/React.createElement("span", null, label));

/* ──────────────────────────────────────────
   PlaceholderView
────────────────────────────────────────── */
window.PlaceholderView = ({
  title,
  desc
}) => /*#__PURE__*/React.createElement("div", {
  className: "bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center flex flex-col items-center justify-center h-[60vh]"
}, /*#__PURE__*/React.createElement(Icon, {
  name: "fa-cog",
  size: 48,
  className: "text-gray-300 mb-4"
}), /*#__PURE__*/React.createElement("h2", {
  className: "text-2xl font-bold text-gray-700 mb-2"
}, title), /*#__PURE__*/React.createElement("p", {
  className: "text-gray-500"
}, desc));
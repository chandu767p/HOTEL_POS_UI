export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const formatCurrency = (value) => {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

export const statusColors = {
  // Generic / CRM
  new: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  contacted: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  proposal: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  won: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  lost: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  
  // POS Specific
  pending: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  preparing: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  served: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  paid: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',

  // Roles
  admin: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  manager: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  waiter: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  chef: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  
  // Boolean state
  true: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  false: 'bg-white/5 text-gray-500 border border-white/10',
};

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '';

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const objectToQueryString = (obj) => {
  const params = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.append(k, v);
  });
  return params.toString();
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500',
  'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
];

export const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};

export const debounce = (fn, ms = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

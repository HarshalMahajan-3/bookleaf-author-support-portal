import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BookOpen, ChevronDown, CircleHelp, Headphones, LayoutDashboard,
  LogOut, Menu, MessageSquareText, ShieldCheck, Users, X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';

const authorNav = [
  { label: 'Workspace', items: [
    { to: '/author/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/author/books', label: 'My books', icon: BookOpen },
    { to: '/author/tickets', label: 'Support tickets', icon: MessageSquareText },
  ] },
];
const adminNav = [
  { label: 'Operations', items: [
    { to: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/tickets', label: 'Ticket inbox', icon: MessageSquareText },
    { to: '/admin/authors', label: 'Authors', icon: Users },
    { to: '/admin/books', label: 'Book catalogue', icon: BookOpen },
  ] },
];

const pageNames = {
  '/author/overview': 'Overview', '/author/books': 'My books', '/author/tickets': 'Support tickets', '/author/tickets/new': 'New support request',
  '/admin/overview': 'Operations overview', '/admin/tickets': 'Ticket inbox', '/admin/authors': 'Authors', '/admin/books': 'Book catalogue',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const sections = isAdmin ? adminNav : authorNav;
  const pageTitle = useMemo(() => pageNames[location.pathname] || (location.pathname.startsWith('/tickets/') ? 'Ticket details' : 'Workspace'), [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const sidebar = <>
    <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-leaf text-forest"><BookOpen size={21} strokeWidth={2.2} /></div>
      <div><p className="font-display text-[19px] font-bold leading-5 tracking-tight text-white">bookleaf<span className="text-leaf">.</span></p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">{isAdmin ? 'Operations desk' : 'Author space'}</p></div>
    </div>
    <div className="px-3 py-7">
      {sections.map((section) => <div key={section.label} className="mb-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">{section.label}</p>
        <div className="space-y-1">{section.items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}>
          <Icon size={17} className="shrink-0 opacity-80" /><span>{label}</span>
          {label === 'Support tickets' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-leaf" />}
        </NavLink>)}</div>
      </div>)}
    </div>
    <div className="mt-auto p-4">
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center gap-2 text-leaf"><ShieldCheck size={15} /><span className="text-[11px] font-semibold">Secure workspace</span></div>
        <p className="mt-2 text-[11px] leading-5 text-white/45">Your publishing information and conversations stay within your account.</p>
      </div>
      <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white"><LogOut size={17} />Sign out</button>
    </div>
  </>;

  return <div className="min-h-screen bg-cream">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-[#17382f] lg:flex">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} /><aside className="relative flex h-full w-[280px] flex-col bg-[#17382f] shadow-2xl">{sidebar}</aside><button onClick={() => setMobileOpen(false)} className="absolute left-[290px] top-5 rounded-lg bg-white p-2 text-ink"><X size={18} /></button></div>}
    <main className="min-h-screen lg:pl-[248px]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-line bg-cream/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg border border-line bg-white p-2 text-ink lg:hidden"><Menu size={18} /></button><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">BookLeaf / {isAdmin ? 'Admin' : 'Author'}</p><p className="mt-0.5 text-sm font-semibold text-ink">{pageTitle}</p></div></div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[11px] font-medium text-muted sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />All systems operational</div>
          <div className="flex items-center gap-2.5 border-l border-line pl-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#e8efdf] text-[11px] font-bold text-forest">{initials(user?.name)}</div><div className="hidden sm:block"><p className="max-w-[150px] truncate text-xs font-semibold text-ink">{user?.name}</p><p className="text-[10px] capitalize text-muted">{isAdmin ? 'Administrator' : user?.city || 'Author'}</p></div><ChevronDown size={14} className="hidden text-muted sm:block" /></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9"><Outlet /></div>
      <footer className="mx-auto flex max-w-[1440px] items-center justify-between border-t border-line px-5 py-5 text-[10px] text-muted sm:px-8"><span>© 2026 BookLeaf Publishing</span><span className="inline-flex items-center gap-1.5"><Headphones size={12} /> Author support, made thoughtful</span></footer>
    </main>
  </div>;
}

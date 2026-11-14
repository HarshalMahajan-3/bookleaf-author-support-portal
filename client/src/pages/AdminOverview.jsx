import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CircleAlert, Coins, MessagesSquare, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { currency, number } from '../utils';
import { EmptyState, PageTitle, StatCard, TextLink } from '../components/UI';
import TicketCard from '../components/TicketCard';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/tickets')])
      .then(([statsResponse, ticketsResponse]) => { setStats(statsResponse.data); setTickets(ticketsResponse.data.tickets); })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const urgent = tickets.filter((ticket) => ['Critical', 'High'].includes(ticket.priority) && ['Open', 'In Progress'].includes(ticket.status));
  const active = stats?.counts?.Open + stats?.counts?.['In Progress'];

  return <>
    <PageTitle eyebrow="BOOKLEAF OPERATIONS" title="Good evening, team." description="Here is what's happening across author support today." action={<Link to="/admin/tickets" className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#245445]">Open ticket inbox <ArrowRight size={14} /></Link>} />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="panel h-32 animate-pulse" />)}</div> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Incoming tickets" value={number(stats?.totalTickets)} hint={`${number(active || 0)} currently active`} icon={MessagesSquare} />
        <StatCard label="Urgent tickets" value={number(urgent.length)} hint="Critical or high priority · unresolved" icon={CircleAlert} accent="orange" />
        <StatCard label="Authors on BookLeaf" value={number(stats?.totalAuthors)} hint={`${number(stats?.totalBooks)} books in catalogue`} icon={Users} accent="blue" />
        <StatCard label="Copies sold" value={number(stats?.totalSales)} hint={`${number(stats?.publishedBooks)} published & live titles`} icon={BookOpen} accent="purple" />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-5"><div><p className="text-sm font-bold text-ink">Priority queue</p><p className="mt-1 text-[11px] text-muted">Tickets that need attention first</p></div><TextLink to="/admin/tickets">View inbox</TextLink></div>
          {urgent.length ? <div className="grid gap-3 p-4 sm:grid-cols-2">{urgent.slice(0, 4).map((ticket) => <TicketCard ticket={ticket} key={ticket.id} showAuthor />)}</div> : <div className="p-5"><EmptyState title="No urgent tickets" description="Critical and high-priority open tickets will be surfaced here." /></div>}
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-5"><p className="text-sm font-bold text-ink">Queue health</p><p className="mt-1 text-[11px] text-muted">Ticket lifecycle at a glance</p></div>
          <div className="space-y-5 p-5">
            {[['Open', stats?.counts?.Open || 0, '#e6a23c'], ['In Progress', stats?.counts?.['In Progress'] || 0, '#53a2c3'], ['Resolved', stats?.counts?.Resolved || 0, '#4a9c78'], ['Closed', stats?.counts?.Closed || 0, '#9aa49c']].map(([label, value, color]) => <div key={label}><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-ink">{label}</span><span className="text-xs font-bold text-ink">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full" style={{ width: `${stats?.totalTickets ? Math.max(3, value / stats.totalTickets * 100) : 0}%`, backgroundColor: color }} /></div></div>)}
            <div className="rounded-xl bg-[#edf2df] p-4"><div className="flex items-center gap-2 text-forest"><Coins size={16} /><span className="text-[11px] font-bold">Pending author royalties</span></div><p className="mt-2 font-display text-2xl font-bold text-forest">{currency(stats?.pendingRoyalties || 0)}</p><p className="mt-1 text-[10px] text-[#627260]">Combined pending balance in provided sample data</p></div>
          </div>
        </section>
      </div>
      <div className="mt-6 rounded-2xl border border-[#dce7c7] bg-[#edf2df] p-5 sm:flex sm:items-center sm:justify-between sm:px-7"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-forest"><Zap size={17} /></span><div><p className="text-sm font-bold text-forest">AI-assisted support is ready</p><p className="mt-1 text-xs text-[#5f715f]">New tickets are classified automatically. Generate a knowledge-base-backed draft from any ticket.</p></div></div><Link to="/admin/tickets" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-forest hover:underline sm:mt-0">Review tickets <ArrowRight size={14} /></Link></div>
    </>}
  </>;
}

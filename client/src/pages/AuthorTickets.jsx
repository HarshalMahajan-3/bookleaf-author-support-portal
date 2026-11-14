import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { EmptyState, PageTitle, StatusBadge } from '../components/UI';
import TicketCard from '../components/TicketCard';

const filters = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function AuthorTickets() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSynced, setLastSynced] = useState(new Date());

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const { data } = await api.get('/tickets'); setTickets(data.tickets); setError(''); setLastSynced(new Date()); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { if (!quiet) setLoading(false); }
  }, []);

  useEffect(() => { load(); const timer = setInterval(() => load(true), 5000); return () => clearInterval(timer); }, [load]);

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const statusMatches = filter === 'All' || ticket.status === filter;
    const queryMatches = `${ticket.id} ${ticket.subject} ${ticket.description} ${ticket.bookTitle}`.toLowerCase().includes(query.toLowerCase());
    return statusMatches && queryMatches;
  }), [tickets, filter, query]);

  return <>
    <PageTitle eyebrow="AUTHOR SUPPORT" title="Your conversations" description="Keep track of every question, update and response from the BookLeaf team." action={<Link to="/author/tickets/new" className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#245445]"><Plus size={15} />Raise a ticket</Link>} />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-white p-1">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${filter === item ? 'bg-forest text-white shadow-sm' : 'text-muted hover:bg-cream hover:text-ink'}`}>{item}{item === 'All' ? ` (${tickets.length})` : ` (${tickets.filter((t) => t.status === item).length})`}</button>)}</div>
      <div className="flex items-center gap-2"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your tickets" className="field-input h-10 w-full min-w-[210px] pl-9 text-xs sm:w-[240px]" /></div><button onClick={() => load()} title="Refresh tickets" className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-muted transition hover:bg-cream"><RefreshCw size={14} /></button></div>
    </div>
    <div className="mb-3 flex items-center justify-between text-[10px] text-muted"><span>{filtered.length} conversation{filtered.length === 1 ? '' : 's'}</span><span>Auto-refresh every 5 seconds · Synced {lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="panel h-48 animate-pulse" />)}</div> : filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)}</div> : <EmptyState title={tickets.length ? 'No tickets match your filters' : 'No support tickets yet'} description={tickets.length ? 'Try choosing another status or search term.' : 'Raise a request and the BookLeaf team will get back to you here.'} action={!tickets.length && <Link to="/author/tickets/new" className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white">Create your first ticket <Plus size={14} /></Link>} />}
  </>;
}

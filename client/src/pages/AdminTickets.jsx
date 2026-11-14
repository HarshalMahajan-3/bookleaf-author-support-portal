import { useCallback, useEffect, useMemo, useState } from 'react';
import { Filter, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { timeAgo } from '../utils';
import { EmptyState, PageTitle, PriorityBadge, StatusBadge } from '../components/UI';

const statuses = ['All statuses', 'Open', 'In Progress', 'Resolved', 'Closed'];
const priorities = ['All priorities', 'Critical', 'High', 'Medium', 'Low'];
const categories = ['All categories', 'Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('All statuses');
  const [priority, setPriority] = useState('All priorities');
  const [category, setCategory] = useState('All categories');
  const [dateRange, setDateRange] = useState('Any time');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/tickets'); setTickets(data.tickets); setError(''); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const timer = setInterval(() => api.get('/tickets').then(({ data }) => setTickets(data.tickets)).catch(() => {}), 7000); return () => clearInterval(timer); }, [load]);

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const matchesStatus = status === 'All statuses' || ticket.status === status;
    const matchesPriority = priority === 'All priorities' || ticket.priority === priority;
    const matchesCategory = category === 'All categories' || ticket.category === category;
    const age = Date.now() - new Date(ticket.createdAt).getTime();
    const matchesDate = dateRange === 'Any time' || (dateRange === 'Last 7 days' ? age <= 7 * 86400000 : age <= 30 * 86400000);
    const haystack = `${ticket.id} ${ticket.subject} ${ticket.description} ${ticket.author?.name} ${ticket.author?.email} ${ticket.bookTitle}`.toLowerCase();
    return matchesStatus && matchesPriority && matchesCategory && matchesDate && haystack.includes(query.toLowerCase());
  }), [tickets, status, priority, category, dateRange, query]);

  const reset = () => { setStatus('All statuses'); setPriority('All priorities'); setCategory('All categories'); setDateRange('Any time'); setQuery(''); };
  const hasFilters = status !== 'All statuses' || priority !== 'All priorities' || category !== 'All categories' || dateRange !== 'Any time' || query;

  return <>
    <PageTitle eyebrow="SUPPORT OPERATIONS" title="Ticket inbox" description="Triage author requests, prioritise urgent issues and keep every conversation moving." action={<button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink hover:bg-cream"><RefreshCw size={14} />Refresh queue</button>} />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="mb-5 grid gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft lg:grid-cols-[minmax(220px,1.2fr)_repeat(4,minmax(130px,0.8fr))_auto] lg:items-end">
      <div><label className="field-label" htmlFor="ticket-search">Search tickets</label><div className="relative mt-2"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input id="ticket-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, author, subject…" className="field-input h-10 pl-9 text-xs" /></div></div>
      <div><label className="field-label" htmlFor="status-filter">Status</label><select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="field-select mt-2 h-10">{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div><label className="field-label" htmlFor="priority-filter">Priority</label><select id="priority-filter" value={priority} onChange={(e) => setPriority(e.target.value)} className="field-select mt-2 h-10">{priorities.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div><label className="field-label" htmlFor="category-filter">Category</label><select id="category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className="field-select mt-2 h-10">{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
      <div><label className="field-label" htmlFor="date-filter">Created</label><select id="date-filter" value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="field-select mt-2 h-10"><option>Any time</option><option>Last 7 days</option><option>Last 30 days</option></select></div>
      <button onClick={reset} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold text-muted hover:bg-cream hover:text-ink"><Filter size={14} />Clear</button>
    </div>
    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-ink">{filtered.length} ticket{filtered.length === 1 ? '' : 's'} <span className="font-normal text-muted">in queue</span></p><p className="inline-flex items-center gap-1.5 text-[10px] text-muted"><SlidersHorizontal size={12} />Sorted by priority, then oldest first</p></div>
    <div className="panel overflow-hidden">
      {loading ? <div className="space-y-3 p-5">{[1,2,3,4].map((n) => <div key={n} className="h-16 animate-pulse rounded-xl bg-cream" />)}</div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[920px] border-collapse"><thead><tr className="table-head"><th className="px-5 py-4">Ticket</th><th className="px-4 py-4">Author</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Priority</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Assigned to</th><th className="px-5 py-4">Updated</th></tr></thead><tbody>{filtered.map((ticket) => <tr key={ticket.id} className="group cursor-pointer transition hover:bg-[#fbfcf9]" onClick={() => window.location.assign(`/tickets/${ticket.id}`)}>
          <td className="table-cell"><Link to={`/tickets/${ticket.id}`} onClick={(e) => e.stopPropagation()} className="block"><p className="text-[10px] font-bold text-muted">{ticket.id}</p><p className="mt-1 max-w-[270px] truncate text-xs font-semibold text-ink group-hover:text-forest">{ticket.subject}</p><p className="mt-1 max-w-[260px] truncate text-[10px] text-muted">{ticket.bookTitle || 'General / Account Level'}</p></Link></td>
          <td className="table-cell"><p className="text-xs font-semibold">{ticket.author?.name}</p><p className="mt-1 text-[10px] text-muted">{ticket.author?.city}</p></td>
          <td className="table-cell"><span className="inline-block max-w-[165px] truncate rounded-full bg-[#f3f6f0] px-2.5 py-1 text-[10px] font-medium text-[#526458]">{ticket.category}</span></td>
          <td className="table-cell"><PriorityBadge priority={ticket.priority} /></td><td className="table-cell"><StatusBadge status={ticket.status} /></td>
          <td className="table-cell">{ticket.assignedTo ? <span className="text-[10px] font-medium">{ticket.assignedTo === 'admin@bookleaf.com' ? 'You' : ticket.assignedTo}</span> : <span className="text-[10px] text-muted">Unassigned</span>}</td><td className="table-cell text-[10px] text-muted">{timeAgo(ticket.updatedAt)}</td>
        </tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No tickets found" description={hasFilters ? 'No tickets match these filters. Clear one or more filters to see more results.' : 'New author requests will appear in this queue.'} action={hasFilters && <button onClick={reset} className="text-xs font-semibold text-forest hover:underline">Clear all filters</button>} /></div>}
      <div className="border-t border-line px-5 py-4 text-[10px] text-muted">The queue refreshes automatically while this page is open.</div>
    </div>
  </>;
}

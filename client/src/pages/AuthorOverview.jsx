import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, CircleHelp, Coins, FileText, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { currency, date, number } from '../utils';
import { EmptyState, PageTitle, StatCard, TextLink } from '../components/UI';
import TicketCard from '../components/TicketCard';

export default function AuthorOverview() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/author/profile'), api.get('/books'), api.get('/tickets')])
      .then(([profileResponse, booksResponse, ticketResponse]) => {
        if (!active) return;
        setProfile(profileResponse.data.author);
        setBooks(booksResponse.data.books);
        setTickets(ticketResponse.data.tickets);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const totalSales = books.reduce((sum, book) => sum + (book.total_copies_sold || 0), 0);
  const earned = books.reduce((sum, book) => sum + (book.total_royalty_earned || 0), 0);
  const pending = books.reduce((sum, book) => sum + (book.royalty_pending || 0), 0);
  const activeTickets = tickets.filter((ticket) => ['Open', 'In Progress'].includes(ticket.status)).length;

  return <>
    <PageTitle eyebrow="YOUR PUBLISHING SPACE" title={`Good to see you, ${user?.name?.split(' ')[0] || 'author'}.`} description="A quick look at your books, royalties and recent conversations." action={<Link to="/author/tickets/new" className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#245445]"><Plus size={15} />New support request</Link>} />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    {loading ? <div className="panel h-48 animate-pulse bg-white" /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Books in your catalogue" value={number(books.length)} hint={`${books.filter((book) => book.status === 'Published & Live').length} published & live`} icon={BookOpen} />
        <StatCard label="Copies sold" value={number(totalSales)} hint="Across all your titles" icon={TrendingUp} accent="blue" />
        <StatCard label="Total royalty earned" value={currency(earned)} hint="Recorded in your book data" icon={Coins} accent="purple" />
        <StatCard label="Royalty pending" value={currency(pending)} hint="Awaiting payout / rollover" icon={FileText} accent="orange" />
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-5"><div><p className="text-sm font-bold text-ink">Your books</p><p className="mt-1 text-[11px] text-muted">A snapshot of your published work</p></div><TextLink to="/author/books">View all books</TextLink></div>
          {books.length ? <div className="divide-y divide-line">{books.slice(0, 4).map((book, index) => <div key={book.book_id} className="flex items-center gap-4 px-5 py-4">
            <div className={`grid h-12 w-10 shrink-0 place-items-center rounded-lg ${['bg-[#edf2df] text-forest', 'bg-[#eaf0f6] text-sky-800', 'bg-[#f7eee5] text-orange-800', 'bg-[#f0eafa] text-violet-800'][index % 4]}`}><BookOpen size={18} /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-ink">{book.title}</p><p className="mt-1 truncate text-[10px] text-muted">{book.genre} · {book.book_id}</p></div>
            <div className="hidden text-right sm:block"><p className="text-xs font-semibold text-ink">{number(book.total_copies_sold)} sold</p><p className="mt-1 text-[10px] text-muted">{currency(book.royalty_pending)} pending</p></div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${book.status === 'Published & Live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{book.status === 'Published & Live' ? 'Live' : 'In production'}</span>
          </div>)}</div> : <div className="p-5"><EmptyState title="No books found" description="Your book records will appear here once they are added to your account." /></div>}
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-5"><div><p className="text-sm font-bold text-ink">Support at a glance</p><p className="mt-1 text-[11px] text-muted">Your recent conversations</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef6dc] text-forest"><CircleHelp size={17} /></span></div>
          <div className="grid grid-cols-3 divide-x divide-line px-3 py-4"><div className="px-2 text-center"><p className="font-display text-xl font-bold text-ink">{tickets.length}</p><p className="mt-1 text-[10px] text-muted">Total</p></div><div className="px-2 text-center"><p className="font-display text-xl font-bold text-amber-600">{activeTickets}</p><p className="mt-1 text-[10px] text-muted">Active</p></div><div className="px-2 text-center"><p className="font-display text-xl font-bold text-emerald-700">{tickets.filter((t) => t.status === 'Resolved').length}</p><p className="mt-1 text-[10px] text-muted">Resolved</p></div></div>
          <div className="border-t border-line px-5 py-4">
            {tickets.length ? <div className="space-y-3">{tickets.slice(0, 2).map((ticket) => <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block rounded-xl border border-line p-3 transition hover:bg-cream"><div className="flex items-center justify-between"><span className="text-[10px] font-bold text-muted">{ticket.id}</span><span className="text-[10px] text-muted">{date(ticket.updatedAt)}</span></div><p className="mt-2 line-clamp-1 text-xs font-semibold text-ink">{ticket.subject}</p><p className="mt-2 text-[10px] text-muted">{ticket.status} · {ticket.category}</p></Link>)}</div> : <div className="py-5 text-center"><p className="text-xs font-medium text-ink">No support requests yet</p><p className="mt-1 text-[10px] text-muted">Need a hand? The team is here to help.</p></div>}
            <Link to="/author/tickets" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[11px] font-semibold text-forest transition hover:bg-cream">Open support centre <ArrowRight size={13} /></Link>
          </div>
        </section>
      </div>
      <div className="mt-7 rounded-2xl bg-[#eaf0df] p-5 sm:flex sm:items-center sm:justify-between sm:px-7"><div><p className="text-sm font-bold text-forest">Your next chapter starts here.</p><p className="mt-1 text-xs text-[#5e7160]">Need an update about a title, payment or listing? Send our team a message.</p></div><Link to="/author/tickets/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-forest shadow-sm transition hover:bg-[#f9fbf5] sm:mt-0">Contact support <ArrowRight size={14} /></Link></div>
    </>}
  </>;
}

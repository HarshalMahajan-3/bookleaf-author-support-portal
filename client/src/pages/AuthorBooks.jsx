import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, SlidersHorizontal } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { currency, date, number } from '../utils';
import { EmptyState, PageTitle, Pill } from '../components/UI';

export default function AuthorBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All books');

  useEffect(() => {
    api.get('/books').then(({ data }) => setBooks(data.books)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => books.filter((book) => {
    const matchesQuery = `${book.title} ${book.genre} ${book.isbn}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === 'All books' || (status === 'Published & Live' ? book.status === 'Published & Live' : book.status !== 'Published & Live');
    return matchesQuery && matchesStatus;
  }), [books, query, status]);

  return <>
    <PageTitle eyebrow="YOUR CATALOGUE" title="My books" description="Track publication details, sales performance and royalty balances for every title." />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div><p className="text-sm font-bold text-ink">Book catalogue <span className="ml-1 rounded-full bg-cream px-2 py-1 text-[10px] font-semibold text-muted">{books.length}</span></p><p className="mt-1 text-[10px] text-muted">All books linked to your author account</p></div>
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, genre, ISBN" className="field-input h-10 min-w-[220px] pl-9 text-xs" /></div><div className="relative"><SlidersHorizontal size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="field-select h-10 min-w-[155px] pl-9"><option>All books</option><option>Published & Live</option><option>In production</option></select></div></div>
      </div>
      {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-cream" />)}</div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] border-collapse"><thead><tr className="table-head"><th className="px-5 py-4">Book title</th><th className="px-4 py-4">ISBN / Genre</th><th className="px-4 py-4">Published</th><th className="px-4 py-4 text-right">MRP</th><th className="px-4 py-4 text-right">Copies sold</th><th className="px-4 py-4 text-right">Royalty earned</th><th className="px-4 py-4 text-right">Paid</th><th className="px-5 py-4 text-right">Pending</th></tr></thead><tbody>{filtered.map((book) => <tr key={book.book_id} className="transition hover:bg-[#fbfcf9]">
        <td className="table-cell"><div className="flex items-center gap-3"><span className="grid h-10 w-8 shrink-0 place-items-center rounded-md bg-[#edf2df] text-forest"><BookOpen size={16} /></span><div><p className="max-w-[200px] truncate text-xs font-semibold">{book.title}</p><div className="mt-1"><Pill tone={book.status === 'Published & Live' ? 'green' : 'orange'}>{book.status}</Pill></div></div></div></td>
        <td className="table-cell"><p className="font-medium">{book.isbn || 'Not assigned'}</p><p className="mt-1 max-w-[145px] truncate text-[10px] text-muted">{book.genre}</p></td>
        <td className="table-cell">{date(book.publication_date)}</td><td className="table-cell text-right font-medium">{book.mrp == null ? '—' : currency(book.mrp)}</td><td className="table-cell text-right">{number(book.total_copies_sold)}</td><td className="table-cell text-right font-semibold">{currency(book.total_royalty_earned)}</td><td className="table-cell text-right">{currency(book.royalty_paid)}</td><td className="table-cell text-right"><span className={book.royalty_pending > 0 ? 'font-bold text-orange-700' : 'font-semibold text-ink'}>{currency(book.royalty_pending)}</span></td>
      </tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No matching books" description="Try a different search or status filter." /></div>}
      <div className="flex flex-col gap-1 border-t border-line px-5 py-4 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between"><span>Showing {filtered.length} of {books.length} titles</span><span>Royalty figures are shown as provided in your account data.</span></div>
    </div>
  </>;
}

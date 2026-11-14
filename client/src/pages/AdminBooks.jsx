import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { currency, date, number } from '../utils';
import { EmptyState, PageTitle, Pill } from '../components/UI';

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/books').then(({ data }) => setBooks(data.books)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => books.filter((book) => `${book.title} ${book.authorName} ${book.genre} ${book.isbn || ''}`.toLowerCase().includes(query.toLowerCase())), [books, query]);
  const pending = books.reduce((sum, book) => sum + (book.royalty_pending || 0), 0);
  return <>
    <PageTitle eyebrow="PUBLISHING CATALOGUE" title="Book catalogue" description="Browse the sample publishing records across all BookLeaf authors." />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="mb-5 grid gap-4 sm:grid-cols-3"><div className="panel p-4"><p className="text-[10px] font-semibold text-muted">Total book records</p><p className="mt-2 font-display text-2xl font-bold text-ink">{number(books.length)}</p></div><div className="panel p-4"><p className="text-[10px] font-semibold text-muted">Published & live</p><p className="mt-2 font-display text-2xl font-bold text-emerald-700">{number(books.filter((book) => book.status === 'Published & Live').length)}</p></div><div className="panel p-4"><p className="text-[10px] font-semibold text-muted">Pending royalties</p><p className="mt-2 font-display text-2xl font-bold text-orange-700">{currency(pending)}</p></div></div>
    <div className="panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf2df] text-forest"><BookOpen size={18} /></span><div><p className="text-sm font-bold text-ink">All books</p><p className="mt-1 text-[10px] text-muted">Across {new Set(books.map((book) => book.authorId)).size} author accounts</p></div></div><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, author, ISBN" className="field-input h-10 min-w-[235px] pl-9 text-xs" /></div></div>
      {loading ? <div className="space-y-3 p-5">{[1,2,3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-cream" />)}</div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse"><thead><tr className="table-head"><th className="px-5 py-4">Title / Author</th><th className="px-4 py-4">Genre</th><th className="px-4 py-4">Publication date</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">Copies sold</th><th className="px-5 py-4 text-right">Royalty pending</th></tr></thead><tbody>{filtered.map((book) => <tr key={book.book_id} className="hover:bg-[#fbfcf9]"><td className="table-cell"><p className="text-xs font-semibold">{book.title}</p><p className="mt-1 text-[10px] text-muted">{book.authorName} · {book.book_id}</p></td><td className="table-cell">{book.genre}</td><td className="table-cell">{date(book.publication_date)}</td><td className="table-cell"><Pill tone={book.status === 'Published & Live' ? 'green' : 'orange'}>{book.status}</Pill></td><td className="table-cell text-right">{number(book.total_copies_sold)}</td><td className="table-cell text-right font-semibold">{currency(book.royalty_pending)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No matching books" description="Try another search term." /></div>}
      <div className="border-t border-line px-5 py-4 text-[10px] text-muted">Records are read from the provided sample dataset. This screen is read-only.</div>
    </div>
  </>;
}

import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { currency, date, number } from '../utils';
import { EmptyState, PageTitle } from '../components/UI';

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/admin/authors').then(({ data }) => setAuthors(data.authors)).catch((err) => setError(getErrorMessage(err))).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => authors.filter((author) => `${author.name} ${author.email} ${author.city}`.toLowerCase().includes(query.toLowerCase())), [authors, query]);
  return <>
    <PageTitle eyebrow="AUTHOR RELATIONSHIPS" title="Authors" description="A consolidated view of the authors and their publishing activity on BookLeaf." />
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf2df] text-forest"><Users size={18} /></span><div><p className="text-sm font-bold text-ink">Author directory</p><p className="mt-1 text-[10px] text-muted">{authors.length} author accounts in the supplied dataset</p></div></div><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or city" className="field-input h-10 min-w-[230px] pl-9 text-xs" /></div></div>
      {loading ? <div className="space-y-3 p-5">{[1,2,3].map((n) => <div key={n} className="h-14 animate-pulse rounded-xl bg-cream" />)}</div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] border-collapse"><thead><tr className="table-head"><th className="px-5 py-4">Author</th><th className="px-4 py-4">Location</th><th className="px-4 py-4">Joined</th><th className="px-4 py-4 text-right">Books</th><th className="px-4 py-4 text-right">Copies sold</th><th className="px-5 py-4 text-right">Pending royalties</th></tr></thead><tbody>{filtered.map((author) => <tr key={author.authorId} className="hover:bg-[#fbfcf9]"><td className="table-cell"><p className="text-xs font-semibold">{author.name}</p><p className="mt-1 text-[10px] text-muted">{author.email} · {author.phone}</p></td><td className="table-cell">{author.city}</td><td className="table-cell">{date(author.joinedDate)}</td><td className="table-cell text-right">{author.booksCount}</td><td className="table-cell text-right">{number(author.copiesSold)}</td><td className="table-cell text-right font-semibold">{currency(author.royaltyPending)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="No authors found" description="Try another search term." /></div>}
      <div className="border-t border-line px-5 py-4 text-[10px] text-muted">Author contact details are available in the source records; this directory displays only operational summary fields.</div>
    </div>
  </>;
}

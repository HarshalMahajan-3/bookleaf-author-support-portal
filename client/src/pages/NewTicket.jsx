import { useEffect, useState } from 'react';
import { ArrowLeft, Paperclip, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { PageTitle, PrimaryButton, SecondaryButton } from '../components/UI';

export default function NewTicket() {
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { api.get('/books').then(({ data }) => setBooks(data.books)).catch(() => {}); }, []);

  const submit = async (event) => {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await api.post('/tickets', { bookId: bookId || null, subject, description, attachmentName: file?.name || null });
      navigate(`/tickets/${data.ticket.id}`, { state: { created: true, classification: data.classification } });
    } catch (err) { setError(getErrorMessage(err, 'Unable to create this request.')); }
    finally { setLoading(false); }
  };

  return <>
    <div className="mb-5"><Link to="/author/tickets" className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-forest"><ArrowLeft size={14} />Back to support tickets</Link></div>
    <PageTitle eyebrow="WE'RE HERE TO HELP" title="Raise a support request" description="Share a few details so our team can route your question to the right people." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={submit} className="panel p-5 sm:p-7">
        <div className="mb-6 border-b border-line pb-5"><p className="text-sm font-bold text-ink">Tell us what you need help with</p><p className="mt-1 text-[11px] text-muted">Fields marked with an asterisk are required.</p></div>
        <div className="space-y-5">
          <div><label className="field-label" htmlFor="book">Which book is this about?</label><select id="book" value={bookId} onChange={(e) => setBookId(e.target.value)} className="field-select mt-2 h-11"><option value="">General / Account Level</option>{books.map((book) => <option key={book.book_id} value={book.book_id}>{book.title} · {book.status}</option>)}</select><p className="mt-1.5 text-[10px] text-muted">Choose a title or keep this as a general account question.</p></div>
          <div><label className="field-label" htmlFor="subject">Subject <span className="text-rose-500">*</span></label><input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required minLength={4} maxLength={150} placeholder="e.g. Question about my royalty payout" className="field-input mt-2" /></div>
          <div><label className="field-label" htmlFor="description">Describe your question <span className="text-rose-500">*</span></label><textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required minLength={15} maxLength={3000} rows={7} placeholder="Tell us what happened and what you need help with. Add any relevant dates, order details or screenshots where possible." className="field-input mt-2 resize-y leading-6" /><div className="mt-1 flex justify-between text-[10px] text-muted"><span>At least 15 characters</span><span>{description.length}/3000</span></div></div>
          <div><label className="field-label">Attachment <span className="font-normal text-muted">(optional · UI preview only)</span></label><label className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#ccd6c9] bg-[#fbfcf9] px-4 py-4 transition hover:border-[#9bb276]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf2df] text-forest"><Paperclip size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{file?.name || 'Choose a file to attach'}</span><span className="mt-1 block text-[10px] text-muted">{file ? `${(file.size / 1024).toFixed(0)} KB · file name will be added to the ticket` : 'PDF, JPG or PNG · Actual upload is not enabled in this demo'}</span></span><span className="rounded-lg border border-line bg-white px-3 py-2 text-[10px] font-semibold text-muted">Browse</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label></div>
        </div>
        {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
        <div className="mt-7 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end"><SecondaryButton type="button" onClick={() => navigate('/author/tickets')}>Cancel</SecondaryButton><PrimaryButton type="submit" loading={loading}>Submit support request</PrimaryButton></div>
      </form>
      <aside className="space-y-4">
        <div className="rounded-2xl bg-[#17382f] p-5 text-white"><span className="grid h-10 w-10 place-items-center rounded-xl bg-leaf text-forest"><Sparkles size={18} /></span><h3 className="mt-4 text-sm font-bold">Smart ticket routing</h3><p className="mt-2 text-xs leading-6 text-white/65">Your request will be automatically sorted into a support category and given an initial priority so the right team can review it.</p><div className="mt-4 border-t border-white/15 pt-4 text-[10px] text-leaf">AI-assisted · Human-reviewed</div></div>
        <div className="panel p-5"><p className="text-xs font-bold text-ink">What happens next?</p><div className="mt-4 space-y-4">{[['01','We receive your request','Your ticket is added to the support queue.'],['02','The team reviews it','A support representative checks the details.'],['03','You get an update','Responses appear in this portal.']].map(([n,title,desc]) => <div className="flex gap-3" key={n}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-cream text-[10px] font-bold text-forest">{n}</span><div><p className="text-[11px] font-semibold text-ink">{title}</p><p className="mt-1 text-[10px] leading-5 text-muted">{desc}</p></div></div>)}</div></div>
      </aside>
    </div>
  </>;
}

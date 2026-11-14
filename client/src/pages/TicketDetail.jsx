import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bot, CheckCheck, Clock3, FileText, MessageCircle, Paperclip, RefreshCw, Send, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import { date, timeAgo } from '../utils';
import { PageTitle, Pill, PriorityBadge, PrimaryButton, SecondaryButton, StatusBadge } from '../components/UI';

const categoryOptions = ['Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'];
const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];
const statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed'];

function MessageBubble({ message }) {
  const fromAdmin = message.senderRole === 'admin';
  return <div className={`flex gap-3 ${fromAdmin ? '' : 'flex-row-reverse'}`}>
    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${fromAdmin ? 'bg-[#e8efdf] text-forest' : 'bg-slate-100 text-slate-600'}`}>{fromAdmin ? <ShieldCheck size={15} /> : <UserRound size={15} />}</div>
    <div className={`max-w-[88%] rounded-2xl p-4 ${fromAdmin ? 'rounded-tl-md bg-[#f2f6ec]' : 'rounded-tr-md bg-[#f4f6f8]'}`}>
      <div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-bold text-ink">{message.senderName || (fromAdmin ? 'BookLeaf Support' : 'You')}</p><span className="text-[9px] text-muted">{date(message.createdAt, { day: '2-digit', month: 'short' })} · {new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div>
      <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[#435047]">{message.body}</p>
    </div>
  </div>;
}

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [draftSource, setDraftSource] = useState('');
  const [draftWarning, setDraftWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(location.state?.created ? 'Your support request was submitted successfully.' : '');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try { const { data } = await api.get(`/tickets/${ticketId}`); setTicket(data.ticket); setError(''); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { if (!quiet) setLoading(false); }
  }, [ticketId]);

  useEffect(() => { load(); const timer = setInterval(() => load(true), 5000); return () => clearInterval(timer); }, [load]);

  const updateFields = async (updates) => {
    setSaving(true); setNotice('');
    try { const { data } = await api.patch(`/tickets/${ticketId}`, updates); setTicket(data.ticket); setNotice('Ticket details updated.'); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const sendMessage = async (event) => {
    event.preventDefault(); if (!reply.trim()) return;
    setSending(true); setError(''); setNotice('');
    try {
      const { data } = await api.post(`/tickets/${ticketId}/messages`, { body: reply.trim(), isInternal: isAdmin && internal });
      setTicket(data.ticket); setReply(''); setNotice(internal ? 'Internal note saved.' : 'Your message has been sent.');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSending(false); }
  };

  const generateDraft = async () => {
    setDrafting(true); setError(''); setDraftWarning('');
    try { const { data } = await api.post(`/tickets/${ticketId}/ai-draft`); setReply(data.draft); setDraftSource(data.source); if (data.warning) setDraftWarning('AI service was unavailable; a knowledge-base fallback draft was prepared.'); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setDrafting(false); }
  };

  const assignToMe = () => updateFields({ assignedTo: user.email });
  const messages = ticket?.messages || [];
  const notes = ticket?.notes || [];
  const backTo = isAdmin ? '/admin/tickets' : '/author/tickets';

  if (loading) return <div className="space-y-5"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="grid gap-5 xl:grid-cols-[1fr_320px]"><div className="panel h-[500px] animate-pulse" /><div className="panel h-80 animate-pulse" /></div></div>;
  if (!ticket) return <><PageTitle eyebrow="SUPPORT" title="Ticket not found" description={error || 'This ticket may have been removed or you may not have access to it.'} /><SecondaryButton onClick={() => navigate(backTo)}><ArrowLeft size={14} />Back to tickets</SecondaryButton></>;

  return <>
    <div className="mb-5"><Link to={backTo} className="inline-flex items-center gap-2 text-xs font-semibold text-muted transition hover:text-forest"><ArrowLeft size={14} />Back to {isAdmin ? 'ticket inbox' : 'your tickets'}</Link></div>
    <PageTitle eyebrow={`${ticket.id} · ${ticket.bookTitle || 'GENERAL QUERY'}`} title={ticket.subject} description={`Created ${date(ticket.createdAt)} · Last updated ${timeAgo(ticket.updatedAt)}`} action={<div className="flex flex-wrap items-center gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>} />
    {notice && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"><CheckCheck size={15} />{notice}</div>}
    {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</div>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-2"><MessageCircle size={16} className="text-forest" /><p className="text-xs font-bold text-ink">Conversation</p></div><span className="text-[10px] text-muted">{messages.length + 1} message{messages.length ? 's' : ''}</span></div>
          <div className="space-y-5 p-5">
            <div className="flex gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><UserRound size={15} /></div><div className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#f4f6f8] p-4"><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-bold text-ink">{isAdmin ? ticket.author?.name : 'You'}</p><Pill>Original request</Pill><span className="text-[9px] text-muted">{date(ticket.createdAt)} · {new Date(ticket.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[#435047]">{ticket.description}</p>{ticket.attachmentName && <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[10px] text-muted"><Paperclip size={12} />{ticket.attachmentName}<span className="text-[9px] text-orange-600">(name only)</span></div>}</div></div>
            {messages.filter((message) => !message.isInternal).map((message) => <MessageBubble key={message.id} message={message} />)}
            {messages.filter((message) => message.isInternal).length > 0 && isAdmin && <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3 text-[10px] text-amber-800">Internal messages are hidden from the author.</div>}
          </div>
          {ticket.status !== 'Closed' && ticket.status !== 'Resolved' && <form onSubmit={sendMessage} className="border-t border-line bg-[#fbfcf9] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-ink">{isAdmin ? 'Write a response' : 'Add a message'}</p>{isAdmin && <div className="flex items-center gap-2"><button type="button" onClick={() => setInternal(false)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${!internal ? 'bg-forest text-white' : 'bg-white text-muted ring-1 ring-line'}`}>Public reply</button><button type="button" onClick={() => setInternal(true)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${internal ? 'bg-amber-600 text-white' : 'bg-white text-muted ring-1 ring-line'}`}>Internal note</button></div>}</div>
            {isAdmin && <div className="mb-3 flex flex-wrap items-center gap-2"><button type="button" onClick={generateDraft} disabled={drafting} className="inline-flex items-center gap-2 rounded-lg border border-[#cbd9b7] bg-[#f0f5e6] px-3 py-2 text-[10px] font-bold text-forest transition hover:bg-[#e7efd8] disabled:opacity-50"><Sparkles size={13} />{drafting ? 'Generating draft…' : 'Generate AI draft'}</button>{draftSource && <span className="text-[9px] text-muted">{draftSource === 'openai' ? 'AI-generated' : 'Knowledge-base fallback'}</span>}{draftWarning && <span className="basis-full text-[10px] text-amber-700">{draftWarning}</span>}</div>}
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} maxLength={3000} placeholder={internal ? 'Add a note for the BookLeaf team. The author will not see this.' : (isAdmin ? 'Write a thoughtful, specific response to the author…' : 'Add any details or follow-up questions…')} className="field-input resize-y leading-6" />
            <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-[10px] text-muted">{internal ? 'Only visible to BookLeaf admins.' : 'The author and support team can see this message.'}</span><PrimaryButton type="submit" loading={sending} disabled={!reply.trim()}><Send size={13} />{internal ? 'Save internal note' : 'Send message'}</PrimaryButton></div>
          </form>}
          {(ticket.status === 'Closed' || ticket.status === 'Resolved') && <div className="border-t border-line bg-[#fbfcf9] p-5"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCheck size={15} />This ticket is {ticket.status.toLowerCase()}.</div><p className="mt-1 text-[10px] text-muted">{isAdmin ? 'You can reopen it by changing the status in the ticket controls.' : 'Need more help? Raise a new support ticket from your support centre.'}</p></div>}
        </section>
        {isAdmin && notes.length > 0 && <section className="panel p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck size={15} className="text-amber-600" /><p className="text-xs font-bold text-ink">Internal notes</p><Pill tone="orange">Admin only</Pill></div><div className="space-y-3">{notes.map((note) => <div key={note.id} className="rounded-xl bg-amber-50/70 p-3"><div className="flex items-center justify-between"><p className="text-[10px] font-bold text-amber-900">{note.authorName || 'BookLeaf team'}</p><span className="text-[9px] text-amber-700">{timeAgo(note.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-amber-900">{note.body}</p></div>)}</div></section>}
      </div>

      <aside className="space-y-4">
        {isAdmin ? <section className="panel p-5"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-bold text-ink">Ticket controls</p><span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Admin</span></div><div className="space-y-4">
          <div><label className="field-label" htmlFor="ticket-status">Status</label><select id="ticket-status" value={ticket.status} disabled={saving} onChange={(e) => updateFields({ status: e.target.value })} className="field-select mt-2 h-10">{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="field-label" htmlFor="ticket-category">Category <span className="ml-1 text-[9px] font-normal text-muted">AI suggestion can be overridden</span></label><select id="ticket-category" value={ticket.category} disabled={saving} onChange={(e) => updateFields({ category: e.target.value })} className="field-select mt-2 h-10">{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="field-label" htmlFor="ticket-priority">Priority</label><select id="ticket-priority" value={ticket.priority} disabled={saving} onChange={(e) => updateFields({ priority: e.target.value })} className="field-select mt-2 h-10">{priorityOptions.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div><label className="field-label" htmlFor="ticket-assignee">Assigned to</label><select id="ticket-assignee" value={ticket.assignedTo || ''} disabled={saving} onChange={(e) => updateFields({ assignedTo: e.target.value || null })} className="field-select mt-2 h-10"><option value="">Unassigned</option><option value={user.email}>Me · {user.name}</option></select></div>
          <SecondaryButton className="w-full" disabled={saving} onClick={assignToMe}><UserRound size={14} />Assign to me</SecondaryButton>
          <p className="text-[9px] leading-4 text-muted">Changes are saved immediately. Category and priority can be manually overridden.</p>
        </div></section> : <section className="panel p-5"><p className="text-xs font-bold text-ink">Request details</p><div className="mt-4 space-y-4"><div><p className="text-[10px] text-muted">Book</p><p className="mt-1 text-xs font-semibold text-ink">{ticket.bookTitle || 'General / Account Level'}</p></div><div><p className="text-[10px] text-muted">Category</p><p className="mt-1 text-xs font-semibold text-ink">{ticket.category}</p></div><div><p className="text-[10px] text-muted">Priority</p><div className="mt-1"><PriorityBadge priority={ticket.priority} /></div></div><div><p className="text-[10px] text-muted">Created</p><p className="mt-1 text-xs font-semibold text-ink">{date(ticket.createdAt)}</p></div></div></section>}
        <section className="panel p-5"><div className="flex items-center gap-2"><Clock3 size={15} className="text-forest" /><p className="text-xs font-bold text-ink">Ticket activity</p></div><div className="mt-4 space-y-4"><div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-forest" /><div><p className="text-[10px] font-semibold text-ink">Ticket created</p><p className="mt-1 text-[10px] text-muted">{date(ticket.createdAt)} · {timeAgo(ticket.createdAt)}</p></div></div><div className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-500" /><div><p className="text-[10px] font-semibold text-ink">Last activity</p><p className="mt-1 text-[10px] text-muted">{date(ticket.updatedAt)} · {timeAgo(ticket.updatedAt)}</p></div></div></div></section>
        {isAdmin && <section className="rounded-2xl bg-[#17382f] p-5 text-white"><div className="flex items-center gap-2 text-leaf"><Bot size={16} /><p className="text-xs font-bold">AI assistance</p></div><p className="mt-2 text-[11px] leading-5 text-white/65">Drafts use BookLeaf policy guidance and the relevant ticket details. Review every draft before sending it to an author.</p><div className="mt-3 flex items-center gap-2 text-[9px] text-leaf"><RefreshCw size={11} />Human approval required</div></section>}
      </aside>
    </div>
  </>;
}

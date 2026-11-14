import { ArrowUpRight, Clock3, MessageCircle, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './UI';
import { date, timeAgo } from '../utils';

export default function TicketCard({ ticket, showAuthor = false }) {
  return <Link to={`/tickets/${ticket.id}`} className="group block rounded-xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#cbd8c4] hover:shadow-soft">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-[10px] font-bold tracking-wide text-muted">{ticket.id}</span><span className="h-1 w-1 rounded-full bg-[#c5cec5]" /><span className="text-[10px] text-muted">{timeAgo(ticket.updatedAt || ticket.createdAt)}</span></div><StatusBadge status={ticket.status} /></div>
    <h3 className="mt-3 line-clamp-1 text-[13px] font-semibold text-ink group-hover:text-forest">{ticket.subject}</h3>
    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted">{ticket.description}</p>
    <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f3f6f0] px-2.5 py-1 text-[10px] font-medium text-[#526458]">{ticket.category}</span><PriorityBadge priority={ticket.priority} /></div>
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[10px] text-muted"><span className="inline-flex items-center gap-1.5">{showAuthor ? <UserRound size={12} /> : <Clock3 size={12} />}{showAuthor ? ticket.author?.name || 'Author' : date(ticket.createdAt)}</span><span className="inline-flex items-center gap-1.5">{ticket.messages?.filter((m) => !m.isInternal).length || 0}<MessageCircle size={12} /><ArrowUpRight size={13} className="ml-1 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div>
  </Link>;
}

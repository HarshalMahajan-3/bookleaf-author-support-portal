import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(__dirname, '../data');
const samplePath = path.join(DATA_DIR, 'sample-data.json');
const ticketsPath = path.join(DATA_DIR, 'tickets.json');

export const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
export const authors = sampleData.authors;
export const categories = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];
export const priorities = ['Critical', 'High', 'Medium', 'Low'];
export const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

const now = new Date();
const isoDaysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();

function makeDemoTickets() {
  return [
    {
      id: 'BL-1001', authorId: 'AUTH001', bookId: 'BK001', bookTitle: 'Whispers of the Ganges',
      subject: 'Pending royalty amount on my dashboard',
      description: 'Hello team, I can see ₹3,570 listed as pending royalty for Whispers of the Ganges. Could you please confirm when this amount will be paid and whether I need to do anything from my side?',
      category: 'Royalty & Payments', priority: 'High', status: 'Open',
      messages: [], notes: [], assignedTo: null, attachmentName: null,
      createdAt: isoDaysAgo(3), updatedAt: isoDaysAgo(3), demo: true,
    },
    {
      id: 'BL-1002', authorId: 'AUTH002', bookId: 'BK003', bookTitle: 'Code & Karma',
      subject: 'ISBN displayed incorrectly on Amazon',
      description: 'The ISBN visible on the Amazon listing appears different from the ISBN printed on my physical copy. Please investigate this because readers may be ordering the wrong edition.',
      category: 'ISBN & Metadata Issues', priority: 'Critical', status: 'In Progress',
      messages: [{ id: 'MSG-1002-1', senderRole: 'admin', senderName: 'BookLeaf Support', body: 'Thank you for flagging this, Rohit. We understand how important accurate book metadata is. We have escalated the ISBN mismatch to our production team for verification and will update you within 48 hours.', isInternal: false, createdAt: isoDaysAgo(1) }],
      notes: [{ id: 'NOTE-1002-1', body: 'Verify the Amazon marketplace record against the production master before requesting a metadata correction.', createdAt: isoDaysAgo(1), authorName: 'BookLeaf Support' }],
      assignedTo: 'admin@bookleaf.com', attachmentName: null,
      createdAt: isoDaysAgo(4), updatedAt: isoDaysAgo(1), demo: true,
    },
    {
      id: 'BL-1003', authorId: 'AUTH003', bookId: 'BK005', bookTitle: 'Between Two Temples',
      subject: 'Blurry images and uneven page alignment',
      description: 'I received my author copies, but some images look blurry and a few pages are misaligned. What should I do to get this corrected?',
      category: 'Printing & Quality', priority: 'High', status: 'Open',
      messages: [], notes: [], assignedTo: null, attachmentName: null,
      createdAt: isoDaysAgo(2), updatedAt: isoDaysAgo(2), demo: true,
    },
    {
      id: 'BL-1004', authorId: 'AUTH005', bookId: 'BK009', bookTitle: 'Letters from Lakshadweep',
      subject: 'Book showing unavailable on Amazon US',
      description: 'My book is live on the BookLeaf Store but the Amazon US page is showing Currently Unavailable. Can you check the listing?',
      category: 'Distribution & Availability', priority: 'Medium', status: 'Resolved',
      messages: [{ id: 'MSG-1004-1', senderRole: 'admin', senderName: 'BookLeaf Support', body: 'Thanks for bringing this to our attention. This can happen when marketplace stock data is out of sync. Our distribution team has completed a re-sync request; marketplace availability can take 24–48 hours to reflect.', isInternal: false, createdAt: isoDaysAgo(1) }],
      notes: [], assignedTo: 'admin@bookleaf.com', attachmentName: null,
      createdAt: isoDaysAgo(5), updatedAt: isoDaysAgo(1), demo: true,
    },
  ];
}

let tickets = [];
function loadTickets() {
  if (fs.existsSync(ticketsPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
      return Array.isArray(parsed) ? parsed : makeDemoTickets();
    } catch {
      return makeDemoTickets();
    }
  }
  return makeDemoTickets();
}

tickets = loadTickets();

export function getTickets() { return tickets; }
export function findAuthor(authorId) { return authors.find((author) => author.author_id === authorId); }
export function findBook(authorId, bookId) {
  return findAuthor(authorId)?.books.find((book) => book.book_id === bookId);
}
export function findTicket(ticketId) { return tickets.find((ticket) => ticket.id === ticketId); }
export function saveTickets() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryPath = `${ticketsPath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(tickets, null, 2));
  fs.renameSync(temporaryPath, ticketsPath);
}
export function addTicket(ticket) {
  tickets.unshift(ticket);
  saveTickets();
  return ticket;
}
export function updateTicket(ticketId, updates) {
  const ticket = findTicket(ticketId);
  if (!ticket) return null;
  Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
  saveTickets();
  return ticket;
}
export function appendMessage(ticketId, message) {
  const ticket = findTicket(ticketId);
  if (!ticket) return null;
  ticket.messages.push(message);
  ticket.updatedAt = new Date().toISOString();
  saveTickets();
  return ticket;
}
export function appendNote(ticketId, note) {
  const ticket = findTicket(ticketId);
  if (!ticket) return null;
  ticket.notes.push(note);
  ticket.updatedAt = new Date().toISOString();
  saveTickets();
  return ticket;
}
export function publicTicket(ticket, includeInternal = false) {
  const author = findAuthor(ticket.authorId);
  const { notes = [], ...publicFields } = ticket;
  return {
    ...publicFields,
    messages: includeInternal ? (publicFields.messages || []) : (publicFields.messages || []).filter((message) => !message.isInternal),
    ...(includeInternal ? { notes } : {}),
    author: author ? { authorId: author.author_id, name: author.name, email: author.email, city: author.city } : null,
  };
}

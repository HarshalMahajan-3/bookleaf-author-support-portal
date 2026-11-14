import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  authors, categories, priorities, statuses, findAuthor, findBook,
  getTickets, findTicket, addTicket, updateTicket, appendMessage,
  appendNote, publicTicket,
} from './store.js';
import { classifyTicket, generateResponseDraft } from './ai.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-only-change-this-secret';
const adminAccount = { email: 'admin@bookleaf.com', passwordHash: bcrypt.hashSync('admin@1234', 10), role: 'admin', name: 'BookLeaf Support' };
const authorPasswordHash = bcrypt.hashSync('author@1234', 10);
const authorAccounts = new Map(authors.map((author) => [author.email.toLowerCase(), {
  email: author.email.toLowerCase(), passwordHash: authorPasswordHash, role: 'author',
  name: author.name, authorId: author.author_id,
}]));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 25, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many login attempts. Please try again in 15 minutes.' } });
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function issueToken(account) {
  return jwt.sign({ sub: account.email, role: account.role, authorId: account.authorId || null, name: account.name }, JWT_SECRET, { expiresIn: '12h' });
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { email: payload.sub, role: payload.role, authorId: payload.authorId, name: payload.name };
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
}

const requireAdmin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access is required for this action.' });
const requireAuthor = (req, res, next) => req.user?.role === 'author' ? next() : res.status(403).json({ error: 'Author access is required for this action.' });
const idParam = z.string().min(1).max(40);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'bookleaf-api', timestamp: new Date().toISOString() }));

app.post('/api/auth/login', loginLimiter, asyncHandler(async (req, res) => {
  const schema = z.object({ email: z.string().email().max(180), password: z.string().min(1).max(120) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.', details: parsed.error.flatten() });
  const email = parsed.data.email.toLowerCase().trim();
  const account = email === adminAccount.email ? adminAccount : authorAccounts.get(email);
  if (!account || !(await bcrypt.compare(parsed.data.password, account.passwordHash))) {
    return res.status(401).json({ error: 'The email or password you entered is incorrect.' });
  }
  const author = account.role === 'author' ? findAuthor(account.authorId) : null;
  const user = { email: account.email, role: account.role, name: account.name, authorId: account.authorId || null, city: author?.city || null };
  return res.json({ token: issueToken(account), user });
}));

app.get('/api/auth/me', authenticate, (req, res) => {
  const author = req.user.role === 'author' ? findAuthor(req.user.authorId) : null;
  if (req.user.role === 'author' && !author) return res.status(401).json({ error: 'Author account not found.' });
  return res.json({ user: { ...req.user, city: author?.city || null } });
});

app.get('/api/author/profile', authenticate, requireAuthor, (req, res) => {
  const author = findAuthor(req.user.authorId);
  if (!author) return res.status(404).json({ error: 'Author profile not found.' });
  const { books, ...profile } = author;
  return res.json({ author: profile, booksCount: books.length });
});

app.get('/api/books', authenticate, (req, res) => {
  if (req.user.role === 'author') {
    const author = findAuthor(req.user.authorId);
    return res.json({ books: author?.books || [] });
  }
  return res.json({ books: authors.flatMap((author) => author.books.map((book) => ({ ...book, authorName: author.name, authorId: author.author_id }))) });
});

app.get('/api/tickets', authenticate, (req, res) => {
  const { status, category, priority, q } = req.query;
  let rows = getTickets();
  if (req.user.role === 'author') rows = rows.filter((ticket) => ticket.authorId === req.user.authorId);
  if (status && statuses.includes(status)) rows = rows.filter((ticket) => ticket.status === status);
  if (category && categories.includes(category)) rows = rows.filter((ticket) => ticket.category === category);
  if (priority && priorities.includes(priority)) rows = rows.filter((ticket) => ticket.priority === priority);
  if (q) {
    const needle = String(q).toLowerCase().slice(0, 100);
    rows = rows.filter((ticket) => {
      const author = findAuthor(ticket.authorId);
      return [ticket.id, ticket.subject, ticket.description, ticket.bookTitle, author?.name, author?.email].some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  rows = [...rows].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || new Date(a.createdAt) - new Date(b.createdAt));
  return res.json({ tickets: rows.map((ticket) => publicTicket(ticket, req.user.role === 'admin')) });
});

app.post('/api/tickets', authenticate, requireAuthor, asyncHandler(async (req, res) => {
  const schema = z.object({
    bookId: z.string().max(30).nullable().optional(),
    subject: z.string().trim().min(4, 'Subject must have at least 4 characters.').max(150),
    description: z.string().trim().min(15, 'Please add at least 15 characters so the team can help.').max(3000),
    attachmentName: z.string().max(180).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please check the ticket details.', details: parsed.error.flatten() });
  const author = findAuthor(req.user.authorId);
  const book = parsed.data.bookId ? findBook(author.author_id, parsed.data.bookId) : null;
  if (parsed.data.bookId && !book) return res.status(400).json({ error: 'The selected book does not belong to your account.' });
  const classification = await classifyTicket(parsed.data.subject, parsed.data.description);
  const latestNumber = getTickets().reduce((max, ticket) => Math.max(max, Number(ticket.id.replace('BL-', '')) || 1000), 1000);
  const ticket = {
    id: `BL-${latestNumber + 1}`, authorId: author.author_id, bookId: book?.book_id || null,
    bookTitle: book?.title || 'General / Account Level', subject: parsed.data.subject,
    description: parsed.data.description, attachmentName: parsed.data.attachmentName || null,
    category: classification.category, priority: classification.priority,
    aiClassification: classification, status: 'Open', messages: [], notes: [], assignedTo: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), demo: false,
  };
  addTicket(ticket);
  return res.status(201).json({ ticket: publicTicket(ticket, false), classification: { category: ticket.category, priority: ticket.priority, source: classification.source } });
}));

app.get('/api/tickets/:id', authenticate, (req, res) => {
  if (!idParam.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid ticket ID.' });
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (req.user.role === 'author' && ticket.authorId !== req.user.authorId) return res.status(403).json({ error: 'You do not have access to this ticket.' });
  const result = publicTicket(ticket, req.user.role === 'admin');
  if (req.user.role === 'author') result.messages = (result.messages || []).filter((message) => !message.isInternal);
  return res.json({ ticket: result });
});

app.patch('/api/tickets/:id', authenticate, requireAdmin, (req, res) => {
  const schema = z.object({
    status: z.enum(statuses).optional(),
    category: z.enum(categories).optional(),
    priority: z.enum(priorities).optional(),
    assignedTo: z.string().email().nullable().optional(),
  }).refine((value) => Object.keys(value).length > 0, 'At least one ticket field is required.');
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid ticket update.', details: parsed.error.flatten() });
  const ticket = updateTicket(req.params.id, parsed.data);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  return res.json({ ticket: publicTicket(ticket, true) });
});

app.post('/api/tickets/:id/messages', authenticate, (req, res) => {
  const schema = z.object({ body: z.string().trim().min(2, 'Message is too short.').max(3000), isInternal: z.boolean().optional().default(false) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Please enter a valid message.', details: parsed.error.flatten() });
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  if (req.user.role === 'author' && ticket.authorId !== req.user.authorId) return res.status(403).json({ error: 'You do not have access to this ticket.' });
  if (req.user.role === 'author' && parsed.data.isInternal) return res.status(403).json({ error: 'Authors cannot create internal notes.' });
  if (parsed.data.isInternal && req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access is required for internal notes.' });
  const message = {
    id: `MSG-${Date.now()}`, senderRole: req.user.role, senderName: req.user.name,
    body: parsed.data.body, isInternal: parsed.data.isInternal, createdAt: new Date().toISOString(),
  };
  const updated = parsed.data.isInternal ? appendNote(ticket.id, { id: `NOTE-${Date.now()}`, body: message.body, createdAt: message.createdAt, authorName: req.user.name }) : appendMessage(ticket.id, message);
  if (req.user.role === 'admin' && !parsed.data.isInternal && updated.status === 'Open') updateTicket(ticket.id, { status: 'In Progress' });
  const latest = findTicket(ticket.id);
  return res.status(201).json({ ticket: publicTicket(latest, req.user.role === 'admin'), message: parsed.data.isInternal ? null : message });
});

app.post('/api/tickets/:id/ai-draft', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const ticket = findTicket(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
  const author = findAuthor(ticket.authorId);
  const book = ticket.bookId ? findBook(ticket.authorId, ticket.bookId) : null;
  const result = await generateResponseDraft(ticket, author, book);
  return res.json(result);
}));

app.get('/api/admin/stats', authenticate, requireAdmin, (_req, res) => {
  const tickets = getTickets();
  const counts = Object.fromEntries(statuses.map((status) => [status, tickets.filter((ticket) => ticket.status === status).length]));
  const priorityCounts = Object.fromEntries(priorities.map((priority) => [priority, tickets.filter((ticket) => ticket.priority === priority).length]));
  const pendingRoyalties = authors.flatMap((author) => author.books).reduce((sum, book) => sum + (book.royalty_pending || 0), 0);
  const totalSales = authors.flatMap((author) => author.books).reduce((sum, book) => sum + (book.total_copies_sold || 0), 0);
  return res.json({
    totalAuthors: authors.length, totalBooks: authors.reduce((sum, author) => sum + author.books.length, 0),
    publishedBooks: authors.flatMap((author) => author.books).filter((book) => book.status === 'Published & Live').length,
    totalSales, pendingRoyalties, totalTickets: tickets.length, counts, priorityCounts,
  });
});

app.get('/api/admin/authors', authenticate, requireAdmin, (_req, res) => {
  return res.json({ authors: authors.map((author) => ({
    authorId: author.author_id, name: author.name, email: author.email, phone: author.phone, city: author.city,
    joinedDate: author.joined_date, booksCount: author.books.length,
    copiesSold: author.books.reduce((sum, book) => sum + (book.total_copies_sold || 0), 0),
    royaltyPending: author.books.reduce((sum, book) => sum + (book.royalty_pending || 0), 0),
  })) });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(clientDist, 'index.html'), (error) => error && next());
});

app.use((_req, res) => res.status(404).json({ error: 'The requested API endpoint was not found.' }));
app.use((error, _req, res, _next) => {
  console.error('[API error]', error);
  if (error?.name === 'SyntaxError' && 'body' in error) return res.status(400).json({ error: 'Request body contains invalid JSON.' });
  return res.status(500).json({ error: 'Something went wrong while processing your request. Please try again.' });
});

app.listen(PORT, () => console.log(`BookLeaf API listening on http://localhost:${PORT}`));

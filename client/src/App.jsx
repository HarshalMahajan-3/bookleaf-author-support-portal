import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import AuthorOverview from './pages/AuthorOverview';
import AuthorBooks from './pages/AuthorBooks';
import AuthorTickets from './pages/AuthorTickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import AdminOverview from './pages/AdminOverview';
import AdminTickets from './pages/AdminTickets';
import AdminAuthors from './pages/AdminAuthors';
import AdminBooks from './pages/AdminBooks';

function LoadingScreen() {
  return <div className="grid min-h-screen place-items-center bg-cream"><div className="flex items-center gap-3 text-sm font-semibold text-forest"><span className="h-5 w-5 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />Opening your workspace…</div></div>;
}

function ProtectedLayout({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/overview' : '/author/overview'} replace />;
  return <AppShell />;
}

function IndexRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin/overview' : '/author/overview') : '/login'} replace />;
}

export default function App() {
  const { user, loading } = useAuth();
  return <Routes>
    <Route path="/" element={<IndexRedirect />} />
    <Route path="/login" element={loading ? <LoadingScreen /> : user ? <IndexRedirect /> : <Login />} />
    <Route element={<ProtectedLayout role="author" />}>
      <Route path="/author/overview" element={<AuthorOverview />} />
      <Route path="/author/books" element={<AuthorBooks />} />
      <Route path="/author/tickets" element={<AuthorTickets />} />
      <Route path="/author/tickets/new" element={<NewTicket />} />
    </Route>
    <Route element={<ProtectedLayout role="admin" />}>
      <Route path="/admin/overview" element={<AdminOverview />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/authors" element={<AdminAuthors />} />
      <Route path="/admin/books" element={<AdminBooks />} />
    </Route>
    <Route element={<ProtectedLayout />}>
      <Route path="/tickets/:ticketId" element={<TicketDetail />} />
    </Route>
    <Route path="*" element={<IndexRedirect />} />
  </Routes>;
}

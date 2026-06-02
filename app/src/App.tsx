import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewAdmission from './pages/NewAdmission';
import FeeCollection from './pages/FeeCollection';
import SeatMap from './pages/SeatMap';
import Requests from './pages/Requests';
import StudentRecords from './pages/StudentRecords';
import EditStudent from './pages/EditStudent';
import Reports from './pages/Reports';
import PdfGenerator from './pages/PdfGenerator';
import WebsiteSettings from './pages/WebsiteSettings';
import Index from './pages/Index';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicLoginRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f1f5f9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<PublicLoginRoute />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admission" element={<NewAdmission />} />
        <Route path="/fees" element={<FeeCollection />} />
        <Route path="/pdf-generator" element={<PdfGenerator />} />
        <Route path="/seat-map" element={<SeatMap />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/students" element={<StudentRecords />} />
        <Route path="/students/edit/:id" element={<EditStudent />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/website-settings" element={<WebsiteSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

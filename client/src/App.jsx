import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './context/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import StudyWorkspace from './pages/StudyWorkspace.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />

          {/* Only for visitors who are not logged in */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Requires a valid JWT */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<StudyWorkspace />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <Toaster
        position="bottom-right"
        richColors
        theme={resolvedTheme}
        toastOptions={{
          className: 'border border-border-subtle bg-surface text-primary rounded-md font-sans text-xs shadow-md',
        }}
      />
    </>
  );
}

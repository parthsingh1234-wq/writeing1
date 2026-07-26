import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { Dashboard } from './pages/Dashboard';
import { CreateEditArticle } from './pages/CreateEditArticle';
import { ArticleViewer } from './pages/ArticleViewer';
import { ImageLibrary } from './pages/ImageLibrary';
import { CategoriesTags } from './pages/CategoriesTags';
import { Trash } from './pages/Trash';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Auth/Profile';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-slate-400">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppContent = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearchChange={setSearchTerm} searchValue={searchTerm} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard searchTerm={searchTerm} />} />
            <Route path="/articles" element={<Dashboard searchTerm={searchTerm} />} />
            <Route path="/drafts" element={<Dashboard searchTerm={searchTerm} />} />
            <Route path="/article/:idOrSlug" element={<ArticleViewer />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/editor/new" element={<ProtectedRoute><CreateEditArticle /></ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute><CreateEditArticle /></ProtectedRoute>} />
            <Route path="/images" element={<ProtectedRoute><ImageLibrary /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesTags /></ProtectedRoute>} />
            <Route path="/trash" element={<ProtectedRoute><Trash /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin Route */}
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

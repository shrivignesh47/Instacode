import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import CreatePage from './pages/CreatePage';
import ForumsPage from './pages/ForumsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import SavedPage from './pages/SavedPage';
import TrendingPage from './pages/TrendingPage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-white text-lg">Loading...</span>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/home" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/explore" element={
              <ProtectedRoute>
                <Layout>
                  <ExplorePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/create" element={
              <ProtectedRoute>
                <Layout>
                  <CreatePage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/forums" element={
              <ProtectedRoute>
                <Layout>
                  <ForumsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/communities" element={
              <ProtectedRoute>
                <Layout>
                  <CommunitiesPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <Layout>
                  <SavedPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trending" element={
              <ProtectedRoute>
                <Layout>
                  <TrendingPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:username" element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
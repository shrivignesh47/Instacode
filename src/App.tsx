import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import CreatePage from './pages/CreatePage';
import CodePlaygroundPage from './pages/CodePlaygroundPage';
import CodeAnalyserPage from './pages/CodeAnalyserPage';
import ForumsPage from './pages/ForumsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import SavedPage from './pages/SavedPage';
import TrendingPage from './pages/TrendingPage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';

// New problem and challenge pages
import ProblemsPage from './pages/ProblemsPage';
import ProblemDetailPage from './pages/ProblemDetailPage';
import CreateProblemPage from './pages/CreateProblemPage';
import CodingChallengesPage from './pages/CodingChallengesPage';
import CodingChallengeDetailPage from './pages/CodingChallengeDetailPage';
import CreateChallengePage from './pages/CreateChallengePagePage';
import GlobalLeaderboardPage from './pages/GlobalLeaderboardPage';

import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/home" replace />;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-lg">Loading InstaCode...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
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
      <Route path="/playground" element={
        <ProtectedRoute>
          <CodePlaygroundPage />
        </ProtectedRoute>
      } />
      <Route path="/code-analyser" element={
        <ProtectedRoute>
          <Layout>
            <CodeAnalyserPage />
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
      
      {/* Problem Routes */}
      <Route path="/problems" element={
        <ProtectedRoute>
          <Layout>
            <ProblemsPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/problems/:slug" element={
        <ProtectedRoute>
          <Layout>
            <ProblemDetailPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/problems/create" element={
        <ProtectedRoute>
          <Layout>
            <CreateProblemPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Challenge Routes */}
      <Route path="/challenges" element={
        <ProtectedRoute>
          <Layout>
            <CodingChallengesPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/challenges/:id" element={
        <ProtectedRoute>
          <Layout>
            <CodingChallengeDetailPage />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/challenges/create" element={
        <ProtectedRoute>
          <Layout>
            <CreateChallengePage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Leaderboard Route */}
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Layout>
            <GlobalLeaderboardPage />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
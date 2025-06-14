import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): string | null => {
    if (!username.trim()) {
      return 'Username is required.';
    }
    
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.';
    }
    
    if (!email.trim()) {
      return 'Email is required.';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
    }
    
    if (!password) {
      return 'Password is required.';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }
    
    if (!agreeToTerms) {
      return 'Please agree to the terms and conditions.';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(username.trim(), email.trim(), password);
      
      if (result.success) {
        setSuccessMessage('Account created successfully! Welcome to InstaCode!');
        // Navigate to home after a short delay to show success message
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20">
        <Sparkles className="text-yellow-400 w-6 h-6 animate-pulse" />
      </div>
      <div className="absolute bottom-32 left-10">
        <Sparkles className="text-pink-400 w-4 h-4 animate-pulse delay-1000" />
      </div>
      <div className="absolute top-40 right-32">
        <Sparkles className="text-blue-400 w-5 h-5 animate-pulse delay-500" />
      </div>

      <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-12">
        {/* Left side - Logo and branding */}
        <div className="hidden lg:flex flex-col items-center justify-center flex-1">
          <div className="relative">
            <div className="w-80 h-80 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-500">
              <div className="w-64 h-64 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 text-white mx-auto mb-4" />
                  <div className="w-20 h-3 bg-gray-300 rounded-full mb-2"></div>
                  <div className="w-16 h-3 bg-gray-400 rounded-full mb-2"></div>
                  <div className="w-12 h-3 bg-purple-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">InstaCode</h1>
            <p className="text-xl text-purple-200 max-w-md">
              Join the community of developers sharing code, projects, and ideas
            </p>
          </div>
        </div>

        {/* Right side - Signup form */}
        <div className="w-full lg:w-auto lg:min-w-[420px]">
          <div className="bg-gray-800 bg-opacity-40 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-gray-300">
                Join InstaCode today! 🚀
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm">{errorMessage}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-500 rounded-lg flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-200 text-sm">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a unique username"
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                  maxLength={20}
                />
                <p className="text-xs text-gray-400 mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  At least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  disabled={isLoading}
                />
                <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-400 hover:text-purple-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mt-8">
            <h1 className="text-4xl font-bold text-white mb-2">InstaCode</h1>
            <p className="text-purple-200">Join the community of developers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resendConfirmSent, setResendConfirmSent] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError('Please enter your email address');
      return false;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('email_not_confirmed')) {
          throw new Error("Please confirm your email address before signing in. Check your inbox (and spam folder) for the confirmation link.");
        } else if (signInError.message === "Invalid login credentials") {
          throw new Error("The email or password you entered is incorrect. Please try again or use 'Forgot Password' to reset your password.");
        }
        throw signInError;
      }

      navigate('/account');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password");
      document.getElementById('email')?.focus();
      return;
    }

    if (!email.includes('@')) {
      setError("Please enter a valid email address");
      document.getElementById('email')?.focus();
      return;
    }

    setResettingPassword(true);
    setError(null);

    try {
      // Clear any previous success message
      setResetSent(false);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Too many reset attempts. Please try again in a few minutes.');
        }
        throw error;
      }

      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setResetSent(false);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) throw error;

      setResendConfirmSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-center text-charcoal-300 mb-8">Welcome Back</h1>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500">{error}</p>
                {error.includes('incorrect') && (
                  <button
                    onClick={() => setError(null)}
                    className="block mt-2 text-sage-500 hover:text-sage-600 font-medium"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {resetSent && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
              Password reset instructions have been sent to your email.
            </div>
          )}

          {resendConfirmSent && (
            <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
              Confirmation email has been resent. Please check your inbox.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email.trim()}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                required
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-400 text-white py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={handleResetPassword}
              disabled={loading || resettingPassword}
              className={`text-sage-400 hover:text-sage-500 text-sm disabled:opacity-50 ${
                resettingPassword ? 'cursor-wait' : ''
              }`}
            >
              {resettingPassword ? 'Sending reset link...' : 'Forgot your password?'}
            </button>
            <p className="text-charcoal-300">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-sage-400 hover:text-sage-500 font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
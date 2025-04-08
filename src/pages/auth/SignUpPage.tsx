import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setTimeout(() => {
        setCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before trying again`);
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      // First, sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes('rate_limit') ||
            (signUpError as any)?.status === 429 ||
            signUpError.message.includes('security purposes')) {
          setCooldown(13);
          throw new Error('For security purposes, please wait before trying again');
        }
        if (signUpError.message === 'User already registered') {
          throw new Error(
            'This email is already registered. Please sign in instead or reset your password if you forgot it.'
          );
        }
        throw signUpError;
      }

      // Check if we got user data back
      if (!signUpData?.user?.id) {
        throw new Error('Failed to create account. Please try again.');
      }

      // If we reach here, everything was successful
      setSuccess(true);
      setSignupEmail(trimmedEmail);
      setEmail('');
      setPassword('');

    } catch (err: any) {
      setError(err.message);
      console.error('Signup error:', err);
      if (err?.status === 429 || (err.message && err.message.toLowerCase().includes('rate limit'))) {
        setCooldown(13);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!signupEmail) return;
    
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmail,
      });

      if (error) throw error;
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-cream-50">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-sage-400" />
              </div>
              <h1 className="text-3xl font-bold text-charcoal-300 mb-4">Almost There!</h1>
              <p className="text-charcoal-200 mb-4">
                We've sent a confirmation link to <strong>{signupEmail}</strong>. Please check your email (including spam folder) and click the link to activate your account.
              </p>
              {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
                  {error}
                </div>
              )}
              {resendSuccess && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4">
                  Confirmation email resent successfully!
                </div>
              )}
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full bg-sage-100 text-sage-600 py-3 rounded-lg font-semibold hover:bg-sage-200 transition-colors mb-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail className="w-5 h-5" />
                {resendLoading ? "Sending..." : "Resend Confirmation Email"}
              </button>
              <Link
                to="/auth/login"
                className="inline-block w-full bg-sage-400 text-white py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors text-center"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center text-charcoal-300 mb-8">Create an Account</h1>

              {error && (
                <div className="bg-red-50 p-4 rounded-lg mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-500">{error}</p>
                    {error.includes('already registered') && (
                      <Link 
                        to="/auth/login" 
                        className="block mt-2 text-sage-500 hover:text-sage-600 font-medium"
                      >
                        Click here to sign in
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal-300 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                    required
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sage-400 focus:border-transparent"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full bg-sage-400 text-white py-3 rounded-lg font-semibold hover:bg-sage-500 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating account..." : cooldown > 0 ? `Wait ${cooldown}s` : "Create Account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-charcoal-300">
                  Already have an account?{" "}
                  <Link to="/auth/login" className="text-sage-400 hover:text-sage-500 font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
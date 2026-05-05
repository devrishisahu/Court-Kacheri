import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleAuth, clearError } from '../../store/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      const result = await dispatch(loginUser({ email, password, role })).unwrap();
      
      if (result.flagMessage) {
        toast(result.flagMessage, {
          icon: '🚩',
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            border: '1px solid #ef4444'
          },
        });
      }

      toast.success('Welcome back!', {
        iconTheme: { primary: '#4ade80', secondary: '#111111' },
      });
      
      if (result.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || 'Login failed');
      toast.error(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(clearError());
    try {
      const result = await dispatch(googleAuth({ 
        credential: credentialResponse.credential, 
        role 
      })).unwrap();

      if (result.flagMessage) {
        toast(result.flagMessage, {
          icon: '🚩',
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            border: '1px solid #ef4444'
          },
        });
      }

      toast.success('Welcome back!', {
        iconTheme: { primary: '#4ade80', secondary: '#111111' },
      });

      if (result.user?.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || 'Google login failed');
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Left — Decorative */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden">
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 80% 50%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 50% 20%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 20% 50%, #1a1a1a, #0a0a0a)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
        <blockquote className="relative z-10 max-w-xs text-center">
          <p className="text-3xl text-white/60 font-['Playfair_Display'] italic leading-relaxed">
            "The law is reason, free from passion."
          </p>
          <cite className="block mt-6 text-[#555555] text-sm font-['Inter'] not-italic">
            — Aristotle
          </cite>
        </blockquote>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="font-['Playfair_Display'] text-2xl text-white font-bold mb-12">
            ⚖ Court-Kacheri
          </h1>

          <h2 className="text-3xl font-bold text-white font-['Playfair_Display'] mb-2">
            Welcome back
          </h2>
          <p className="text-[#a0a0a0] text-sm font-['Inter'] mb-8">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lawfirm.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex justify-end">
              <span className="text-[#555555] text-xs font-['Inter'] cursor-pointer hover:text-[#a0a0a0] transition-colors">
                Forgot password?
              </span>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#555555] text-xs font-['Inter'] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          {/* Google Sign In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign-In failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signin_with"
            />
          </div>

          <p className="text-[#555555] text-sm font-['Inter'] mt-8 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

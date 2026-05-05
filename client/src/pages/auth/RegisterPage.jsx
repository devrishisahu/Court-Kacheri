import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, googleAuth, clearError } from '../../store/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', firmName: '' });
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    try {
      await dispatch(registerUser({ ...form, role })).unwrap();
      toast.success('Account created!', {
        iconTheme: { primary: '#4ade80', secondary: '#111111' },
      });
      navigate('/dashboard');
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || 'Registration failed');
      toast.error(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(clearError());
    try {
      await dispatch(googleAuth({ 
        credential: credentialResponse.credential, 
        role,
        firmName: form.firmName, 
      })).unwrap();
      
      toast.success('Account created with Google!', {
        iconTheme: { primary: '#4ade80', secondary: '#111111' },
      });
      navigate('/dashboard');
    } catch (err) {
      const message = typeof err === 'string' ? err : (err?.message || 'Google registration failed');
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
              'radial-gradient(circle at 30% 70%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 70% 30%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 50% 80%, #1a1a1a, #0a0a0a)',
              'radial-gradient(circle at 30% 70%, #1a1a1a, #0a0a0a)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
        <blockquote className="relative z-10 max-w-xs text-center">
          <p className="text-3xl text-white/60 font-['Playfair_Display'] italic leading-relaxed">
            "Injustice anywhere is a threat to justice everywhere."
          </p>
          <cite className="block mt-6 text-[#555555] text-sm font-['Inter'] not-italic">
            — Martin Luther King Jr.
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
            Create your account
          </h2>
          <p className="text-[#a0a0a0] text-sm font-['Inter'] mb-8">
            Start managing your practice as a <span className="text-[#d4af37] font-bold uppercase">{role || 'Firm'}</span>
          </p>

          {/* Google Sign Up — Top placement for convenience */}
          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign-Up failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signup_with"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#555555] text-xs font-['Inter'] uppercase tracking-widest">or register with email</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Full Name"
              value={form.name}
              onChange={update('name')}
              placeholder="Rishi Sharma"
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@lawfirm.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
            {(!role || role === 'admin') && (
              <Input
                label="Firm Name"
                value={form.firmName}
                onChange={update('firmName')}
                placeholder="Sharma & Associates"
                hint="This will create a new legal firm account"
                required={!role || role === 'admin'}
              />
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-[#555555] text-sm font-['Inter'] mt-8 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

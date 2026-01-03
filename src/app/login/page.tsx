'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoComponent from '@/components/LogoComponent';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else if (data.user.role === 'SDR') {
        router.push('/sdr');
      } else if (data.user.role === 'CLIENT') {
        router.push('/client');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--ivory-silk) 0%, #f0ede8 100%)',
      padding: '2rem'
    }}>
      <div className="card" style={{ 
        maxWidth: '450px', 
        width: '100%',
        padding: '2.5rem',
        boxShadow: '0 10px 40px rgba(11, 46, 43, 0.15)',
        borderRadius: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          marginBottom: '2rem' 
        }}>
          <LogoComponent width={120} height={66} hoverGradient={true} />
        <h1 style={{
            fontSize: '1.75rem',
          fontWeight: 'bold',
            marginTop: '1rem',
          marginBottom: '0.5rem',
          color: 'var(--imperial-emerald)',
          textAlign: 'center'
        }}>
          MillionCXO Dashboard
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--muted-jade)',
            fontSize: '0.875rem'
        }}>
          Sign in to your account
        </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--onyx-black)'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--onyx-black)'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { Mail, User, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email) {
      await login(username, email);
      navigate('/verify');
    }
  };

  return (
    <div className='login-container'>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='card login-card'>
        <div className='logo-section'>
          <h1>Estudos Eventos Finais</h1>
          <p>Inicie sua jornada de estudo hoje</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='input-group'>
            <label>
              <User size={18} /> Nome de Usuário
            </label>
            <input
              type='text'
              placeholder='Seu nome'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className='input-group'>
            <label>
              <Mail size={18} /> E-mail
            </label>
            <input
              type='email'
              placeholder='seu@email.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type='submit' className='btn-primary w-full'>
            Entrar <ArrowRight size={20} />
          </button>
        </form>

        <p className='footer-text'>Você receberá um e-mail de confirmação (em breve).</p>
      </motion.div>

      <style>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 1rem;
          background: radial-gradient(circle at top right, #1a1a1a 0%, #0a0a0a 100%);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .logo-section h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, var(--primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo-section p {
          color: var(--text-dim);
          margin-bottom: 2rem;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-dim);
          font-size: 0.9rem;
        }
        .input-group input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          padding: 0.8rem 1rem;
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          transition: var(--transition);
        }
        .input-group input:focus {
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.08);
          outline: none;
        }
        .w-full { width: 100%; }
        .footer-text {
          margin-top: 1.5rem;
          font-size: 0.8rem;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

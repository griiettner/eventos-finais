import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import { CheckCircle, ShieldCheck } from 'lucide-react';

const VerificationPage: React.FC = () => {
  const { verify, user } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async () => {
    await verify();
    navigate('/dashboard');
  };

  return (
    <div className='verify-container'>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className='card verify-card'>
        <ShieldCheck size={64} color='var(--primary)' style={{ marginBottom: '1.5rem' }} />
        <h1>Verifique seu E-mail</h1>
        <p>
          Enviamos um link de confirmação para <strong>{user?.email}</strong>. Por favor, clique no botão abaixo para
          simular a verificação (em um app real, você clicaria no link do email).
        </p>

        <button onClick={handleVerify} className='btn-primary'>
          Confirmar Acesso <CheckCircle size={20} />
        </button>
      </motion.div>

      <style>{`
        .verify-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 1rem;
        }
        .verify-card {
          max-width: 450px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .verify-card h1 { margin-bottom: 1rem; }
        .verify-card p { color: var(--text-dim); margin-bottom: 2rem; }
      `}</style>
    </div>
  );
};

export default VerificationPage;

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, ShieldCheck } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className='landing-container'>
      <main className='landing-content'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className='hero-card'
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="logo-wrapper"
          >
            <img src="/logo.png" alt="Eventos Finais Logo" className="landing-logo" />
          </motion.div>
          <div className='badge'>Estudo Bíblico Profundo</div>
          <h1>Estudos Eventos Finais</h1>
          <p className='subtitle'>
            Uma jornada transformadora pelos 20 capítulos que revelam os acontecimentos finais da história da
            humanidade.
          </p>

          <div className='features-mini'>
            <span>
              <BookOpen size={16} /> Distraction-Free
            </span>
            <span>
              <Sparkles size={16} /> Audio-Book
            </span>
            <span>
              <ShieldCheck size={16} /> Offline Access
            </span>
          </div>

          <Link to='/login' className='btn-primary btn-base'>
            Começar Agora
          </Link>
        </motion.div>
      </main>

      <div className='background-decoration'>
        <div className='blob'></div>
        <div className='blob secondary'></div>
      </div>
    </div>
  );
};

export default LandingPage;

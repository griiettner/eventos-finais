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

          <Link to='/login' className='btn-primary start-btn'>
            Começar Agora
          </Link>
        </motion.div>
      </main>

      <div className='background-decoration'>
        <div className='blob'></div>
        <div className='blob secondary'></div>
      </div>

      <style>{`
        .landing-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
          position: relative;
        }
        .landing-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 2rem;
        }
        .hero-card {
          max-width: 600px;
        }
        .badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          background: rgba(193, 163, 95, 0.1);
          color: var(--primary);
          border: 1px solid var(--primary);
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        h1 {
          font-size: clamp(3rem, 10vw, 5rem);
          line-height: 1;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #fff 0%, #c1a35f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 1.25rem;
          color: var(--text-dim);
          margin-bottom: 2.5rem;
        }
        .features-mini {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
          color: var(--text-dim);
          font-size: 0.9rem;
        }
        .features-mini span { display: flex; align-items: center; gap: 0.4rem; }
        
        .start-btn {
          font-size: 1.2rem;
          padding: 1rem 3rem;
        }

        .background-decoration {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          filter: blur(100px);
          opacity: 0.4;
        }
        .blob {
          position: absolute;
          top: -10%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          background: var(--primary);
          border-radius: 50%;
        }
        .blob.secondary {
          top: auto;
          bottom: -10%;
          left: -10%;
          background: #3a2c20;
          width: 40vw;
          height: 40vw;
        }

        @media (max-width: 768px) {
          .features-mini { flex-direction: column; gap: 0.8rem; align-items: center; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

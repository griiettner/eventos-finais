import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { chapters } from '../data/chapters';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle2, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DBService } from '../db/db-service';

interface ProgressRow {
  chapter_id: number;
  is_read: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [readingProgress, setReadingProgress] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchProgress = async () => {
      const rows = await DBService.getAll<ProgressRow>('SELECT chapter_id, is_read FROM progress');
      const progressMap = rows.reduce((acc: Record<number, boolean>, row: ProgressRow) => {
        acc[row.chapter_id] = !!row.is_read;
        return acc;
      }, {});
      setReadingProgress(progressMap);
    };
    fetchProgress();
  }, []);

  return (
    <div className='dashboard-layout'>
      <header className='glass main-header'>
        <div className='header-content'>
          <div className='user-info'>
            <div className='avatar'>
              <UserIcon size={20} />
            </div>
            <div>
              <h3>Olá, {user?.username}</h3>
              <p>Continue seu estudo</p>
            </div>
          </div>
          <button onClick={logout} className='logout-btn'>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className='container'>
        <section className='hero-section'>
          <h1>Estudos Eventos Finais</h1>
          <p>Explore os 20 capítulos fundamentais sobre os últimos dias da história terrestre.</p>
        </section>

        <div className='chapters-grid'>
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className='card chapter-card'
            >
              <div className='chapter-number'>{chapter.id}</div>
              <div className='chapter-content'>
                <h3>{chapter.title}</h3>
                <p>{chapter.summary}</p>

                <div className='chapter-actions'>
                  <Link to={`/chapter/${chapter.id}`} className='btn-read'>
                    <BookOpen size={18} /> Ler Capítulo
                  </Link>
                  <Link to={`/chapter/${chapter.id}?autoPlay=true`} className='btn-audio'>
                    <Play size={18} /> Áudio
                  </Link>
                </div>
              </div>
              {readingProgress[chapter.id] && (
                <div className='completed-badge'>
                  <CheckCircle2 size={16} /> Concluído
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>

      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          padding-top: 80px;
          padding-bottom: 40px;
        }
        .main-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          z-index: 100;
        }
        .header-content {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
        }
        .user-info h3 { font-size: 1rem; margin: 0; }
        .user-info p { font-size: 0.8rem; color: var(--text-dim); }
        .logout-btn { color: var(--text-dim); transition: var(--transition); }
        .logout-btn:hover { color: #ff4d4d; }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .hero-section {
          margin-bottom: 3rem;
          text-align: center;
        }
        .hero-section h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .hero-section p { color: var(--text-dim); max-width: 600px; margin: 0 auto; }

        .chapters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .chapter-card {
          position: relative;
          display: flex;
          gap: 1rem;
          transition: var(--transition);
        }
        .chapter-card:hover { border-color: var(--primary); transform: translateY(-5px); }
        .chapter-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary);
          opacity: 0.3;
          line-height: 1;
        }
        .chapter-content h3 { margin-bottom: 0.5rem; font-size: 1.2rem; }
        .chapter-content p { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 1.5rem; }
        .chapter-actions {
          display: flex;
          gap: 0.8rem;
        }
        .btn-read, .btn-audio {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: var(--transition);
        }
        .btn-read { background: var(--primary); color: #000; }
        .btn-audio { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--glass-border); }
        .btn-audio:hover { background: rgba(255,255,255,0.1); }
        
        .completed-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(76, 175, 80, 0.2);
          color: #81c784;
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        @media (max-width: 768px) {
          .hero-section h1 { font-size: 2rem; }
          .chapters-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

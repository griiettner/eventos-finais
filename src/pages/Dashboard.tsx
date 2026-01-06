import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle2 } from 'lucide-react';
import UserMenu from '../components/UserMenu';

interface ProgressRow {
  chapter_id: number;
  is_read: number;
  is_completed: number;
  completed_at?: string;
}

interface ChapterRow {
  id: number;
  title: string;
  summary: string;
  order_index: number;
}

const Dashboard: React.FC = () => {
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load chapters from database
        const chaptersData = await DBService.getAll<ChapterRow>('SELECT id, title, summary, order_index FROM chapters ORDER BY order_index');
        setChapters(chaptersData);

        // Load progress
        const rows = await DBService.getAll<ProgressRow>('SELECT chapter_id, is_completed FROM progress');
        const completedMap = rows.reduce((acc: Record<number, boolean>, row: ProgressRow) => {
          acc[row.chapter_id] = !!row.is_completed;
          return acc;
        }, {});
        setCompletedLessons(completedMap);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileUpdate = async (userData: { username: string; email: string }) => {
    try {
      await DBService.exec(
        'UPDATE user_profile SET username = ?, email = ? WHERE id = 1',
        [userData.username, userData.email]
      );
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='dashboard-layout'>
        <header className='glass main-header'>
          <div className='header-content'>
            <div className="header-user-group">
              <UserMenu onProfileUpdate={handleProfileUpdate} />
            </div>
          </div>
        </header>
        <main className='container'>
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            Carregando capítulos...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className='dashboard-layout'>
      <header className='glass main-header'>
        <div className='header-content'>
          <div className="header-user-group">
            <UserMenu onProfileUpdate={handleProfileUpdate} />
          </div>
        </div>
      </header>

      <main className='container'>
        <section className='hero-section'>
          <h1>Estudos Eventos Finais</h1>
          <p>Explore os 20 capítulos fundamentais sobre os últimos dias da história terrestre.</p>
        </section>

        {chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <BookOpen size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h2 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Nenhum capítulo disponível</h2>
            <p style={{ color: 'var(--text-dim)' }}>Os capítulos serão adicionados pelo administrador em breve.</p>
          </div>
        ) : (
          <div className='chapters-grid'>
            {chapters
            .sort((a, b) => {
              // Sort by completion status: incomplete first, then completed
              const aCompleted = completedLessons[a.id] || false;
              const bCompleted = completedLessons[b.id] || false;
              if (aCompleted === bCompleted) return a.order_index - b.order_index; // Sort by chapter number
              return aCompleted ? 1 : -1; // Incomplete first
            })
            .map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card chapter-card ${completedLessons[chapter.id] ? 'completed' : ''}`}
              >
                <div className='chapter-number'>{chapter.order_index}</div>
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
                {completedLessons[chapter.id] && (
                  <div className='completed-badge'>
                    <CheckCircle2 size={16} /> Concluído
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

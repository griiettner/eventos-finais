import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle2 } from 'lucide-react';
import UserMenu from '../components/UserMenu';
import { AdminService } from '../services/admin-service';
import { useAuth } from '../hooks/useAuth';

interface ChapterProgress {
  isCompleted: boolean;
  isAudioFinished: boolean;
  readPagesCount: number;
  totalPagesCount: number;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
}

interface ChapterRow {
  id: string;
  title: string;
  summary: string;
  order_index: number;
  progress?: ChapterProgress;
}

const Dashboard: React.FC = () => {
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    let retryCount = 0;
    const maxRetries = 5;
    
    const fetchData = async () => {
      if (authLoading) return;
      
      try {
        // Load chapters and their progress in parallel
        const [chaptersData, progressData] = await Promise.all([
          AdminService.getAllChapters(),
          AdminService.getAllChaptersProgress()
        ]);

        setChapters(chaptersData.map(c => ({
          id: c.id,
          title: c.title,
          summary: c.summary || '',
          order_index: c.order_index,
          progress: progressData[c.id]
        })));
        setIsLoading(false);
      } catch (error) {
        if (error instanceof Error && error.message === 'AUTH_INITIALIZING') {
          // Token getter not ready yet, retry after a short delay
          if (retryCount < maxRetries) {
            retryCount++;
            retryTimeout = setTimeout(fetchData, 200);
          } else {
            console.error('Failed to load dashboard data: Auth token not available after retries');
            setIsLoading(false);
          }
          return;
        }
        console.error('Failed to load dashboard data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [authLoading]);

  const handleProfileUpdate = async (userData: { username: string; email: string }) => {
    try {
      await AdminService.updateUserProfile(userData.username, userData.email);
      // Removed window.location.reload() to prevent full app refresh.
      // The UserMenu now calls refreshProfile() to update the state reatively.
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Erro ao atualizar perfil. Por favor, tente novamente.');
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
            {(() => {
              const sortedChapters = [...chapters].sort((a, b) => {
                const aCompleted = a.progress?.isCompleted || false;
                const bCompleted = b.progress?.isCompleted || false;
                if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
                return a.order_index - b.order_index;
              });

              // Find the first chapter that is not completed
              const firstIncompleteIndex = sortedChapters.findIndex(c => !c.progress?.isCompleted);

              return sortedChapters.map((chapter, index) => {
                const prog = chapter.progress;
                const hasStarted = prog && (prog.readPagesCount > 0 || prog.isAudioFinished || prog.answeredQuestionsCount > 0);
                const isCompleted = prog?.isCompleted;
                
                // A chapter is enabled if it's already completed OR it's the first incomplete one
                const isEnabled = isCompleted || index === firstIncompleteIndex;

                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`card chapter-card ${isCompleted ? 'completed' : ''} ${hasStarted && !isCompleted ? 'in-progress' : ''} ${!isEnabled ? 'locked' : ''}`}
                  >
                    <div className='chapter-number'>{chapter.order_index}</div>
                    <div className='chapter-content'>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.summary}</p>

                      {isEnabled && hasStarted && !isCompleted && prog && (
                        <div className='chapter-progress-details'>
                          <div className='progress-item'>
                            <div className='progress-label'>
                              <BookOpen size={14} /> Leitura
                            </div>
                            <div className='progress-bar-container'>
                              <div 
                                className='progress-bar' 
                                style={{ width: `${(prog.readPagesCount / (prog.totalPagesCount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className='progress-text'>{prog.readPagesCount}/{prog.totalPagesCount}</span>
                          </div>
                          
                          <div className='progress-item'>
                            <div className='progress-label'>
                              <Play size={14} /> Áudio
                            </div>
                            <div className='progress-bar-container'>
                              <div 
                                className={`progress-bar ${prog.isAudioFinished ? 'finished' : ''}`} 
                                style={{ width: prog.isAudioFinished ? '100%' : '0%' }}
                              />
                            </div>
                            <span className='progress-text'>{prog.isAudioFinished ? '100%' : '0%'}</span>
                          </div>

                          <div className='progress-item'>
                            <div className='progress-label'>
                              <CheckCircle2 size={14} /> Respostas
                            </div>
                            <div className='progress-bar-container'>
                              <div 
                                className='progress-bar' 
                                style={{ width: `${(prog.answeredQuestionsCount / (prog.totalQuestionsCount || 1)) * 100}%` }}
                              />
                            </div>
                            <span className='progress-text'>{prog.answeredQuestionsCount}/{prog.totalQuestionsCount}</span>
                          </div>
                        </div>
                      )}

                      <div className='chapter-actions'>
                        {!isEnabled ? (
                          <button className='btn-read btn-locked' disabled>
                             Aguardando...
                          </button>
                        ) : !hasStarted ? (
                          <Link to={`/chapter/${chapter.id}`} className='btn-read btn-start'>
                            <Play size={18} /> Iniciar Estudo
                          </Link>
                        ) : (
                          <Link to={`/chapter/${chapter.id}`} className='btn-read btn-continue'>
                            <BookOpen size={18} /> {isCompleted ? 'Revisar Estudo' : 'Continuar Estudo'}
                          </Link>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <div className='completed-badge'>
                        <CheckCircle2 size={16} /> Concluído
                      </div>
                    )}
                  </motion.div>
                );
              });
            })()}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Type, Moon, Sun, Book, Save, CheckCircle2, X, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { AdminService, type ChapterPage, type Chapter } from '../services/admin-service';
import ContentModal from '../components/ContentModal';
import { useAuth } from '../hooks/useAuth';

const ChapterDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading: authLoading } = useAuth();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [readPages, setReadPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);

  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Build full URL for audio (path is stored relative in DB)
  const getAudioUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${apiUrl}${path}`;
  };

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!id || authLoading) {
        return;
      }
      
      try {
        // Load chapter data from API
        const chapterData = await AdminService.getChapter(id);
        
        if (!chapterData) {
          setIsLoading(false);
          return;
        }
        
        setChapter(chapterData);

        // Load chapter pages
        const pagesData = await AdminService.getChapterPages(id);
        setPages(pagesData);

        // Load questions from API
        const questionsData = await AdminService.getChapterQuestions(id);
        setQuestions(questionsData.map(q => ({ id: q.id, text: q.text })));

        // Load page read progress from API
        const readProgress = await AdminService.getPageReadProgress(id);
        const readPageIds = new Set(readProgress.filter(p => p.is_read).map(p => p.page_id));
        setReadPages(readPageIds);

        // Load completion status from API
        const progress = await AdminService.getChapterProgress(id);
        setIsCompleted(progress.is_completed);

        // Progress and answers are stored locally for now
        // TODO: Implement answers API endpoint
      } catch (error) {
        if (error instanceof Error && error.message === 'AUTH_INITIALIZING') {
          // Erro esperado durante o carregamento inicial, não logar
          return;
        }
        console.error('Failed to load chapter:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, authLoading]);

useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageIndex]);

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      const aRead = readPages.has(a.id);
      const bRead = readPages.has(b.id);
      if (aRead === bRead) return a.order_index - b.order_index;
      return aRead ? 1 : -1;
    });
  }, [pages, readPages]);

  const currentPage = sortedPages[currentPageIndex];

  const handleMarkPageAsRead = async () => {
    if (!chapter || !currentPage || !id) return;
    
    try {
      await AdminService.markPageAsRead(id, currentPage.id);
      setReadPages(prev => new Set([...prev, currentPage.id]));
      
      // Se houver mais páginas não lidas, o índice 0 passará a ser a próxima não lida
      // devido ao useMemo que reordena as páginas. Por isso, resetamos para 0
      // se a página atual acabou de ser marcada como lida e movida para o fim.
      setCurrentPageIndex(0);
    } catch (error) {
      console.error('Failed to mark page as read:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const getModalContent = (modalId: string): string => {
    try {
      // Decode base64 content embedded in the link
      const decodedContent = decodeURIComponent(atob(modalId));
      return decodedContent;
    } catch {
      // If decoding fails, return error message
      return `Erro ao carregar conteúdo do modal. O conteúdo pode estar corrompido.`;
    }
  };

  const renderContent = (content: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let currentIndex = 0;
    
    // Combined regex for bold, italic, and links
    const formatRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = formatRegex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(content.substring(currentIndex, match.index));
      }

      if (match[1]) {
        // Bold: **text**
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        // Italic: *text*
        parts.push(<em key={match.index}>{match[4]}</em>);
      } else if (match[5] && match[6]) {
        // Link: [text](url)
        const linkText = match[5];
        const linkUrl = match[6];
        
        if (linkUrl.startsWith('#modal:')) {
          // Modal link
          const modalId = linkUrl.substring(7);
          parts.push(
            <button
              key={match.index}
              onClick={() => setModalContent({ 
                title: linkText, 
                content: getModalContent(modalId) 
              })}
              className="content-link content-modal-link"
            >
              {linkText}
            </button>
          );
        } else {
          // Regular link
          parts.push(
            <a 
              key={match.index} 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="content-link"
            >
              {linkText}
            </a>
          );
        }
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < content.length) {
      parts.push(content.substring(currentIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  if (isLoading) {
    return (
      <div className="chapter-detail-layout">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
          Carregando capítulo...
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="chapter-detail-layout">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 style={{ color: 'var(--text-dim)' }}>Capítulo não encontrado</h2>
          <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleToggleCompletion = async () => {
    if (!id) return;
    try {
      const newState = !isCompleted;
      await AdminService.toggleChapterCompletion(id, newState);
      setIsCompleted(newState);
      console.log('Progress toggled:', newState);
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const handleSaveAnswers = async () => {
    // TODO: Implement answers API endpoint
    // For now, just show saved state
    console.log('Answers to save:', answers);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={`chapter-detail-layout theme-${theme}`}>
      <header className='glass detail-header'>
        <button onClick={() => navigate('/dashboard')} className='back-btn'>
          <ChevronLeft size={24} />
        </button>
        <div className='header-title'>
          <span>Capítulo {chapter.order_index}</span>
          <h2>{chapter.title}</h2>
        </div>
        <div className='header-controls'>
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'sepia' : t === 'sepia' ? 'light' : 'dark'))}
            className='control-btn'
          >
            {theme === 'dark' ? <Moon size={20} /> : theme === 'sepia' ? <Book size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => setFontSize((s) => (s >= 24 ? 16 : s + 2))} className='control-btn'>
            <Type size={20} />
          </button>
        </div>
      </header>

      <main className='reading-container'>
        {pages.length === 0 ? (
          <div className='reading-content' style={{ textAlign: 'center', padding: '4rem' }}>
            <Book size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3 style={{ color: 'var(--text-dim)' }}>Nenhuma página disponível</h3>
            <p style={{ color: 'var(--text-dim)' }}>O conteúdo deste capítulo ainda não foi adicionado.</p>
          </div>
        ) : (
          <>
            <motion.div
              key={currentPageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='reading-content'
              style={{ fontSize: `${fontSize}px` }}
            >
              {currentPage?.subtitle && (
                <h3 className='page-subtitle'>{currentPage.subtitle}</h3>
              )}
              
              <div className='page-number-indicator'>
                Página {currentPage?.page_number || currentPageIndex + 1} de {pages.length}
              </div>

              <div className='page-content'>
                {currentPage ? renderContent(currentPage.content) : 'Conteúdo não disponível'}
              </div>

              <div className='page-read-marker'>
                {readPages.has(currentPage?.id || '') ? (
                  <span className='read-badge'>
                    <CheckCircle2 size={16} /> Página lida
                  </span>
                ) : (
                  <button onClick={handleMarkPageAsRead} className='btn-mark-read'>
                    <CheckCircle2 size={16} /> Marcar como lida
                  </button>
                )}
              </div>
            </motion.div>

            <div className='page-navigation'>
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPageIndex === 0}
                className='btn-nav btn-prev'
              >
                <ChevronLeft size={20} /> Anterior
              </button>
              
              <div className='page-dots'>
                {sortedPages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`page-dot ${index === currentPageIndex ? 'active' : ''} ${readPages.has(page.id) ? 'read' : ''}`}
                    title={`Página ${page.page_number || index + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={goToNextPage} 
                disabled={currentPageIndex === pages.length - 1}
                className='btn-nav btn-next'
              >
                Próxima <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}

        {chapter.audio_url && (
          <section className='audio-player-section card'>
            <div className='custom-audio-player'>
              <div className='player-controls'>
                <button 
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play();
                      }
                      setIsPlaying(!isPlaying);
                    }
                  }} 
                  className='play-btn'
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <div className='progress-container'>
                  <span className='time-display'>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <input
                    type='range'
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const time = Number(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.currentTime = time;
                      }
                      setCurrentTime(time);
                    }}
                    className='progress-slider'
                  />
                </div>

                <div className='speed-controls'>
                  <select
                    value={playbackRate}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.playbackRate = rate;
                      }
                      setPlaybackRate(rate);
                    }}
                    className='speed-select'
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={1.75}>1.75x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                <div className='volume-controls'>
                  <button 
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.muted = !isMuted;
                      }
                      setIsMuted(!isMuted);
                    }}
                    className='volume-btn'
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <input
                    type='range'
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const vol = Number(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.volume = vol;
                      }
                      setVolume(vol);
                      setIsMuted(vol === 0);
                    }}
                    className='volume-slider'
                  />
                </div>
              </div>

              <audio
                ref={audioRef}
                src={getAudioUrl(chapter.audio_url)}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setCurrentTime(audioRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                    audioRef.current.volume = volume;
                    if (searchParams.get('autoPlay') === 'true') {
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }
                }}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </section>
        )}

        <section className='study-questions card'>
          <h3>
            <Book size={20} /> Estudo do Capítulo
          </h3>
          <p>Responda às questões abaixo para aprofundar seu conhecimento.</p>

          <div className='questions-list'>
            {questions.map((q) => (
              <div key={q.id} className='question-item'>
                <label>{q.text}</label>
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder='Escreva sua resposta aqui...'
                />
              </div>
            ))}
          </div>

          <div className='action-buttons'>
            <button onClick={handleSaveAnswers} className='btn-primary save-btn'>
              {isSaved ? (
                <>
                  <CheckCircle2 size={20} /> Salvo
                </>
              ) : (
                <>
                  <Save size={20} /> Salvar Respostas
                </>
              )}
            </button>

            <button
              onClick={handleToggleCompletion}
              className={`btn-complete-lesson ${isCompleted ? 'completed' : ''}`}
            >
              {isCompleted ? (
                <>
                  <X size={20} /> Desfazer Conclusão
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} /> Concluir Estudo
                </>
              )}
            </button>
          </div>
        </section>

        <AnimatePresence>
          {modalContent && (
            <ContentModal
              title={modalContent.title}
              content={modalContent.content}
              onClose={() => setModalContent(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChapterDetail;

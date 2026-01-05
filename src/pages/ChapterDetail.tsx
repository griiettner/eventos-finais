import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, Type, Moon, Sun, Book, Save, Volume2, CheckCircle2, X, ChevronRight } from 'lucide-react';
import { DBService } from '../db/db-service';
import { AdminService, type ChapterPage } from '../services/admin-service';
import ContentModal from '../components/ContentModal';

interface AnswerRow {
  question_id: number;
  answer: string;
}

interface ChapterData {
  id: number;
  title: string;
  summary: string;
  audio_url: string;
}

const ChapterDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [readPages, setReadPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<{ id: number; text: string }[]>([]);

  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [isPlaying, setIsPlaying] = useState(searchParams.get('autoPlay') === 'true');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const chapterId = parseInt(id || '1');
      
      try {
        // Load chapter data
        const chapterData = await DBService.get<ChapterData>(
          'SELECT id, title, summary, audio_url FROM chapters WHERE id = ?',
          [chapterId]
        );
        
        if (!chapterData) {
          setIsLoading(false);
          return;
        }
        
        setChapter(chapterData);

        // Load chapter pages
        const pagesData = await AdminService.getChapterPages(chapterId);
        setPages(pagesData);

        // Load page read progress
        const readProgress = await AdminService.getPageReadProgress(chapterId);
        const readPageIds = new Set(readProgress.filter(p => p.is_read).map(p => p.page_id));
        setReadPages(readPageIds);

        // Load questions from DB
        const questionsData = await AdminService.getChapterQuestions(chapterId);
        setQuestions(questionsData);

        // Load answers from DB
        const result = await DBService.getAll<AnswerRow>(
          'SELECT question_id, answer FROM user_answers WHERE chapter_id = ?',
          [chapterId]
        );
        const savedAnswers = result.reduce((acc: Record<number, string>, row: AnswerRow) => {
          acc[row.question_id] = row.answer;
          return acc;
        }, {});
        setAnswers(savedAnswers);

        // Load completion status
        const progress = await DBService.get<{ is_completed: number }>(
          'SELECT is_completed FROM progress WHERE chapter_id = ?',
          [chapterId]
        );
        setIsCompleted(progress?.is_completed === 1);

        // Mark chapter as read when opened
        await DBService.exec('INSERT OR REPLACE INTO progress (chapter_id, is_read) VALUES (?, 1)', [chapterId]);
      } catch (error) {
        console.error('Failed to load chapter:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const currentPage = pages[currentPageIndex];

  const handleMarkPageAsRead = async () => {
    if (!chapter || !currentPage) return;
    
    try {
      await AdminService.markPageAsRead(chapter.id, currentPage.id);
      setReadPages(prev => new Set([...prev, currentPage.id]));
    } catch (error) {
      console.error('Failed to mark page as read:', error);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
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
    try {
      const newState = !isCompleted;
      await DBService.exec(
        'UPDATE progress SET is_completed = ?, completed_at = ? WHERE chapter_id = ?',
        [newState ? 1 : 0, newState ? new Date().toISOString() : null, chapter.id]
      );
      setIsCompleted(newState);
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const handleSaveAnswers = async () => {
    for (const [qId, text] of Object.entries(answers)) {
      await DBService.exec(
        'INSERT OR REPLACE INTO user_answers (chapter_id, question_id, answer, synced) VALUES (?, ?, ?, 0)',
        [chapter.id, parseInt(qId), text]
      );
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`chapter-detail-layout theme-${theme}`}>
      <header className='glass detail-header'>
        <button onClick={() => navigate('/dashboard')} className='back-btn'>
          <ChevronLeft size={24} />
        </button>
        <div className='header-title'>
          <span>Capítulo {chapter.id}</span>
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
                {readPages.has(currentPage?.id || 0) ? (
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
                {pages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`page-dot ${index === currentPageIndex ? 'active' : ''} ${readPages.has(pages[index]?.id) ? 'read' : ''}`}
                    title={`Página ${index + 1}`}
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
            <div className='player-info'>
              <Volume2 size={24} color='var(--primary)' />
              <div>
                <h4>Audio Book</h4>
                <p>{isPlaying ? 'Reproduzindo...' : 'Pausado'}</p>
              </div>
            </div>
            <button onClick={togglePlay} className='play-btn'>
              {isPlaying ? <Pause size={30} fill='currentColor' /> : <Play size={30} fill='currentColor' />}
            </button>
            <audio
              ref={audioRef}
              src={chapter.audio_url}
              onEnded={() => setIsPlaying(false)}
              autoPlay={searchParams.get('autoPlay') === 'true'}
            />
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

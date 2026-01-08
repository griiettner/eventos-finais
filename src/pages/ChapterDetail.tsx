import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  Save, Moon, Book, Sun,
  Type, Pause, Play, X
} from 'lucide-react';
import { AdminService, type Chapter, type ChapterPage } from '../services/admin-service';
import ContentModal from '../components/ContentModal';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AudioPlayer from '../components/AudioPlayer';
import { useAuth } from '../hooks/useAuth';

const ChapterDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  const [readPages, setReadPages] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(18);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [showStickyIndicator, setShowStickyIndicator] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const answersRef = useRef<Record<string, string>>({});
  const [lastAudioPosition, setLastAudioPosition] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);

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

        // Load completion status and audio position from API
        const progress = await AdminService.getChapterProgress(id);
        setIsCompleted(progress.is_completed);
        setIsAudioFinished(progress.is_audio_finished || false);
        setLastAudioPosition(progress.last_audio_position || 0);
        setProgressLoaded(true);

        // Load saved answers from API
        const savedAnswers = await AdminService.getChapterAnswers(id);
        const answersMap: Record<string, string> = {};
        savedAnswers.forEach(a => {
          answersMap[a.question_id] = a.answer;
        });
        setAnswers(answersMap);
        // Keep ref in sync but don't trigger autosave
        answersRef.current = answersMap;
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
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderSticky(scrollY > 40);

      // Check if we are still within the content area
      if (contentAreaRef.current) {
        const rect = contentAreaRef.current.getBoundingClientRect();
        // The indicator should show only when the content area is being scrolled through
        // and the bottom of the content area hasn't reached the header yet
        const headerHeight = 80;
        const isWithinContent = rect.top < headerHeight && rect.bottom > headerHeight + 40;
        setShowStickyIndicator(isWithinContent);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageIndex]);

  // Swipe handlers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextPage();
    } else if (isRightSwipe) {
      goToPreviousPage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => {
      const aRead = readPages.has(a.id);
      const bRead = readPages.has(b.id);
      if (aRead === bRead) return a.order_index - b.order_index;
      return aRead ? 1 : -1;
    });
  }, [pages, readPages]);

  const currentPage = sortedPages[currentPageIndex];

  const handleTogglePageRead = async () => {
    if (!chapter || !currentPage || !id) return;
    
    const isCurrentlyRead = readPages.has(currentPage.id);
    const currentPageId = currentPage.id;
    
    try {
      if (isCurrentlyRead) {
        await AdminService.markPageAsUnread(id, currentPageId);
        setReadPages(prev => {
          const next = new Set(prev);
          next.delete(currentPageId);
          return next;
        });

        // Ao desmarcar como lida, a página volta para a seção de "não lidas" (topo).
        // Precisamos encontrar o novo índice dela na lista reordenada para manter o usuário nela.
        // O useMemo sortedPages será recalculado após o setReadPages.
        // Como o sortedPages depende do order_index e readPages, a página desmarcada
        // irá para sua posição original baseada no order_index entre as não lidas.
        
        // Encontramos onde ela ficará:
        const unreadPagesBefore = pages.filter(p => p.id !== currentPageId && !readPages.has(p.id));
        const newIndex = unreadPagesBefore.filter(p => p.order_index < currentPage.order_index).length;
        
        setCurrentPageIndex(newIndex);
      } else {
        await AdminService.markPageAsRead(id, currentPageId);
        setReadPages(prev => new Set([...prev, currentPageId]));
        // Quando marca como lida, o comportamento padrão permanece voltar para o início (próxima não lida)
        setCurrentPageIndex(0);
      }
    } catch (error) {
      console.error('Failed to toggle page read status:', error);
    }
  };

  const goToNextPage = () => {
    if (sortedPages.length === 0) return;
    if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else {
      // Loop to the first page
      setCurrentPageIndex(0);
    }
  };

  const goToPreviousPage = () => {
    if (sortedPages.length === 0) return;
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else {
      // Loop to the last page
      setCurrentPageIndex(sortedPages.length - 1);
    }
  };

  const getModalContent = useCallback((modalId: string): string => {
    // Check if it's a reference ID in the current page's content_modals
    // Use sortedPages instead of pages to ensure we're looking at the correctly indexed page
    const currentPage = sortedPages[currentPageIndex];
    const currentPageModals = currentPage?.content_modals;
    
    if (currentPageModals && currentPageModals[modalId]) {
      return currentPageModals[modalId].content;
    }
    
    // Fallback: search across all pages in this chapter if not found on current page
    for (const page of pages) {
      if (page.content_modals && page.content_modals[modalId]) {
        return page.content_modals[modalId].content;
      }
    }
    
    console.warn('Modal content ID reference not found on any page:', modalId);
    return 'Conteúdo não encontrado.';
  }, [sortedPages, pages, currentPageIndex]);

  const handleModalClick = useCallback((title: string, modalId: string) => {
    const content = getModalContent(modalId);
    setModalContent({
      title,
      content
    });
  }, [getModalContent]);

  const renderContent = (content: string) => {
    return (
      <MarkdownRenderer 
        content={content} 
        onModalClick={handleModalClick} 
      />
    );
  };

  // Track if user has made changes (not just loaded from API)
  const hasUserChangesRef = useRef(false);

  // Autosave debounce - 5 seconds after last user change
  useEffect(() => {
    if (!hasUserChangesRef.current) return;
    
    const timer = setTimeout(async () => {
      if (!id) return;
      
      setIsSaving(true);
      setIsSaved(false);
      
      try {
        for (const [qId, text] of Object.entries(answersRef.current)) {
          await AdminService.saveUserAnswer(id, qId, text);
        }
        
        setIsSaved(true);
        hasUserChangesRef.current = false;
        setTimeout(() => setIsSaved(false), 3000);
      } catch (error) {
        console.error('Failed to autosave answers:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [answers, id]);


  const totalPagesInChapter = useMemo(() => {
    if (pages.length === 0) return 0;
    return Math.max(...pages.map(p => p.page_number));
  }, [pages]);

  const allQuestionsAnswered = useMemo(() => {
    if (questions.length === 0) return true;
    return questions.every(q => answers[q.id]?.trim().length > 0);
  }, [questions, answers]);

  const allPagesRead = useMemo(() => {
    if (pages.length === 0) return true;
    return pages.every(p => readPages.has(p.id));
  }, [pages, readPages]);

  const canComplete = useMemo(() => {
    return allQuestionsAnswered && (isAudioFinished || allPagesRead);
  }, [allQuestionsAnswered, isAudioFinished, allPagesRead]);

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
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  return (
    <div className={`chapter-detail-layout theme-${theme}`}>
      <header className={`glass detail-header ${isHeaderSticky ? 'sticky-active' : ''}`}>
        <div className="back-and-status">
          <button onClick={() => navigate('/dashboard')} className='back-btn'>
            <ChevronLeft size={24} />
          </button>
          <AnimatePresence>
            {(isSaving || isSaved) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="autosave-hint"
              >
                {isSaving ? (
                  <span className="saving">
                    <Save size={14} className="spin" /> Salvando...
                  </span>
                ) : (
                  <span className="saved">
                    <CheckCircle2 size={14} /> Salvo
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
        
        <div className={`sticky-page-indicator ${showStickyIndicator ? 'visible' : ''}`}>
          Página {currentPage?.page_number || currentPageIndex + 1} de {totalPagesInChapter}
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
              ref={contentAreaRef}
              key={currentPageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className='reading-content'
              style={{ fontSize: `${fontSize}px` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentPage?.subtitle && (
                <h3 className='page-subtitle'>{currentPage.subtitle}</h3>
              )}
              
              <div className='page-number-indicator'>
                Página {currentPage?.page_number || currentPageIndex + 1} de {totalPagesInChapter}
              </div>

              <div className='page-content'>
                {currentPage ? renderContent(currentPage.content) : 'Conteúdo não disponível'}
              </div>

              <div className='page-read-marker'>
                {readPages.has(currentPage?.id || '') ? (
                  <button onClick={handleTogglePageRead} className='read-badge btn-unread'>
                    <CheckCircle2 size={16} /> Página lida (Desmarcar)
                  </button>
                ) : (
                  <button onClick={handleTogglePageRead} className='btn-mark-read'>
                    <CheckCircle2 size={16} /> Marcar como lida
                  </button>
                )}
              </div>
            </motion.div>

            <div className='page-navigation'>
              <button 
                onClick={goToPreviousPage} 
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
                className='btn-nav btn-next'
              >
                Próxima <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}

        {chapter.audio_url && progressLoaded && id && (
          <AudioPlayer
            chapterId={id}
            audioUrl={chapter.audio_url}
            initialPosition={lastAudioPosition}
            isAudioFinished={isAudioFinished}
            onAudioFinishedChange={setIsAudioFinished}
          />
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
                  onChange={(e) => {
                    const newAnswers = { ...answers, [q.id]: e.target.value };
                    setAnswers(newAnswers);
                    answersRef.current = newAnswers;
                    hasUserChangesRef.current = true;
                  }}
                  placeholder='Escreva sua resposta aqui...'
                />
              </div>
            ))}
          </div>

          <div className='action-buttons'>
            <button
              onClick={handleToggleCompletion}
              className={`btn-complete-lesson ${isCompleted ? 'completed' : ''} ${!isCompleted && !canComplete ? 'disabled' : ''}`}
              disabled={!isCompleted && !canComplete}
              title={!canComplete ? 'Responda todas as perguntas e ouça o áudio ou leia todas as páginas para concluir' : ''}
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
            {!isCompleted && !canComplete && (
              <p className="completion-requirement-hint">
                {!allQuestionsAnswered && "• Responda todas as perguntas "}
                {!(isAudioFinished || allPagesRead) && "• Ouça o áudio completo ou leia todas as páginas"}
              </p>
            )}
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

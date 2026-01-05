import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { chapters } from '../data/chapters';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pause, Type, Moon, Sun, Book, Save, Volume2, CheckCircle2, X } from 'lucide-react';
import { DBService } from '../db/db-service';

interface AnswerRow {
  question_id: number;
  answer: string;
}

const ChapterDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapter = chapters.find((c) => c.id === parseInt(id || '1'));

  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [isPlaying, setIsPlaying] = useState(searchParams.get('autoPlay') === 'true');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!chapter) return;

      // Load answers from DB
      const result = await DBService.getAll<AnswerRow>(
        'SELECT question_id, answer FROM user_answers WHERE chapter_id = ?',
        [chapter.id]
      );
      const savedAnswers = result.reduce((acc: Record<number, string>, row: AnswerRow) => {
        acc[row.question_id] = row.answer;
        return acc;
      }, {});
      setAnswers(savedAnswers);

      // Load completion status
      const progress = await DBService.get<{ is_completed: number }>(
        'SELECT is_completed FROM progress WHERE chapter_id = ?',
        [chapter.id]
      );
      setIsCompleted(progress?.is_completed === 1);

      // Mark as read when opened
      await DBService.exec('INSERT OR REPLACE INTO progress (chapter_id, is_read) VALUES (?, 1)', [chapter.id]);
    };
    loadData();
  }, [chapter]);

  if (!chapter) return <div>Capítulo não encontrado</div>;

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='reading-content'
          style={{ fontSize: `${fontSize}px` }}
        >
          {chapter.content}
          <div className='text-placeholder'>
            <p>
              Aqui viria o texto completo do livro "Eventos Finais" de Ellen White. O layout é focado em leitura livre
              de distrações, com tipografia clara e controle de contraste.
            </p>
          </div>
        </motion.div>

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
            src={chapter.audioUrl}
            onEnded={() => setIsPlaying(false)}
            autoPlay={searchParams.get('autoPlay') === 'true'}
          />
        </section>

        <section className='study-questions card'>
          <h3>
            <Book size={20} /> Estudo do Capítulo
          </h3>
          <p>Responda às questões abaixo para aprofundar seu conhecimento.</p>

          <div className='questions-list'>
            {chapter.questions.map((q) => (
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
      </main>
    </div>
  );
};

export default ChapterDetail;

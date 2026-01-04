import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { chapters } from '../data/chapters';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pause, Type, Moon, Sun, Book, Save, CheckCircle, Volume2 } from 'lucide-react';
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

      // Mark as read when opened
      await DBService.exec('INSERT OR REPLACE INTO progress (chapter_id, is_read) VALUES (?, 1)', [chapter.id]);
    };
    loadData();
  }, [chapter]);

  if (!chapter) return <div>Capítulo não encontrado</div>;

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

          <button onClick={handleSaveAnswers} className='btn-primary save-btn'>
            {isSaved ? (
              <>
                <CheckCircle size={20} /> Salvo
              </>
            ) : (
              <>
                <Save size={20} /> Salvar Respostas
              </>
            )}
          </button>
        </section>
      </main>

      <style>{`
        .chapter-detail-layout {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 50px;
          transition: background 0.5s ease;
        }
        .theme-dark { background: #0a0a0a; --text: #e0e0e0; }
        .theme-sepia { background: #f4ecd8; --text: #433422; --primary: #8b5a2b; }
        .theme-light { background: #ffffff; --text: #222222; --primary: #333333; }

        .theme-sepia h2, .theme-sepia h3, .theme-sepia h4, .theme-sepia span { color: #433422; }
        .theme-light h2, .theme-light h3, .theme-light h4, .theme-light span { color: #222; }

        .detail-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          align-items: center;
          padding: 0 1rem;
          justify-content: space-between;
          z-index: 1000;
        }
        .header-title { text-align: center; }
        .header-title span { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary); font-weight: 700; }
        .header-title h2 { font-size: 1.1rem; margin: 0; }
        
        .header-controls { display: flex; gap: 0.5rem; }
        .control-btn, .back-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: var(--text);
          background: rgba(255,255,255,0.05);
        }
        .theme-sepia .control-btn, .theme-sepia .back-btn { background: rgba(0,0,0,0.05); }

        .reading-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .reading-content {
          line-height: 1.8;
          margin-bottom: 4rem;
          color: var(--text);
        }
        .text-placeholder {
          margin-top: 2rem;
          padding: 2rem;
          border-left: 2px solid var(--primary);
          font-style: italic;
          opacity: 0.8;
        }

        .audio-player-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 1.2rem;
        }
        .player-info h4 { margin: 0; }
        .player-info p { margin: 0; font-size: 0.8rem; color: var(--text-dim); }
        .play-btn {
          width: 56px;
          height: 56px;
          background: var(--primary);
          color: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }
        .play-btn:hover { transform: scale(1.1); box-shadow: 0 0 20px var(--primary-glow); }

        .study-questions {
          margin-top: 3rem;
        }
        .study-questions h3 { margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .study-questions p { color: var(--text-dim); font-size: 0.9rem; margin-bottom: 2rem; }
        
        .questions-list { display: flex; flex-direction: column; gap: 1.8rem; }
        .question-item { display: flex; flex-direction: column; gap: 0.8rem; }
        .question-item label { font-weight: 600; font-size: 1rem; color: var(--text); }
        .question-item textarea {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 1rem;
          color: var(--text);
          font-family: inherit;
          font-size: 1rem;
          min-height: 100px;
          resize: vertical;
        }
        .theme-sepia .question-item textarea, .theme-light .question-item textarea {
           background: rgba(255,255,255,0.5);
           border-color: rgba(0,0,0,0.1);
        }

        .save-btn { margin-top: 2rem; width: 100%; }

        @media (max-width: 600px) {
          .header-title h2 { font-size: 0.9rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .reading-content { line-height: 1.6; }
        }
      `}</style>
    </div>
  );
};

export default ChapterDetail;

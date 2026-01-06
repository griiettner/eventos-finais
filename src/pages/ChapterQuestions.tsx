import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Save, MessageSquare } from 'lucide-react';
import { AdminService, type Chapter } from '../services/admin-service';

interface QuestionForm {
  id?: string;
  text: string;
  page_reference: string; // "Página X, Parágrafo Y"
  order_index: number;
}

const ChapterQuestions: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      // Load chapter info
      const chapterData = await AdminService.getChapter(id);
      setChapter(chapterData);
      
      // Load existing questions
      const questionsData = await AdminService.getChapterQuestions(id);
      
      if (questionsData.length > 0) {
        // Parse existing questions - extract page_reference from text if embedded
        const formattedQuestions = questionsData.map((q, index) => {
          // Try to extract page reference from text (format: "Pergunta: ... | Página: X, Parágrafo: Y")
          const parts = q.text.split(' | Página: ');
          const questionText = parts[0];
          const pageRef = parts.length > 1 ? `Página ${parts[1]}` : '';
          
          return {
            id: q.id,
            text: questionText,
            page_reference: pageRef,
            order_index: q.order_index ?? index
          };
        });
        setQuestions(formattedQuestions);
      } else {
        // Start with one empty question
        setQuestions([{ text: '', page_reference: '', order_index: 0 }]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Erro ao carregar dados do capítulo');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        page_reference: '',
        order_index: questions.length
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    if (!id) return;
    
    setIsSaving(true);
    try {
      // Delete all existing questions
      const existingQuestions = await AdminService.getChapterQuestions(id);
      for (const q of existingQuestions) {
        await AdminService.deleteQuestion(q.id);
      }

      // Create new questions with embedded page reference
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.text.trim()) {
          // Format: "Question text | Página: X, Parágrafo: Y" or just "Question text" if no page ref
          const fullText = q.page_reference.trim() 
            ? `${q.text} | Página: ${q.page_reference.replace(/^Página\s*/i, '')}`
            : q.text;
          
          await AdminService.createQuestion({
            chapter_id: id,
            text: fullText,
            order_index: i
          });
        }
      }

      navigate('/admin');
    } catch (error) {
      console.error('Failed to save questions:', error);
      alert('Erro ao salvar perguntas. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-layout">
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="admin-layout">
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 style={{ color: 'var(--text-dim)' }}>Capítulo não encontrado</h2>
          <button onClick={() => navigate('/admin')} className="btn-primary" style={{ marginTop: '1rem' }}>
            Voltar ao Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <header className="glass admin-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin')} className="back-btn" title="Voltar">
            <ChevronLeft size={24} />
          </button>
          <MessageSquare size={24} className="icon-primary" />
          <h1>Perguntas - {chapter.title}</h1>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary"
        >
          <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </header>

      <main className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="chapter-form-container"
        >
          <div className="questions-page-intro">
            <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
              Adicione perguntas de estudo para o capítulo. Cada pergunta pode referenciar uma página e parágrafo específico.
            </p>
          </div>

          <div className="questions-list-page">
            {questions.map((question, index) => (
              <div key={index} className="question-item-page">
                <div className="question-header-page">
                  <span className="question-number-badge">Pergunta {index + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="btn-remove-page"
                      title="Remover pergunta"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="question-fields">
                  <div className="form-field">
                    <label>Pergunta</label>
                    <textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      placeholder="Digite a pergunta de estudo..."
                      rows={3}
                      className="content-textarea"
                    />
                  </div>

                  <div className="form-field">
                    <label>Página e Parágrafo</label>
                    <input
                      type="text"
                      value={question.page_reference}
                      onChange={(e) => updateQuestion(index, 'page_reference', e.target.value)}
                      placeholder="Ex: 1, Parágrafo 3"
                    />
                    <small className="field-hint">
                      Indique a página e parágrafo onde está a resposta (opcional)
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={addQuestion}
          className="fab-add-page"
          title="Adicionar Pergunta"
        >
          <Plus size={24} />
        </button>
      </main>
    </div>
  );
};

export default ChapterQuestions;

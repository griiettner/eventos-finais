import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { AdminService, type Chapter, type Question } from '../services/admin-service';

interface QuestionsModalProps {
  chapter: Chapter;
  onClose: () => void;
  onSuccess: () => void;
}

const QuestionsModal: React.FC<QuestionsModalProps> = ({ chapter, onClose, onSuccess }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [chapter.id]);

  const loadQuestions = async () => {
    try {
      const data = await AdminService.getChapterQuestions(chapter.id);
      setQuestions(data);
      setEditingQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      chapter_id: chapter.id,
      text: '',
      order_index: editingQuestions.length
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setEditingQuestions(editingQuestions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, text: string) => {
    const newQuestions = [...editingQuestions];
    newQuestions[index] = { ...newQuestions[index], text };
    setEditingQuestions(newQuestions);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...editingQuestions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    
    setEditingQuestions(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Delete all existing questions
      for (const q of questions) {
        await AdminService.deleteQuestion(q.id);
      }

      // Create new questions
      for (let i = 0; i < editingQuestions.length; i++) {
        const q = editingQuestions[i];
        if (q.text.trim()) {
          await AdminService.createQuestion({
            chapter_id: chapter.id,
            text: q.text,
            order_index: i
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save questions:', error);
      alert('Erro ao salvar perguntas. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="modal-backdrop"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-content modal-large"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <MessageSquare className="text-orange" />
            <h3>Estudo e Perguntas</h3>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="questions-manager">
            <div className="questions-header">
              <p>Adicione perguntas de reflexão para o capítulo. Arraste para reordenar.</p>
              <button onClick={addQuestion} className="btn-add-question">
                <Plus size={16} /> Nova Pergunta
              </button>
            </div>

            <div className="questions-list-edit">
              {editingQuestions.length === 0 ? (
                <p className="empty-state">Nenhuma pergunta adicionada ainda.</p>
              ) : (
                editingQuestions.map((q, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`question-edit-item ${draggedIndex === index ? 'dragging' : ''}`}
                  >
                    <div className="drag-handle">
                      <GripVertical size={20} />
                    </div>
                    <div className="question-number">#{index + 1}</div>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="Digite a pergunta..."
                      className="question-input"
                    />
                    <button
                      onClick={() => removeQuestion(index)}
                      className="btn-remove-question"
                      title="Remover pergunta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn-primary"
          >
            <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar Perguntas'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuestionsModal;

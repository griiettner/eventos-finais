import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Trash2, X, FileAudio, 
  MessageSquare, GripVertical, FileText, Check, AlertCircle, Trash
} from 'lucide-react';
import { AdminService, type Chapter, type Question } from '../services/admin-service';

type ModalType = 'text' | 'audio' | 'questions' | 'new_chapter';

const AdminDashboard: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  
  // Text Editor State
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textSummary, setTextSummary] = useState('');

  // Audio State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Questions State
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    try {
      const data = await AdminService.getAllChapters();
      setChapters(data);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestions = async (chapterId: number) => {
    try {
      const data = await AdminService.getChapterQuestions(chapterId);
      setQuestions(data);
      setEditingQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const openModal = (type: ModalType, chapter: Chapter | null) => {
    setSelectedChapter(chapter);
    setActiveModal(type);
    if (chapter) {
      if (type === 'text') {
        setTextContent(chapter.content || '');
        setTextTitle(chapter.title || '');
        setTextSummary(chapter.summary || '');
      } else if (type === 'questions') {
        loadQuestions(chapter.id);
      }
    } else if (type === 'new_chapter') {
      setTextTitle('');
      setTextSummary('');
      setTextContent('');
    }
  };

  const handleSaveText = async () => {
    if (!selectedChapter && activeModal !== 'new_chapter') return;
    
    try {
      if (activeModal === 'new_chapter') {
        await AdminService.createChapter({
          title: textTitle,
          summary: textSummary,
          content: textContent,
          audio_url: '',
          order_index: chapters.length + 1
        });
      } else if (selectedChapter) {
        await AdminService.updateChapter(selectedChapter.id, {
          title: textTitle,
          summary: textSummary,
          content: textContent
        });
      }
      await loadChapters();
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to save text:', error);
    }
  };

  const handleAudioUpload = async () => {
    if (!selectedChapter || !audioFile) return;
    setIsUploading(true);
    try {
      const audioUrl = await AdminService.uploadAudioFile(audioFile);
      await AdminService.updateChapter(selectedChapter.id, { audio_url: audioUrl });
      await loadChapters();
      setActiveModal(null);
      setAudioFile(null);
    } catch (error) {
      console.error('Failed to upload audio:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: Date.now(),
      chapter_id: selectedChapter!.id,
      text: '',
      order_index: editingQuestions.length
    };
    setEditingQuestions([...editingQuestions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const updated = [...editingQuestions];
    updated.splice(index, 1);
    setEditingQuestions(updated.map((q, i) => ({ ...q, order_index: i })));
  };

  const handleSaveQuestions = async () => {
    if (!selectedChapter) return;
    try {
      const existingIds = questions.map(q => q.id);
      const currentIds = editingQuestions.filter(q => q.id < 1000000000000).map(q => q.id);
      
      for (const id of existingIds) {
        if (!currentIds.includes(id)) {
          await AdminService.deleteQuestion(id);
        }
      }

      for (let i = 0; i < editingQuestions.length; i++) {
        const q = editingQuestions[i];
        if (q.id > 1000000000000) {
          await AdminService.createQuestion({
            chapter_id: selectedChapter.id,
            text: q.text,
            order_index: i
          });
        } else {
          await AdminService.updateQuestion(q.id, {
            text: q.text,
            order_index: i
          });
        }
      }

      await loadQuestions(selectedChapter.id);
      setActiveModal(null);
    } catch (error) {
      console.error('Failed to save questions:', error);
    }
  };

  const onDragStart = (index: number) => setDraggedIndex(index);
  
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...editingQuestions];
    const item = updated.splice(draggedIndex, 1)[0];
    updated.splice(index, 0, item);
    setEditingQuestions(updated.map((q, i) => ({ ...q, order_index: i })));
    setDraggedIndex(index);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <header className="admin-header">
          <div className="header-titles">
            <h1>Painel Administrativo</h1>
            <p>Gerencie capítulos, áudios e perguntas</p>
          </div>
          <button 
            onClick={() => openModal('new_chapter', null)}
            className="btn-primary add-chapter-btn"
          >
            <Plus size={18} /> Novo Capítulo
          </button>
        </header>

        <section className="admin-section chapters-section">
          <div className="section-header">
            <BookOpen size={20} className="icon-primary" />
            <h2>Capítulos</h2>
          </div>
          
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="col-order">ORDEM</th>
                  <th className="col-title">TÍTULO</th>
                  <th className="col-actions">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) => (
                  <tr key={chapter.id} className="table-row">
                    <td className="cell-order">#{chapter.order_index}</td>
                    <td className="cell-title">
                      <div className="chapter-title-main">{chapter.title}</div>
                      <div className="chapter-summary-sub">{chapter.summary}</div>
                    </td>
                    <td className="cell-actions">
                      <div className="actions-group">
                        <button 
                          onClick={() => openModal('text', chapter)}
                          className="action-btn btn-text"
                          title="Editar Texto"
                        >
                          <FileText size={14} /> TEXTO
                        </button>
                        <button 
                          onClick={() => openModal('audio', chapter)}
                          className="action-btn btn-audio"
                          title="Upload Áudio"
                        >
                          <FileAudio size={14} /> ÁUDIO
                        </button>
                        <button 
                          onClick={() => openModal('questions', chapter)}
                          className="action-btn btn-questions"
                          title="Gerenciar Perguntas"
                        >
                          <MessageSquare size={14} /> PERGUNTAS
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Excluir capítulo?')) {
                              AdminService.deleteChapter(chapter.id).then(loadChapters);
                            }
                          }}
                          className="delete-icon-btn"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AnimatePresence>
          {activeModal && (
            <div className="modal-overlay">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="modal-backdrop"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="modal-content"
              >
                <div className="modal-header">
                  <div className="modal-title-group">
                    {activeModal === 'text' && <FileText className="text-blue" />}
                    {activeModal === 'audio' && <FileAudio className="text-purple" />}
                    {activeModal === 'questions' && <MessageSquare className="text-orange" />}
                    {activeModal === 'new_chapter' && <Plus className="text-primary" />}
                    <h3>
                      {activeModal === 'text' ? 'Editar Conteúdo' : 
                       activeModal === 'audio' ? 'Gerenciar Áudio' : 
                       activeModal === 'questions' ? 'Estudo e Perguntas' : 
                       'Novo Capítulo'}
                    </h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="close-modal-btn">
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-body">
                  {(activeModal === 'text' || activeModal === 'new_chapter') && (
                    <div className="form-group-stack">
                      <div className="form-field">
                        <label>Título do Capítulo</label>
                        <input 
                          type="text" 
                          value={textTitle}
                          onChange={(e) => setTextTitle(e.target.value)}
                          placeholder="Ex: A Grande Esperança"
                        />
                      </div>
                      <div className="form-field">
                        <label>Resumo Curto</label>
                        <textarea 
                          value={textSummary}
                          onChange={(e) => setTextSummary(e.target.value)}
                          rows={2}
                          className="resize-none"
                          placeholder="Uma breve descrição..."
                        />
                      </div>
                      <div className="form-field">
                        <label>Conteúdo para Leitura</label>
                        <textarea 
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          rows={12}
                          className="content-textarea"
                          placeholder="Escreva o conteúdo aqui..."
                        />
                      </div>
                    </div>
                  )}

                  {activeModal === 'audio' && (
                    <div className="audio-manager">
                      {selectedChapter?.audio_url ? (
                        <div className="current-audio">
                          <label>Áudio Atual</label>
                          <audio src={selectedChapter.audio_url} controls className="audio-player" />
                          <div className="audio-url-text">{selectedChapter.audio_url}</div>
                        </div>
                      ) : (
                        <div className="empty-audio">
                          <FileAudio size={48} className="empty-icon" />
                          <p>Nenhum áudio vinculado a este capítulo</p>
                        </div>
                      )}

                      <div className="upload-section">
                        <label>Upload de Novo Arquivo</label>
                        <div className="upload-dropzone">
                          <input 
                            type="file" 
                            accept="audio/*"
                            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                            className="hidden-file-input"
                          />
                          <div className="dropzone-visual">
                            {audioFile ? (
                              <div className="selected-file">
                                <Check size={20} /> {audioFile.name}
                              </div>
                            ) : (
                              <>
                                <Plus size={24} className="plus-icon" />
                                <span className="main-text">Clique ou arraste para selecionar</span>
                                <span className="sub-text">Formatos: MP3, WAV (Max 50MB)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === 'questions' && (
                    <div className="questions-manager">
                      <div className="questions-header">
                        <p className="helper-text">Arraste para reordenar as perguntas do estudo.</p>
                        <button 
                          onClick={handleAddQuestion}
                          className="action-btn btn-questions add-q-btn"
                        >
                          <Plus size={14} /> NOVA PERGUNTA
                        </button>
                      </div>

                      <div className="questions-list">
                        {editingQuestions.map((q, index) => (
                          <div 
                            key={q.id}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            className={`question-row ${draggedIndex === index ? 'dragging' : ''}`}
                          >
                            <div className="drag-handle">
                              <GripVertical size={20} />
                            </div>
                            <div className="question-content">
                              <div className="question-row-header">
                                <span className="q-index">Pergunta #{index + 1}</span>
                                <button 
                                  onClick={() => handleRemoveQuestion(index)}
                                  className="remove-q-btn"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <textarea 
                                value={q.text}
                                onChange={(e) => {
                                  const updated = [...editingQuestions];
                                  updated[index].text = e.target.value;
                                  setEditingQuestions(updated);
                                }}
                                className="q-textarea"
                                placeholder="Qual a sua percepção sobre este tema?"
                                rows={2}
                              />
                            </div>
                          </div>
                        ))}
                        
                        {editingQuestions.length === 0 && (
                          <div className="empty-questions">
                            <AlertCircle size={32} className="empty-icon" />
                            <p>Nenhuma pergunta cadastrada.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="btn-cancel"
                  >
                    Descartar
                  </button>
                  <button 
                    disabled={isUploading || (activeModal === 'audio' && !audioFile)}
                    onClick={activeModal === 'text' || activeModal === 'new_chapter' ? handleSaveText : activeModal === 'audio' ? handleAudioUpload : handleSaveQuestions}
                    className="btn-primary btn-save"
                  >
                    {isUploading ? 'Processando...' : <><Check size={16} /> Salvar Alterações</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;

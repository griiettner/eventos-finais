import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, FileAudio, MessageSquare, Trash, Edit, ArrowLeft } from 'lucide-react';
import { AdminService, type Chapter } from '../services/admin-service';
import AudioUploadModal from '../components/AudioUploadModal';

type ModalType = 'audio';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);

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

  const openModal = (type: ModalType, chapter: Chapter) => {
    setSelectedChapter(chapter);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedChapter(null);
  };

  const handleModalSuccess = () => {
    loadChapters();
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Excluir capítulo? Esta ação não pode ser desfeita.')) return;
    try {
      await AdminService.deleteChapter(chapterId);
      await loadChapters();
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('Erro ao excluir capítulo.');
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

  return (
    <div className="admin-layout">
      <header className="glass admin-header">
        <div className="header-content">
          <button onClick={() => navigate('/dashboard')} className="back-btn" title="Voltar ao Dashboard">
            <ArrowLeft size={20} />
          </button>
          <BookOpen size={28} className="icon-primary" />
          <h1>Admin Dashboard</h1>
        </div>
        <button onClick={() => navigate('/admin/chapter/new')} className="btn-primary">
          <Plus size={18} /> Novo Capítulo
        </button>
      </header>

      <main className="container">
        <section className="admin-section chapters-section">
          <div className="section-header">
            <BookOpen size={20} className="icon-primary" />
            <h2>Capítulos</h2>
          </div>
          
          {chapters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-dim)' }}>Nenhum capítulo criado ainda.</p>
              <button onClick={() => navigate('/admin/chapter/new')} className="btn-primary" style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Criar Primeiro Capítulo
              </button>
            </div>
          ) : (
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
                      </td>
                      <td className="cell-actions">
                        <div className="actions-group">
                          <button onClick={() => navigate(`/admin/chapter/${chapter.id}`)} className="action-btn btn-text" title="Editar Capítulo">
                            <Edit size={14} /> EDITAR
                          </button>
                          <button onClick={() => openModal('audio', chapter)} className="action-btn btn-audio" title="Upload Áudio">
                            <FileAudio size={14} /> ÁUDIO
                          </button>
                          <button onClick={() => navigate(`/admin/chapter/${chapter.id}/questions`)} className="action-btn btn-questions" title="Gerenciar Perguntas">
                            <MessageSquare size={14} /> PERGUNTAS
                          </button>
                          <button onClick={() => handleDeleteChapter(chapter.id)} className="delete-icon-btn" title="Excluir Capítulo">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AnimatePresence>
          {activeModal === 'audio' && selectedChapter && (
            <AudioUploadModal chapter={selectedChapter} onClose={closeModal} onSuccess={handleModalSuccess} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react';
import { AdminService, type ChapterPage } from '../services/admin-service';
import ModalContentEditor from '../components/ModalContentEditor';
import RichTextEditor from '../components/RichTextEditor';

const AddEditChapter: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [textTitle, setTextTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [editingPages, setEditingPages] = useState<Partial<ChapterPage>[]>([
    { subtitle: '', page_number: 1, content: '', order_index: 0, content_modals: {} }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [showModalEditor, setShowModalEditor] = useState(false);
  const [currentPageIndexForModal, setCurrentPageIndexForModal] = useState<number | null>(null);
  const [modalSelection, setModalSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [editingModalData, setEditingPagesModalData] = useState<{ title: string; content: string; id?: string } | null>(null);

  const loadChapter = useCallback(async () => {
    if (!id) return;
    
    try {
      const chapter = await AdminService.getChapter(id);
      if (chapter) {
        setTextTitle(chapter.title);
        setChapterNumber(chapter.order_index);
        
        try {
          const pages = await AdminService.getChapterPages(id);
          setEditingPages(pages.length > 0 ? pages : [{ subtitle: '', page_number: 1, content: '', order_index: 0, content_modals: {} }]);
        } catch (pagesError) {
          console.warn('Failed to load pages (might be missing Firestore index):', pagesError);
          setEditingPages([{ subtitle: '', page_number: 1, content: '', order_index: 0, content_modals: {} }]);
        }
      }
    } catch (error) {
      console.error('Failed to load chapter:', error);
      alert('Erro ao carregar capítulo');
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) {
      loadChapter();
    } else {
      // Get next chapter number
      AdminService.getAllChapters().then(chapters => {
        setChapterNumber(chapters.length + 1);
      });
    }
  }, [isEditing, loadChapter]);

  const addPage = () => {
    setEditingPages([...editingPages, {
      subtitle: '',
      page_number: editingPages.length + 1,
      content: '',
      order_index: editingPages.length,
      content_modals: {}
    }]);
  };

  const removePage = (index: number) => {
    if (editingPages.length <= 1) return;
    const newPages = editingPages.filter((_, i) => i !== index);
    setEditingPages(newPages);
  };

  const updatePage = useCallback((index: number, field: keyof ChapterPage, value: string | number) => {
    setEditingPages(prevPages => {
      const newPages = [...prevPages];
      newPages[index] = { ...newPages[index], [field]: value };
      return newPages;
    });
  }, []);

  const openModalEditor = (pageIndex: number, selectionInfo?: { start: number; end: number; text: string }) => {
    setCurrentPageIndexForModal(pageIndex);
    setEditingPagesModalData(null); // Reset for new modal
    if (selectionInfo) {
      setModalSelection(selectionInfo);
    }
    setShowModalEditor(true);
  };

  const handleModalContentSave = (title: string, content: string) => {
    if (currentPageIndexForModal === null) return;
    
    const modalId = editingModalData?.id || `modal_${Date.now()}`;
    
    // Update local page contentModals
    setEditingPages(prevPages => {
      const newPages = [...prevPages];
      const page = newPages[currentPageIndexForModal];
      newPages[currentPageIndexForModal] = {
        ...page,
        content_modals: {
          ...(page.content_modals || {}),
          [modalId]: { title, content }
        }
      };
      return newPages;
    });

    if (!editingModalData?.id) {
      // It's a new modal, we need to insert the reference at the cursor position
      const page = editingPages[currentPageIndexForModal];
      const text = page.content || '';
      const modalLink = `[${title}](#modal:${modalId})`;
      
      let fullText;
      if (modalSelection) {
        // Insert at captured position
        fullText = text.substring(0, modalSelection.start) + 
                   modalLink + 
                   text.substring(modalSelection.end);
      } else {
        // Fallback: append if no selection info
        fullText = text + modalLink;
      }
      
      updatePage(currentPageIndexForModal, 'content', fullText);
    } else {
      // It's an edit, update the link text if title changed
      const page = editingPages[currentPageIndexForModal];
      const text = page.content || '';
      const modalLinkPattern = new RegExp(`\\[[^\\]]+\\]\\(#modal:${modalId}\\)`, 'g');
      const newModalLink = `[${title}](#modal:${modalId})`;
      const fullText = text.replace(modalLinkPattern, newModalLink);
      updatePage(currentPageIndexForModal, 'content', fullText);
    }

    setShowModalEditor(false);
    setEditingPagesModalData(null);
    setCurrentPageIndexForModal(null);
    setModalSelection(null);
  };

  const handleModalClick = useCallback((modalId: string, pageIndex: number) => {
    const page = editingPages[pageIndex];
    const modalData = page?.content_modals?.[modalId];
    if (modalData) {
      setEditingPagesModalData({ ...modalData, id: modalId });
      setCurrentPageIndexForModal(pageIndex);
      setShowModalEditor(true);
    }
  }, [editingPages]);

  const handleSave = async () => {
    if (!textTitle.trim()) {
      alert('Por favor, preencha o título do capítulo');
      return;
    }

    setIsSaving(true);
    try {
      let chapterId: string;

      if (isEditing && id) {
        chapterId = id;
        await AdminService.updateChapter(chapterId, {
          title: textTitle,
          order_index: chapterNumber,
        });
      } else {
        chapterId = await AdminService.createChapter({
          title: textTitle,
          summary: '',
          content: '',
          audio_url: '',
          order_index: chapterNumber,
        });

        if (!chapterId) {
          throw new Error('Falha ao criar capítulo - ID inválido retornado');
        }
        
        // If it was a new chapter, redirect to edit mode for that ID
        // so it stays on the same page for subsequent saves
        navigate(`/admin/chapters/edit/${chapterId}`, { replace: true });
      }

      // Delete existing pages and create new ones (only for edits)
      try {
        const existingPages = await AdminService.getChapterPages(chapterId);
        for (const page of existingPages) {
          await AdminService.deleteChapterPage(page.id);
        }
      } catch (error) {
        console.warn('Failed to delete existing pages:', error);
      }

      // Save all pages - only if they have content
      for (let i = 0; i < editingPages.length; i++) {
        const page = editingPages[i];
        if (page.content && page.content.trim()) {
          await AdminService.createChapterPage({
            chapter_id: chapterId,
            subtitle: page.subtitle || undefined,
            page_number: page.page_number || i + 1,
            content: page.content,
            content_modals: page.content_modals,
            order_index: i,
          });
        }
      }

      // Refresh pages from server to ensure IDs are updated
      const updatedPages = await AdminService.getChapterPages(chapterId);
      setEditingPages(updatedPages.length > 0 ? updatedPages : [{ subtitle: '', page_number: 1, content: '', order_index: 0, content_modals: {} }]);

    } catch (error) {
      console.error('Failed to save chapter:', error);
      alert(`Erro ao salvar capítulo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-layout">
      <header className="glass admin-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          <ChevronLeft size={24} />
        </button>
        <h1>{isEditing ? 'Editar Capítulo' : 'Novo Capítulo'}</h1>
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
              <label>Número do Capítulo</label>
              <input 
                type="number"
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                min="1"
                placeholder="Ex: 1, 2, 3..."
              />
            </div>

            <div className="pages-section">
              <div className="pages-header">
                <label>Páginas do Capítulo</label>
              </div>

              <div className="pages-list">
                {editingPages.map((page, index) => (
                  <div key={index} className="page-item">
                    <div className="page-header">
                      <span className="page-number-badge">Página {index + 1}</span>
                      {editingPages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePage(index)}
                          className="btn-remove-page"
                          title="Remover página"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="page-fields">
                      <div className="form-field">
                        <label>Subtítulo (opcional)</label>
                        <input 
                          type="text"
                          value={page.subtitle || ''}
                          onChange={(e) => updatePage(index, 'subtitle', e.target.value)}
                          placeholder="Ex: Introdução, A Promessa, etc."
                        />
                      </div>

                      <div className="form-field">
                        <label>Número da Página</label>
                        <input 
                          type="number"
                          value={page.page_number || index + 1}
                          onChange={(e) => updatePage(index, 'page_number', parseInt(e.target.value) || index + 1)}
                          min="1"
                        />
                      </div>

                      <div className="form-field">
                        <label>Conteúdo</label>
                        <RichTextEditor
                          content={page.content || ''}
                          onChange={(newContent: string) => updatePage(index, 'content', newContent)}
                          onOpenModalEditor={(selectionInfo) => openModalEditor(index, selectionInfo)}
                          onModalClick={(modalId: string) => handleModalClick(modalId, index)}
                          placeholder="Escreva o conteúdo da página aqui..."
                        />
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showModalEditor && (
            <ModalContentEditor
              initialTitle={editingModalData?.title}
              initialContent={editingModalData?.content}
              onSave={handleModalContentSave}
              onClose={() => {
                setShowModalEditor(false);
                setEditingPagesModalData(null);
                setCurrentPageIndexForModal(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={addPage}
          className="fab-add-page"
          title="Adicionar Página"
        >
          <Plus size={24} />
        </button>
      </main>
    </div>
  );
};

export default AddEditChapter;

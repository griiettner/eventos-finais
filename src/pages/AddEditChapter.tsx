import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Trash2, Save } from 'lucide-react';
import { AdminService, type ChapterPage } from '../services/admin-service';
import ModalContentEditor from '../components/ModalContentEditor';

const AddEditChapter: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [textTitle, setTextTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [editingPages, setEditingPages] = useState<Partial<ChapterPage>[]>([
    { subtitle: '', page_number: 1, content: '', order_index: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [showModalEditor, setShowModalEditor] = useState(false);
  const [currentPageIndexForModal, setCurrentPageIndexForModal] = useState<number | null>(null);
  const textareaRefsMap = useRef<Map<number, HTMLTextAreaElement>>(new Map());

  useEffect(() => {
    if (isEditing) {
      loadChapter();
    } else {
      // Get next chapter number
      AdminService.getAllChapters().then(chapters => {
        setChapterNumber(chapters.length + 1);
      });
    }
  }, [id]);

  const loadChapter = async () => {
    if (!id) return;
    
    try {
      const chapter = await AdminService.getChapter(id);
      if (chapter) {
        setTextTitle(chapter.title);
        setChapterNumber(chapter.order_index);
        
        try {
          const pages = await AdminService.getChapterPages(id);
          setEditingPages(pages.length > 0 ? pages : [{ subtitle: '', page_number: 1, content: '', order_index: 0 }]);
        } catch (pagesError) {
          console.warn('Failed to load pages (might be missing Firestore index):', pagesError);
          // Continue with empty page - user can add pages
          setEditingPages([{ subtitle: '', page_number: 1, content: '', order_index: 0 }]);
        }
      }
    } catch (error) {
      console.error('Failed to load chapter:', error);
      alert('Erro ao carregar capítulo');
    }
  };

  const addPage = () => {
    setEditingPages([...editingPages, {
      subtitle: '',
      page_number: editingPages.length + 1,
      content: '',
      order_index: editingPages.length
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

  const insertFormatting = useCallback((pageIndex: number, format: 'bold' | 'italic' | 'link') => {
    const textarea = textareaRefsMap.current.get(pageIndex);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        newText = `**${selectedText || 'texto em negrito'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'texto em itálico'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'link':
        newText = `[${selectedText || 'texto do link'}](https://exemplo.com)`;
        cursorOffset = selectedText ? newText.length - 22 : 1;
        break;
    }

    const fullText = beforeText + newText + afterText;
    updatePage(pageIndex, 'content', fullText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [updatePage]);

  const openModalEditor = (pageIndex: number) => {
    setCurrentPageIndexForModal(pageIndex);
    setShowModalEditor(true);
  };

  const handleModalContentSave = (title: string, content: string) => {
    if (currentPageIndexForModal === null) return;
    
    const textarea = textareaRefsMap.current.get(currentPageIndexForModal);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(start);

    // Encode content to base64 to embed it in the link
    const encodedContent = btoa(encodeURIComponent(content));
    const modalLink = `[${title}](#modal:${encodedContent})`;
    
    const fullText = beforeText + modalLink + afterText;
    updatePage(currentPageIndexForModal, 'content', fullText);

    setShowModalEditor(false);
    setCurrentPageIndexForModal(null);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + modalLink.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const setTextareaRef = useCallback((pageIndex: number, ref: HTMLTextAreaElement | null) => {
    if (ref) {
      textareaRefsMap.current.set(pageIndex, ref);
    } else {
      textareaRefsMap.current.delete(pageIndex);
    }
  }, []);

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
          order_index: chapterNumber
        });
      } else {
        chapterId = await AdminService.createChapter({
          title: textTitle,
          summary: '',
          content: '',
          audio_url: '',
          order_index: chapterNumber
        });
        
        if (!chapterId) {
          throw new Error('Falha ao criar capítulo - ID inválido retornado');
        }
      }

      // Delete existing pages and create new ones (only for edits)
      if (isEditing) {
        try {
          const existingPages = await AdminService.getChapterPages(chapterId);
          for (const page of existingPages) {
            await AdminService.deleteChapterPage(page.id);
          }
        } catch (error) {
          console.warn('Failed to delete existing pages:', error);
          // Continue anyway - might be missing index
        }
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
            order_index: i
          });
        }
      }

      navigate('/admin');
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
                        <div className="rich-text-toolbar">
                          <button
                            type="button"
                            onClick={() => insertFormatting(index, 'bold')}
                            className="toolbar-btn"
                            title="Negrito"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting(index, 'italic')}
                            className="toolbar-btn"
                            title="Itálico"
                          >
                            <em>I</em>
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting(index, 'link')}
                            className="toolbar-btn"
                            title="Link Regular"
                          >
                            🔗 Link
                          </button>
                          <button
                            type="button"
                            onClick={() => openModalEditor(index)}
                            className="toolbar-btn"
                            title="Criar Modal com Conteúdo"
                          >
                            📖 Modal
                          </button>
                        </div>
                        <textarea 
                          ref={(ref) => setTextareaRef(index, ref)}
                          value={page.content || ''}
                          onChange={(e) => updatePage(index, 'content', e.target.value)}
                          rows={8}
                          className="content-textarea"
                          placeholder="Escreva o conteúdo da página aqui..."
                        />
                        <small className="field-hint">
                          Use os botões acima para formatar o texto. **negrito**, *itálico*, [link](url), [modal](#modal:id)
                        </small>
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
              onSave={handleModalContentSave}
              onClose={() => {
                setShowModalEditor(false);
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

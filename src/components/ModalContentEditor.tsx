import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Type } from 'lucide-react';

interface ModalContentEditorProps {
  onSave: (title: string, content: string) => void;
  onClose: () => void;
}

const ModalContentEditor: React.FC<ModalContentEditorProps> = ({ onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (format: 'bold' | 'italic' | 'header') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);

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
      case 'header':
        newText = `##${selectedText || 'cabeçalho'}##`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
    }

    const fullText = beforeText + newText + afterText;
    setContent(fullText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + cursorOffset;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, adicione um título para o modal');
      return;
    }
    if (!content.trim()) {
      alert('Por favor, adicione conteúdo para o modal');
      return;
    }
    onSave(title, content);
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Type className="text-accent" />
            <h3>Criar Conteúdo do Modal</h3>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group-stack">
            <div className="form-field">
              <label>Título do Modal</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Apocalipse 14:6-12"
                autoFocus
              />
            </div>

            <div className="form-field">
              <label>Conteúdo</label>
              <div className="rich-text-toolbar">
                <button
                  type="button"
                  onClick={() => insertFormatting('bold')}
                  className="toolbar-btn"
                  title="Negrito"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('italic')}
                  className="toolbar-btn"
                  title="Itálico"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('header')}
                  className="toolbar-btn"
                  title="Cabeçalho (maior, negrito, centralizado)"
                >
                  <strong>H</strong>
                </button>
              </div>
              <textarea 
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="content-textarea"
                placeholder="Digite o conteúdo que aparecerá no modal..."
              />
              <small className="field-hint">
                Use os botões para formatar: **negrito**, *itálico*, ##cabeçalho##
              </small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={16} /> Inserir Modal
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalContentEditor;

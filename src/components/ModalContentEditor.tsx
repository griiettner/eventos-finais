import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Type } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

interface ModalContentEditorProps {
  initialTitle?: string;
  initialContent?: string;
  onSave: (title: string, content: string) => void;
  onClose: () => void;
}

const ModalContentEditor: React.FC<ModalContentEditorProps> = ({ 
  initialTitle = '', 
  initialContent = '', 
  onSave, 
  onClose
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

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
            <h3>Conteúdo do Modal</h3>
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
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Digite o conteúdo que aparecerá no modal..."
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary btn-base">
            <Save size={16} /> Salvar Modal
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ModalContentEditor;

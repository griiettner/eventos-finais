import React from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ContentModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({ title, content, onClose }) => {
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
        className="modal-content modal-medium"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <BookOpen className="text-accent" />
            <h3>{title}</h3>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="content-modal-text">
            <MarkdownRenderer content={content} />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary btn-base">
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentModal;

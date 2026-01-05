import React from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';

interface ContentModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({ title, content, onClose }) => {
  const renderFormattedContent = (text: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let currentIndex = 0;
    
    // Regex for bold, italic, and headers
    const formatRegex = /(##([^#]+)##)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      if (match[1]) {
        // Header: ##text##
        parts.push(
          <div key={match.index} className="modal-content-header">
            {match[2]}
          </div>
        );
      } else if (match[3]) {
        // Bold: **text**
        parts.push(<strong key={match.index}>{match[4]}</strong>);
      } else if (match[5]) {
        // Italic: *text*
        parts.push(<em key={match.index}>{match[6]}</em>);
      }

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
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
            {renderFormattedContent(content)}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContentModal;

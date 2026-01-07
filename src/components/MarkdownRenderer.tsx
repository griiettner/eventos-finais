import React, { useCallback } from 'react';

interface MarkdownRendererProps {
  content: string;
  onModalClick?: (title: string, modalId: string) => void;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  onModalClick,
  className = ''
}) => {
  const renderInlineFormatting = useCallback((text: string) => {
    const parts: (string | React.ReactNode)[] = [];
    let currentIndex = 0;
    
    // Regex for bold, italic, and links/modals
    const formatRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|\[([^\]]+)\]\(([^)]+)\)|(<u>(.*?)<\/u>)|(<mark>(.*?)<\/mark>)|(\[\^(\d+)\])/g;
    let match;

    while ((match = formatRegex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      if (match[1]) {
        // Bold
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3]) {
        // Italic
        parts.push(<em key={match.index}>{match[4]}</em>);
      } else if (match[5] && match[6]) {
        // Link or Modal
        const linkText = match[5];
        const linkUrl = match[6];
        
        if (linkUrl.startsWith('#modal:')) {
          const modalId = linkUrl.substring(7);
          parts.push(
            <button
              key={match.index}
              onClick={(e) => {
                e.stopPropagation();
                if (onModalClick) onModalClick(linkText, modalId);
              }}
              className="content-link content-modal-link"
            >
              {linkText}
            </button>
          );
        } else {
          parts.push(
            <a 
              key={match.index} 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="content-link"
            >
              {linkText}
            </a>
          );
        }
      } else if (match[7]) {
        // Underline
        parts.push(<u key={match.index}>{match[8]}</u>);
      } else if (match[9]) {
        // Highlight
        parts.push(<mark key={match.index}>{match[10]}</mark>);
      } else if (match[11]) {
        // Footnote
        parts.push(<sup key={match.index} title="Nota de rodapé">{match[12]}</sup>);
      }

      currentIndex = match.index + match[0].length;
    }

    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts.length > 0 ? parts : text;
  }, [onModalClick]);

  if (!content) return null;

  const lines = content.split('\n');
  
  return (
    <div className={`markdown-renderer ${className}`}>
      {lines.map((line, lineIdx) => {
        const trimmedLine = line.trim();
        
        // Handle HTML align divs
        const alignMatch = line.match(/^<div align="(left|center|right)">$/i);
        if (alignMatch) return null;
        if (trimmedLine === '</div>') return null;

        // Handle Headings
        const headingMatch = line.match(/^(\s*)(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[2].length;
          const text = headingMatch[3];
          const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
          return <Tag key={`h-${lineIdx}`}>{renderInlineFormatting(text)}</Tag>;
        }

        // Handle Bullet Lists
        const listMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
        if (listMatch) {
          return (
            <ul key={`ul-${lineIdx}`} className="markdown-list-dot">
              <li key={`li-${lineIdx}`}>{renderInlineFormatting(listMatch[1])}</li>
            </ul>
          );
        }

        // Handle Numbered Lists
        const numListMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
        if (numListMatch) {
          return (
            <ol key={`ol-${lineIdx}`} className="markdown-list-num">
              <li key={`li-${lineIdx}`}>{renderInlineFormatting(numListMatch[1])}</li>
            </ol>
          );
        }

        // Handle Definition Lists (Term: Definition)
        const defMatch = line.match(/^:\s+(.+)$/);
        if (defMatch && lineIdx > 0) {
          return (
            <dd key={`dd-${lineIdx}`} className="markdown-dd">
              {renderInlineFormatting(defMatch[1])}
            </dd>
          );
        }

        // Handle Empty lines
        if (line.trim() === '') {
          return <div key={`br-${lineIdx}`} className="markdown-br" />;
        }

        return <p key={`p-${lineIdx}`}>{renderInlineFormatting(line)}</p>;
      }).filter(Boolean)}
    </div>
  );
};

export default MarkdownRenderer;

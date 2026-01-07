import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Link as LinkIcon, Book, Type, List, ListOrdered, Underline, AlignLeft, AlignCenter, AlignRight, Info, Highlighter } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface RichTextEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onOpenModalEditor?: (selectionInfo?: { start: number; end: number; text: string }) => void;
  onModalClick?: (modalId: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  onOpenModalEditor,
  onModalClick,
  placeholder = "Escreva seu conteúdo aqui..."
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'edit') {
      adjustTextareaHeight();
    }
  }, [activeTab, content, adjustTextareaHeight]);

  const insertFormatting = useCallback((format: string) => {
    const textarea = textareaRef.current;
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
        newText = `**${selectedText || 'texto'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || 'texto'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'underline':
        newText = `<u>${selectedText || 'texto'}</u>`;
        cursorOffset = selectedText ? newText.length : 3;
        break;
      case 'highlight':
        newText = `<mark>${selectedText || 'texto'}</mark>`;
        cursorOffset = selectedText ? newText.length : 6;
        break;
      case 'link':
        newText = `[${selectedText || 'texto'}](https://)`;
        cursorOffset = selectedText ? newText.length - 8 : 1;
        break;
      case 'h1': newText = `\n# ${selectedText || 'Título 1'}\n`; break;
      case 'h2': newText = `\n## ${selectedText || 'Título 2'}\n`; break;
      case 'h3': newText = `\n### ${selectedText || 'Título 3'}\n`; break;
      case 'list-dot': newText = `\n- ${selectedText || 'item'}\n`; break;
      case 'list-num': newText = `\n1. ${selectedText || 'item'}\n`; break;
      case 'align-left': newText = `\n<div align="left">\n${selectedText || 'texto'}\n</div>\n`; break;
      case 'align-center': newText = `\n<div align="center">\n${selectedText || 'texto'}\n</div>\n`; break;
      case 'align-right': newText = `\n<div align="right">\n${selectedText || 'texto'}\n</div>\n`; break;
      case 'footnote': newText = `${selectedText || 'texto'}[^1]\n\n[^1]: Nota de rodapé`; break;
      case 'definition': newText = `\n${selectedText || 'Termo'}\n: Definição do termo\n`; break;
    }

    const fullText = beforeText + newText + afterText;
    onChange(fullText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + (cursorOffset || newText.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      adjustTextareaHeight();
    }, 0);
  }, [onChange, adjustTextareaHeight]);

  const handleOpenModal = useCallback(() => {
    if (onOpenModalEditor && textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = textareaRef.current.value.substring(start, end);
      onOpenModalEditor({ start, end, text });
    }
  }, [onOpenModalEditor]);

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar">
        <div className="toolbar-group">
          <select 
            className="toolbar-select"
            onChange={(e) => {
              if (e.target.value) {
                insertFormatting(e.target.value);
                e.target.value = '';
              }
            }}
            title="Cabeçalhos"
          >
            <option value="">Texto</option>
            <option value="h1">H1 - Título</option>
            <option value="h2">H2 - Subtítulo</option>
            <option value="h3">H3 - Seção</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertFormatting('bold')} className="toolbar-btn" title="Negrito"><Bold size={16} /></button>
          <button type="button" onClick={() => insertFormatting('italic')} className="toolbar-btn" title="Itálico"><Italic size={16} /></button>
          <button type="button" onClick={() => insertFormatting('underline')} className="toolbar-btn" title="Sublinhado"><Underline size={16} /></button>
          <button type="button" onClick={() => insertFormatting('highlight')} className="toolbar-btn" title="Destaque"><Highlighter size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertFormatting('list-dot')} className="toolbar-btn" title="Lista com Marcadores"><List size={16} /></button>
          <button type="button" onClick={() => insertFormatting('list-num')} className="toolbar-btn" title="Lista Numerada"><ListOrdered size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertFormatting('align-left')} className="toolbar-btn" title="Alinhar à Esquerda"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => insertFormatting('align-center')} className="toolbar-btn" title="Centralizar"><AlignCenter size={16} /></button>
          <button type="button" onClick={() => insertFormatting('align-right')} className="toolbar-btn" title="Alinhar à Direita"><AlignRight size={16} /></button>
        </div>

        <div className="toolbar-group">
          <button type="button" onClick={() => insertFormatting('link')} className="toolbar-btn" title="Link"><LinkIcon size={16} /></button>
          {onOpenModalEditor && (
            <button type="button" onClick={handleOpenModal} className="toolbar-btn" title="Modal"><Book size={16} /></button>
          )}
          <button type="button" onClick={() => insertFormatting('footnote')} className="toolbar-btn" title="Nota de Rodapé"><Info size={16} /></button>
          <button type="button" onClick={() => insertFormatting('definition')} className="toolbar-btn" title="Lista de Definição"><Type size={16} /></button>
        </div>
      </div>

      <div className="tab-content-container">
        {activeTab === 'preview' ? (
          <div className="content-preview-container">
            <MarkdownRenderer 
              content={content} 
              onModalClick={(_title, modalId) => onModalClick?.(modalId)}
              className="content-preview-area"
            />
          </div>
        ) : (
          <textarea 
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              onChange(e.target.value);
              adjustTextareaHeight();
            }}
            className="content-textarea auto-expand"
            placeholder={placeholder}
          />
        )}

        <div className="bottom-tabs">
          <button 
            type="button"
            className={`tab-btn ${activeTab !== 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Editor
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;

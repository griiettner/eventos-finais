import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, FileAudio, Upload, Trash, RefreshCw } from 'lucide-react';
import { AdminService, type Chapter } from '../services/admin-service';

interface AudioUploadModalProps {
  chapter: Chapter;
  onClose: () => void;
  onSuccess: () => void;
}

const AudioUploadModal: React.FC<AudioUploadModalProps> = ({ chapter, onClose, onSuccess }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showReplaceInput, setShowReplaceInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAudio = !!chapter.audio_url;

  const handleAudioUpload = async () => {
    if (!audioFile) return;
    
    setIsUploading(true);
    try {
      const audioPath = await AdminService.uploadAudioFile(chapter.id, audioFile);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const audioUrl = `${apiUrl}${audioPath}`;
      await AdminService.updateChapter(chapter.id, { audio_url: audioUrl });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to upload audio:', error);
      alert('Erro ao fazer upload do áudio. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAudio = async () => {
    if (!confirm('Remover áudio do capítulo?')) return;
    
    setIsRemoving(true);
    try {
      await AdminService.updateChapter(chapter.id, { audio_url: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to remove audio:', error);
      alert('Erro ao remover áudio.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleReplaceClick = () => {
    setShowReplaceInput(true);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    if (file) {
      setShowReplaceInput(true);
    }
  };

  const cancelReplace = () => {
    setAudioFile(null);
    setShowReplaceInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        className="modal-content"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <FileAudio className="text-purple" />
            <h3>{hasAudio ? 'Áudio do Capítulo' : 'Adicionar Áudio'}</h3>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="audio-manager">
            {hasAudio ? (
              <>
                <div className="current-audio">
                  <label>Áudio Atual</label>
                  <audio src={chapter.audio_url} controls className="audio-player" />
                </div>

                {!showReplaceInput ? (
                  <div className="audio-actions">
                    <button onClick={handleReplaceClick} className="btn-secondary">
                      <RefreshCw size={16} /> Substituir Áudio
                    </button>
                    <button 
                      onClick={handleRemoveAudio} 
                      className="btn-danger"
                      disabled={isRemoving}
                    >
                      <Trash size={16} /> {isRemoving ? 'Removendo...' : 'Remover'}
                    </button>
                  </div>
                ) : (
                  <div className="replace-section">
                    <label>Novo Áudio</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    {audioFile && (
                      <div className="file-preview">
                        <FileAudio size={20} />
                        <span>{audioFile.name}</span>
                      </div>
                    )}
                    <div className="replace-actions">
                      <button onClick={cancelReplace} className="btn-secondary">
                        Cancelar
                      </button>
                      <button 
                        onClick={handleAudioUpload} 
                        disabled={!audioFile || isUploading}
                        className="btn-primary"
                      >
                        <Upload size={16} /> {isUploading ? 'Enviando...' : 'Substituir'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="upload-section">
                <p className="no-audio-message">Nenhum áudio carregado ainda.</p>
                <label>Selecione um arquivo de áudio</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                {audioFile && (
                  <div className="file-preview">
                    <FileAudio size={20} />
                    <span>{audioFile.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!hasAudio && (
          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button 
              onClick={handleAudioUpload} 
              disabled={!audioFile || isUploading}
              className="btn-primary"
            >
              <Upload size={16} /> {isUploading ? 'Enviando...' : 'Upload'}
            </button>
          </div>
        )}

        {hasAudio && !showReplaceInput && (
          <div className="modal-footer">
            <button onClick={onClose} className="btn-primary">
              Fechar
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AudioUploadModal;

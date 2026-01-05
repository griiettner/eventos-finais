import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileAudio, Upload, Trash } from 'lucide-react';
import { AdminService, type Chapter } from '../services/admin-service';

interface AudioUploadModalProps {
  chapter: Chapter;
  onClose: () => void;
  onSuccess: () => void;
}

const AudioUploadModal: React.FC<AudioUploadModalProps> = ({ chapter, onClose, onSuccess }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAudioUpload = async () => {
    if (!audioFile) return;
    
    setIsUploading(true);
    try {
      const audioUrl = await AdminService.uploadAudioFile(audioFile);
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
    
    try {
      await AdminService.updateChapter(chapter.id, { audio_url: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to remove audio:', error);
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
            <h3>Gerenciar Áudio</h3>
          </div>
          <button onClick={onClose} className="close-modal-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="audio-manager">
            {chapter.audio_url ? (
              <div className="current-audio">
                <label>Áudio Atual</label>
                <audio src={chapter.audio_url} controls className="audio-player" />
                <button onClick={handleRemoveAudio} className="btn-danger">
                  <Trash size={16} /> Remover Áudio
                </button>
              </div>
            ) : (
              <p className="no-audio-message">Nenhum áudio carregado ainda.</p>
            )}

            <div className="upload-section">
              <label>Upload Novo Áudio</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="file-input"
              />
              {audioFile && (
                <div className="file-preview">
                  <FileAudio size={20} />
                  <span>{audioFile.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

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
      </motion.div>
    </div>
  );
};

export default AudioUploadModal;

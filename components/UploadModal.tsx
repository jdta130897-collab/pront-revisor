'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { User } from '@/types';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, title: string) => void;
  currentUser: User;
}

export default function UploadModal({ isOpen, onClose, onUpload, currentUser }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      toast.error('Tipo de archivo no soportado', {
        description: 'Solo se permiten PDF, DOCX o TXT (máx 50MB)',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast.error('Archivo demasiado grande', {
        description: 'El tamaño máximo permitido es 50MB',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      onUpload(selectedFile, title.trim());
      setIsUploading(false);
      resetForm();
    }, 650);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setDragActive(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-6" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", bounce: 0.02, duration: 0.4 }}
            className="glass w-full max-w-[620px] rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-10 pt-9 pb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="text-3xl font-bold tracking-tight">Subir Avance de Tesis</div>
                  <div className="text-muted-foreground mt-1">El documento será analizado automáticamente con Grok-IA</div>
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-14 text-center transition-all cursor-pointer relative overflow-hidden
                  ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/60'}`}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.txt"
                />
                
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  
                  <div className="text-xl font-semibold mb-2">Arrastra tu documento aquí</div>
                  <div className="text-sm text-muted-foreground mb-6">o haz clic para seleccionar</div>
                  
                  <div className="inline-flex items-center gap-2 text-xs bg-muted px-4 py-1.5 rounded-full">
                    PDF • DOCX • TXT • Máx 50MB
                  </div>
                </label>
              </div>

              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-5 bg-muted/50 rounded-2xl flex items-center gap-4"
                >
                  <div className="p-3 bg-background rounded-xl">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedFile.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB • {selectedFile.type || 'Documento'}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Title Input */}
              <div className="mt-8">
                <label className="text-sm font-medium block mb-2">Título del Avance / Capítulo</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Avance Capítulo 2 - Marco Teórico"
                  className="w-full bg-background border border-border rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <div className="text-[10px] text-muted-foreground mt-1.5 px-1">Se usará para identificar el avance en reportes y notificaciones</div>
              </div>
            </div>

            <div className="px-10 py-6 bg-muted/30 flex items-center justify-between border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                El análisis IA puede tardar hasta 30 segundos
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={handleClose}
                  className="px-8 py-3 text-sm font-medium rounded-2xl hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={!selectedFile || !title.trim() || isUploading}
                  className="px-10 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold flex items-center gap-2 disabled:opacity-60 active:scale-[0.985] transition-all shadow-lg shadow-primary/30"
                >
                  {isUploading ? (
                    <>Procesando...</>
                  ) : (
                    <>
                      Subir y Analizar con Grok
                      <div className="text-lg">→</div>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

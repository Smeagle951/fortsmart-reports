 'use client';

import React, { useEffect } from 'react';

interface Props {
  src: string;
  descricao?: string;
  data?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ModalImagem({ src, descricao, data, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && onPrev) onPrev();
      if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && onNext) onNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary lightbox-close" onClick={onClose}>Fechar</button>
        </div>
        <img src={src} alt={descricao || 'Foto ampliada'} className="lightbox-img" />
        <div className="lightbox-caption">
          <div>
            <div className="photo-caption">{descricao}</div>
            {data && <div className="photo-meta">{data}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onPrev && <button className="btn btn-secondary" onClick={onPrev}>Anterior</button>}
            {onNext && <button className="btn btn-secondary" onClick={onNext}>Próximo</button>}
          </div>
        </div>
      </div>
    </div>
  );
}


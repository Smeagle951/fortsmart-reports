'use client';

import React from 'react';
import styles from './plantio-analise-drawer.module.css';

export default function PlantioCompareDrawer({
  open,
  title = 'Comparar talhões',
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        style={{ zIndex: 92 }}
        aria-hidden
        onClick={onClose}
        onKeyDown={() => {}}
      />
      <aside
        className={`${styles.drawer} ${styles.drawerWide}`}
        style={{ zIndex: 93 }}
        role="dialog"
        aria-modal
        aria-labelledby="plantio-compare-title"
      >
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleBlock}>
              <h2 id="plantio-compare-title">{title}</h2>
              <p className={styles.metaLine}>Mantém os mesmos seletores e indicadores da vista principal.</p>
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        </header>
        <div className={styles.body} style={{ background: '#fafaf9' }}>
          {children}
        </div>
      </aside>
    </>
  );
}

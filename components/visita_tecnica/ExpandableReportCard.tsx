'use client';

import React, { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './relatorio-side-by-side.module.css';

export function ExpandableReportCard({
  title,
  summary,
  children,
  defaultOpen = false,
  compareTone,
  icon,
  isOpen: controlledOpen,
  onToggle,
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  compareTone?: 'up' | 'down' | 'same';
  icon?: ReactNode;
  /** Modo controlado: um único card aberto na secção (acordeão exclusivo). */
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const controlled = onToggle != null && controlledOpen !== undefined;
  const open = controlled ? controlledOpen : internalOpen;

  const handleClick = () => {
    if (controlled) {
      onToggle();
    } else {
      setInternalOpen((v) => !v);
    }
  };

  const toneClass =
    compareTone === 'up'
      ? styles.compareUp
      : compareTone === 'down'
        ? styles.compareDown
        : compareTone === 'same'
          ? styles.compareSame
          : '';

  return (
    <div className={`${styles.expandCard} ${toneClass}`}>
      <button
        type="button"
        className={styles.expandHead}
        onClick={handleClick}
        aria-expanded={open}
      >
        <span className={styles.expandHeadLeft}>
          {icon != null ? <span className={styles.expandHeadIcon}>{icon}</span> : null}
          <span className={styles.expandHeadTitle}>{title}</span>
        </span>
        <span className={styles.expandHeadRight}>
          <span className={styles.expandHint}>{open ? 'Recolher' : 'Expandir'}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown size={20} color="#57534e" aria-hidden />
          </motion.span>
        </span>
      </button>
      {!open && summary ? (
        <div className={styles.expandBody} style={{ paddingTop: 0 }}>
          {summary}
        </div>
      ) : null}
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.expandBody}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

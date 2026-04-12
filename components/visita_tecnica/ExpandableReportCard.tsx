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
}: {
  title: string;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  compareTone?: 'up' | 'down' | 'same';
}) {
  const [open, setOpen] = useState(defaultOpen);
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
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.expandHeadTitle}>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} color="#57534e" aria-hidden />
        </motion.span>
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
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.expandBody}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

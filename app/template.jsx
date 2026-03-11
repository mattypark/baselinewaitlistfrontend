'use client'
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import SmoothScroll from './smooth-scroll';
import styles from './template.module.scss';

const routes = {
  '/': 'Baseline',
}

const numRows = 10;
const numCols = 14;
const EXIT = 2.8;
const OVERLAY_DURATION = 4200; // ms — remove overlay from DOM after animation completes

export default function Template({ children }) {
  const pathname = usePathname();
  const routeName = routes[pathname] || 'Baseline';
  const letters = routeName.toUpperCase().split('');
  const [timestamp, setTimestamp] = useState('');
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    setTimestamp(new Date().toISOString().slice(0, 19));
    const timer = setTimeout(() => setShowOverlay(false), OVERLAY_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.pageTransition}>
      {showOverlay && (
        <motion.div className={styles.gridScreen} initial={{ opacity: 1 }} animate={{ opacity: 0, transition: { duration: 0.3, delay: EXIT + 1.0, ease: 'easeOut' } }}>
          {[...Array(numRows)].map((_, i) => (
            <motion.div key={`h-${i}`} className={styles.gridLineH} initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1, 1, 0], transition: { times: [0, 0.25, 0.7, 1], duration: 4.0, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] } }} style={{ top: `${((i + 1) / (numRows + 1)) * 100}%`, transformOrigin: i % 2 === 0 ? 'left' : 'right' }} />
          ))}
          {[...Array(numCols)].map((_, i) => (
            <motion.div key={`v-${i}`} className={styles.gridLineV} initial={{ scaleY: 0 }} animate={{ scaleY: [0, 1, 1, 0], transition: { times: [0, 0.25, 0.7, 1], duration: 4.0, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] } }} style={{ left: `${((i + 1) / (numCols + 1)) * 100}%`, transformOrigin: i % 2 === 0 ? 'top' : 'bottom' }} />
          ))}
          <motion.div className={styles.scanLine} initial={{ top: '-4px' }} animate={{ top: '100%', transition: { duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] } }} />
          <motion.div className={styles.scanLineH} initial={{ left: '-4px' }} animate={{ left: '100%', transition: { duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] } }} />
          {[{ top: '18%', left: '20%' }, { top: '36%', left: '53%' }, { top: '54%', left: '33%' }, { top: '72%', left: '73%' }, { top: '27%', left: '80%' }, { top: '63%', left: '13%' }].map((pos, i) => (
            <motion.div key={`node-${i}`} className={styles.node} style={pos} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1, 1, 0], opacity: [0, 1, 0.8, 0.8, 0], transition: { times: [0, 0.15, 0.25, 0.7, 1], duration: 3.6, delay: 0.8 + 0.15 * i, ease: [0.22, 1, 0.36, 1] } }} />
          ))}
          <svg className={styles.connectionsSvg}>
            {[{ d: 'M 20 18 L 53 36', delay: 1.2 }, { d: 'M 53 36 L 33 54', delay: 1.4 }, { d: 'M 33 54 L 73 72', delay: 1.6 }, { d: 'M 53 36 L 80 27', delay: 1.5 }, { d: 'M 13 63 L 33 54', delay: 1.7 }].map((line, i) => (
              <motion.line key={`conn-${i}`} x1={`${line.d.split(' ')[1]}%`} y1={`${line.d.split(' ')[2]}%`} x2={`${line.d.split(' ')[4]}%`} y2={`${line.d.split(' ')[5]}%`} stroke="rgba(0, 0, 0, 0.25)" strokeWidth="1" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0], transition: { pathLength: { duration: 0.8, delay: line.delay, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.4, delay: EXIT + 0.1 * i, ease: 'easeOut' } } }} />
            ))}
          </svg>
          <div className={`${styles.cornerBracket} ${styles.topLeft}`} />
          <div className={`${styles.cornerBracket} ${styles.topRight}`} />
          <div className={`${styles.cornerBracket} ${styles.bottomLeft}`} />
          <div className={`${styles.cornerBracket} ${styles.bottomRight}`} />
          {[{ style: { top: 32, left: 40 }, text: 'SYS.LOAD // 0x4F2A', xDir: -10, inDelay: 0.5 }, { style: { top: 32, right: 40 }, text: null, xDir: 10, inDelay: 0.6 }, { style: { bottom: 32, left: 40 }, text: null, xDir: -10, inDelay: 0.7 }, { style: { bottom: 32, right: 40 }, text: 'RES: 1920x1080', xDir: 10, inDelay: 0.8 }].map((item, i) => (
            <motion.span key={`coord-${i}`} className={styles.coordText} style={item.style} initial={{ opacity: 0, x: item.xDir }} animate={{ opacity: [0, 0.5, 0.5, 0], x: [item.xDir, 0, 0, 0], transition: { times: [0, 0.15, 0.75, 1], duration: 3.6, delay: item.inDelay, ease: 'easeInOut' } }}>
              {i === 1 ? timestamp : null}
              {i === 2 ? `ROUTE: /${pathname === '/' ? 'index' : pathname.slice(1)}` : null}
              {item.text}
            </motion.span>
          ))}
          <div className={styles.routeText}>
            <div className={styles.routeLabel}>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0, 0.4, 0.4, 0], transition: { times: [0, 0.12, 0.72, 1], duration: 3.8, delay: 0.4 } }}>NAVIGATING TO</motion.span>
            </div>
            <div className={styles.letters}>
              {letters.map((letter, i) => (
                <motion.span key={i} className={styles.letter} initial={{ opacity: 0, y: 20, filter: 'blur(12px)' }} animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10], filter: ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(4px)'], transition: { times: [0, 0.18, 0.72, 1], duration: 3.8, delay: 0.5 + 0.12 * i, ease: [0.22, 1, 0.36, 1] } }}>{letter}</motion.span>
              ))}
              <motion.span className={styles.cursor} animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0], transition: { duration: 2.4, delay: 1.0, repeat: 0 } }}>|</motion.span>
            </div>
            <div className={styles.loadingBarTrack}>
              <motion.div className={styles.loadingBarFill} initial={{ scaleX: 0 }} animate={{ scaleX: [0, 1, 1, 0], transition: { times: [0, 0.65, 0.8, 1], duration: 3.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] } }} style={{ transformOrigin: 'left' }} />
            </div>
          </div>
        </motion.div>
      )}
      <SmoothScroll />
      <div>{children}</div>
    </div>
  );
}
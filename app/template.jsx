'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SmoothScroll from './smooth-scroll';
import styles from './template.module.scss';

const RED_DURATION = 2800;

export default function Template({ children }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [redLine1, setRedLine1] = useState('');
  const [redLine2, setRedLine2] = useState('');

  const line1 = '> sys.boot --baseline';
  const line2 = '> launching interface...';

  useEffect(() => {
    const timer = setTimeout(() => setShowOverlay(false), RED_DURATION + 400);

    // Type out line 1 character by character
    let i = 0;
    const t1Start = 300;
    const t1 = setTimeout(() => {
      const iv1 = setInterval(() => {
        i++;
        setRedLine1(line1.slice(0, i));
        if (i >= line1.length) clearInterval(iv1);
      }, 35);
    }, t1Start);

    // Type out line 2
    let j = 0;
    const t2Start = t1Start + line1.length * 35 + 200;
    const t2 = setTimeout(() => {
      const iv2 = setInterval(() => {
        j++;
        setRedLine2(line2.slice(0, j));
        if (j >= line2.length) clearInterval(iv2);
      }, 30);
    }, t2Start);

    return () => { clearTimeout(timer); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={styles.pageTransition}>
      {/* ── Red screen intro ── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className={styles.redScreen}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <div className={styles.redTerminal}>
              <div className={styles.redLine}>
                {redLine1}
                {redLine1.length < line1.length && <span className={styles.redCursor} />}
              </div>
              {redLine1.length >= line1.length && (
                <div className={styles.redLine}>
                  {redLine2}
                  <span className={styles.redCursor} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SmoothScroll />
      {!showOverlay && <div>{children}</div>}
    </div>
  );
}

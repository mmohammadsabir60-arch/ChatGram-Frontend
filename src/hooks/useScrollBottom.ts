import { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollBottom<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIfAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 100; // px from bottom
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkIfAtBottom);
    return () => {
      el.removeEventListener('scroll', checkIfAtBottom);
    };
  }, [checkIfAtBottom]);

  return { containerRef, isAtBottom, scrollToBottom };
}


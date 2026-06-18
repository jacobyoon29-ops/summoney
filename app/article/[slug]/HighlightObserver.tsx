'use client';

import { useEffect } from 'react';

// .article-body 안의 <mark> 요소들을 IntersectionObserver로 감지해
// 화면에 들어오면 .hl-animate 클래스를 추가한다.
export default function HighlightObserver() {
  useEffect(() => {
    const marks = Array.from(
      document.querySelectorAll<HTMLElement>('.article-body mark[data-color]')
    );
    if (!marks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('hl-animate');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    marks.forEach((m) => observer.observe(m));
    return () => observer.disconnect();
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function animateFill(fill: HTMLElement, target: number, duration: number) {
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / duration, 1);
    fill.style.width = `${target * easeOut(t)}%`;
    if (t < 1) requestAnimationFrame(tick);
    else fill.style.width = `${target}%`;
  }
  requestAnimationFrame(tick);
}

function animateNum(span: HTMLElement, target: number, duration: number) {
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / duration, 1);
    span.textContent = String(Math.round(target * easeOut(t)));
    if (t < 1) requestAnimationFrame(tick);
    else span.textContent = String(target);
  }
  requestAnimationFrame(tick);
}

export default function ProgressBarObserver() {
  useEffect(() => {
    const blocks = document.querySelectorAll<HTMLElement>('.article-body .progress-block');
    if (!blocks.length) return;

    blocks.forEach((block) => {
      if (block.dataset.pbRendered) return;
      block.dataset.pbRendered = '1';

      let items: { label: string; value: number }[] = [];
      try { items = JSON.parse(block.dataset.items ?? '[]'); } catch { return; }
      if (!items.length) return;

      block.innerHTML = items
        .map(
          (item) => `
        <div class="pb-row">
          <div class="pb-header">
            <span class="pb-label">${escHtml(item.label)}</span>
            <span class="pb-value"><span class="pb-num" data-pb-target="${item.value}">0</span>%</span>
          </div>
          <div class="pb-track">
            <div class="pb-fill" data-pb-width="${item.value}" style="width:0%"></div>
          </div>
        </div>`
        )
        .join('');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const block = entry.target as HTMLElement;

          block.querySelectorAll<HTMLElement>('.pb-fill').forEach((fill) => {
            animateFill(fill, parseFloat(fill.dataset.pbWidth ?? '0'), 1000);
          });
          block.querySelectorAll<HTMLElement>('.pb-num').forEach((span) => {
            animateNum(span, parseFloat(span.dataset.pbTarget ?? '0'), 1500);
          });

          observer.unobserve(block);
        });
      },
      { threshold: 0.3 }
    );

    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';

// 숫자 패턴: 1,234 / 3.5 / 47 등
const NUM_RE = /(\d[\d,]*\.?\d*)/g;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function formatNumber(value: number, wasFloat: boolean, hadCommas: boolean): string {
  if (wasFloat) {
    // 소수점 자릿수를 원본과 동일하게
    const decimals = wasFloat ? 1 : 0;
    return value.toFixed(decimals);
  }
  const rounded = Math.round(value);
  if (hadCommas) {
    return rounded.toLocaleString('ko-KR');
  }
  return String(rounded);
}

function animateSpan(span: HTMLElement, duration = 1200) {
  const raw = span.dataset.countupTarget ?? '0';
  const hadCommas = raw.includes(',');
  const cleanRaw = raw.replace(/,/g, '');
  const wasFloat = cleanRaw.includes('.');
  const target = parseFloat(cleanRaw);
  if (isNaN(target) || target === 0) {
    span.textContent = raw;
    return;
  }

  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);
    span.textContent = formatNumber(target * eased, wasFloat, hadCommas);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      span.textContent = formatNumber(target, wasFloat, hadCommas);
    }
  }

  requestAnimationFrame(tick);
}

export default function NumberCountup() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>('.article-body');
    if (!body) return;

    // 처리 제외할 태그
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'A']);

    // 숫자 포함 텍스트 노드 수집
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== body) {
          if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return NUM_RE.test(node.textContent ?? '')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });

    const textNodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      NUM_RE.lastIndex = 0;
      textNodes.push(n as Text);
    }

    // 텍스트 노드를 숫자 span + 나머지 텍스트로 분리
    const allSpans: HTMLElement[] = [];
    for (const textNode of textNodes) {
      const parent = textNode.parentNode;
      if (!parent) continue;

      const text = textNode.textContent ?? '';
      NUM_RE.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = NUM_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const span = document.createElement('span');
        span.dataset.countupTarget = match[1];
        span.textContent = '0';
        fragment.appendChild(span);
        allSpans.push(span);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      parent.replaceChild(fragment, textNode);
    }

    if (allSpans.length === 0) return;

    // 각 span이 속한 블록 요소를 수집
    const BLOCK_SELECTOR = 'p, h2, h3, li, blockquote, div.callout';
    const observedBlocks = new Set<Element>();
    for (const span of allSpans) {
      const block = span.closest(BLOCK_SELECTOR) ?? span.parentElement;
      if (block) observedBlocks.add(block);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const spans = entry.target.querySelectorAll<HTMLElement>('[data-countup-target]');
          // 각 span 시작을 약간씩 stagger
          spans.forEach((span, i) => {
            setTimeout(() => animateSpan(span), i * 80);
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 }
    );

    observedBlocks.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}

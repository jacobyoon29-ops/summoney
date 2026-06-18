'use client';

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import { useRef, useState, type CSSProperties } from 'react';

const HIGHLIGHT_YELLOW = '#FFF176';
const HIGHLIGHT_SKY = '#B3E5FC';

// 풀쿼트: 핵심 문장을 크게 강조하는 블록 노드
const Pullquote = Node.create({
  name: 'pullquote',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'blockquote.pullquote' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes, { class: 'pullquote' }), 0];
  },
});

// 박스 강조 블록: 연한 배경 + 테두리, 내부에 블록 요소 허용
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div.callout' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'callout' }), 0];
  },
});

// 버티컬 라인 인용구: 골드 왼쪽 세로선 + 회색 텍스트
const Vertquote = Node.create({
  name: 'vertquote',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'blockquote.vertquote' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes, { class: 'vertquote' }), 0];
  },
});

// ───── 프로그레스 바 노드 ─────

type PbItem = { label: string; value: number };

// 에디터 내 NodeView: 항목 입력 UI
function ProgressBarNodeView({
  node,
  updateAttributes,
}: {
  node: { attrs: { items: PbItem[] } };
  updateAttributes: (a: Record<string, unknown>) => void;
}) {
  const items: PbItem[] = node.attrs.items ?? [];

  function set(i: number, field: keyof PbItem, val: string) {
    const next = items.map((item, idx) =>
      idx === i
        ? { ...item, [field]: field === 'value' ? Math.min(100, Math.max(0, Number(val) || 0)) : val }
        : item
    );
    updateAttributes({ items: next });
  }

  function add() {
    updateAttributes({ items: [...items, { label: '', value: 50 }] });
  }

  function remove(i: number) {
    updateAttributes({ items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <NodeViewWrapper>
      <div
        contentEditable={false}
        style={{
          border: '1.5px solid #e5dcc8', borderRadius: '10px',
          padding: '14px 16px', backgroundColor: '#fffdf7', margin: '0.5em 0',
        }}
      >
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="text"
              value={item.label}
              onChange={(e) => set(i, 'label', e.target.value)}
              placeholder="항목명"
              style={{ flex: 2, padding: '5px 8px', fontSize: '13px', border: '1px solid #e5e5e5', borderRadius: '6px', outline: 'none', fontFamily: 'inherit' }}
            />
            <input
              type="number"
              min={0}
              max={100}
              value={item.value}
              onChange={(e) => set(i, 'value', e.target.value)}
              style={{ width: '58px', padding: '5px 6px', fontSize: '13px', border: '1px solid #e5e5e5', borderRadius: '6px', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
            />
            <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>%</span>
            <div style={{ flex: 3, height: '6px', backgroundColor: '#f0e8d0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${item.value}%`, backgroundColor: '#c8a96e', borderRadius: '3px', transition: 'width 0.2s' }} />
            </div>
            <button type="button" onClick={() => remove(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '16px', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}>
              ×
            </button>
          </div>
        ))}
        <button type="button" onClick={add}
          style={{ fontSize: '12px', color: '#c8a96e', background: 'none', border: '1px dashed #c8a96e', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}>
          + 항목 추가
        </button>
      </div>
    </NodeViewWrapper>
  );
}

const ProgressBar = Node.create({
  name: 'progressBar',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [{ label: '', value: 50 }],
        parseHTML: (el) => {
          try { return JSON.parse(el.getAttribute('data-items') ?? '[]'); } catch { return []; }
        },
        renderHTML: (attrs) => ({ 'data-items': JSON.stringify(attrs.items) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.progress-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'progress-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProgressBarNodeView);
  },
});

// ─────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export default function ContentEditor({ value, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [youtubePrompt, setYoutubePrompt] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Highlight.configure({ multicolor: true }),
      Pullquote,
      Callout,
      Vertquote,
      ProgressBar,
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url && editor) {
        editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
      }
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  }

  function handleYoutubeInsert() {
    if (!editor || !youtubeUrl.trim()) return;
    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl.trim() }).run();
    setYoutubeUrl('');
    setYoutubePrompt(false);
  }

  function handleDrop(e: React.DragEvent) {
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      handleImageFile(file);
    }
  }

  if (!editor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* 툴바 1행: B I S / H2 H3 / ≡ 1. / 하이라이트 / ↩ ↪ */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '4px',
          padding: '6px 10px',
          backgroundColor: '#f8f8f8',
          border: '1px solid #e5e5e5',
          borderBottom: '1px solid #ddd',
          borderRadius: '10px 10px 0 0',
          alignItems: 'center',
        }}
      >
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게">B</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><s>S</s></ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목 3">H3</ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="목록">≡</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">1.</ToolBtn>
        <Divider />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_YELLOW }).run()}
          active={editor.isActive('highlight', { color: HIGHLIGHT_YELLOW })}
          disabled={disabled}
          title="노랑 하이라이트"
        >
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: HIGHLIGHT_YELLOW, border: '1px solid #e0c000', verticalAlign: 'middle' }} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_SKY }).run()}
          active={editor.isActive('highlight', { color: HIGHLIGHT_SKY })}
          disabled={disabled}
          title="하늘색 하이라이트"
        >
          <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: HIGHLIGHT_SKY, border: '1px solid #5ba8d0', verticalAlign: 'middle' }} />
        </ToolBtn>
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="실행 취소">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="다시 실행">↪</ToolBtn>
      </div>

      {/* 툴바 2행: ❝ ❞ ! |인용 / 🖼 ▶ % */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '4px',
          padding: '6px 10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #e5e5e5',
          borderTop: 'none',
          borderBottom: 'none',
          alignItems: 'center',
        }}
      >
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">❝</ToolBtn>
        {/* 풀쿼트 */}
        <ToolBtn
          onClick={() => {
            if (editor.isActive('pullquote')) {
              editor.chain().focus().setNode('paragraph').run();
            } else {
              editor.chain().focus().setNode('pullquote').run();
            }
          }}
          active={editor.isActive('pullquote')}
          disabled={disabled}
          title="풀쿼트 (핵심 문장 강조)"
        >
          <span style={{ fontStyle: 'italic', fontWeight: 800, color: editor.isActive('pullquote') ? '#7c3aed' : '#c8a96e', fontSize: '15px' }}>❞</span>
        </ToolBtn>
        {/* 박스 강조 블록 */}
        <ToolBtn
          onClick={() => {
            if (editor.isActive('callout')) {
              editor.chain().focus().lift('callout').run();
            } else {
              editor.chain().focus().wrapIn('callout').run();
            }
          }}
          active={editor.isActive('callout')}
          disabled={disabled}
          title="박스 강조 블록"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', border: `2px solid ${editor.isActive('callout') ? '#7c3aed' : '#6b7280'}`, borderRadius: '3px', fontSize: '9px', fontWeight: 900, color: editor.isActive('callout') ? '#7c3aed' : '#6b7280' }}>!</span>
        </ToolBtn>
        {/* 버티컬 라인 인용구 */}
        <ToolBtn
          onClick={() => {
            if (editor.isActive('vertquote')) {
              editor.chain().focus().setNode('paragraph').run();
            } else {
              editor.chain().focus().setNode('vertquote').run();
            }
          }}
          active={editor.isActive('vertquote')}
          disabled={disabled}
          title="버티컬 라인 인용구"
        >
          <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center' }}>
            <span style={{ width: '3px', height: '13px', borderRadius: '2px', backgroundColor: editor.isActive('vertquote') ? '#7c3aed' : '#c8a96e', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: editor.isActive('vertquote') ? '#7c3aed' : '#888', fontStyle: 'italic' }}>인용</span>
          </span>
        </ToolBtn>
        <Divider />
        {/* 이미지/GIF 삽입 */}
        <ToolBtn
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          title="이미지·GIF 삽입"
        >
          {uploading ? '⏳' : '🖼'}
        </ToolBtn>
        {/* 유튜브 임베드 */}
        <ToolBtn
          onClick={() => setYoutubePrompt((v) => !v)}
          active={youtubePrompt}
          disabled={disabled}
          title="유튜브 임베드"
        >
          ▶
        </ToolBtn>
        {/* 프로그레스 바 */}
        <ToolBtn
          onClick={() =>
            editor.chain().focus().insertContent({
              type: 'progressBar',
              attrs: { items: [{ label: '', value: 50 }] },
            }).run()
          }
          disabled={disabled}
          title="프로그레스 바 삽입"
        >
          <span style={{ fontSize: '12px', fontWeight: 800 }}>%</span>
        </ToolBtn>
      </div>

      {/* 유튜브 URL 입력창 */}
      {youtubePrompt && (
        <div
          style={{
            display: 'flex', gap: '8px', padding: '8px 10px',
            backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
            borderBottom: 'none',
          }}
        >
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleYoutubeInsert()}
            placeholder="https://www.youtube.com/watch?v=..."
            autoFocus
            style={{
              flex: 1, padding: '6px 10px', fontSize: '13px', border: '1px solid #e5e5e5',
              borderRadius: '6px', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={handleYoutubeInsert}
            style={{
              padding: '6px 14px', fontSize: '13px', fontWeight: 700,
              backgroundColor: '#FF6B6B', color: '#fff', border: 'none',
              borderRadius: '6px', cursor: 'pointer',
            }}
          >
            삽입
          </button>
          <button
            type="button"
            onClick={() => { setYoutubePrompt(false); setYoutubeUrl(''); }}
            style={{
              padding: '6px 10px', fontSize: '13px', background: 'none',
              border: '1px solid #e5e5e5', borderRadius: '6px', cursor: 'pointer', color: '#888',
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 에디터 본체 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: '0 0 10px 10px',
          backgroundColor: '#fff',
          minHeight: '320px',
          cursor: 'text',
        }}
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} style={{ padding: '14px', outline: 'none' }} />
      </div>

      {/* 숨긴 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <style>{editorStyles}</style>
    </div>
  );
}

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '4px 8px',
        fontSize: '13px',
        fontWeight: 600,
        border: `1px solid ${active ? '#7c3aed' : '#e0e0e0'}`,
        borderRadius: '6px',
        backgroundColor: active ? '#ede9fe' : '#fff',
        color: active ? '#7c3aed' : '#333',
        cursor: disabled ? 'default' : 'pointer',
        lineHeight: 1.4,
        minWidth: '28px',
        opacity: disabled ? 0.5 : 1,
      } as CSSProperties}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span style={{ width: '1px', backgroundColor: '#e0e0e0', margin: '2px 2px', alignSelf: 'stretch' }} />;
}

const editorStyles = `
  .tiptap { outline: none; }
  .tiptap p { margin: 0 0 1.5em; line-height: 1.8; color: #222; font-size: 16px; }
  .tiptap h2 { font-size: 22px; font-weight: 800; margin: 1.4em 0 0.6em; color: #111; }
  .tiptap h3 { font-size: 18px; font-weight: 700; margin: 1.2em 0 0.5em; color: #111; }
  .tiptap strong { font-weight: 700; }
  .tiptap em { font-style: italic; }
  .tiptap s { text-decoration: line-through; color: #888; }
  .tiptap ul, .tiptap ol { padding-left: 1.4em; margin: 0 0 1.5em; }
  .tiptap li { margin-bottom: 0.45em; line-height: 1.7; }
  .tiptap blockquote { border-left: 3px solid #FF6B6B; margin: 0 0 1.5em; padding: 6px 16px; color: #555; background: #fff5f5; border-radius: 0 8px 8px 0; }
  .tiptap blockquote.pullquote { border-left: 4px solid #c8a96e; background: #fffdf7; border-radius: 0 10px 10px 0; padding: 14px 24px; margin: 0 0 1.5em; color: #111; font-size: 20px; font-weight: 700; line-height: 1.55; letter-spacing: -0.01em; font-style: normal; }
  .tiptap img { max-width: 100%; height: auto; border-radius: 10px; margin: 1.5em 0; display: block; }
  .tiptap div[data-youtube-video] { margin: 1.5em 0; }
  .tiptap div[data-youtube-video] iframe { border-radius: 10px; max-width: 100%; }
  .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #bbb; pointer-events: none; float: left; height: 0; }
  .tiptap mark { border-radius: 3px; padding: 1px 2px; }
  .tiptap div.callout { background: #f0f7ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin: 0 0 1.5em; }
  .tiptap div.callout > * { margin-bottom: 0.5em; }
  .tiptap div.callout > *:last-child { margin-bottom: 0; }
  .tiptap blockquote.vertquote { border-left: 4px solid #c8a96e; background: transparent; border-radius: 0; padding: 4px 16px; margin: 0 0 1.5em; color: #666; font-size: 15px; font-weight: 400; font-style: italic; line-height: 1.7; }
`;

'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Highlight from '@tiptap/extension-highlight';
import { useRef, useState, type CSSProperties } from 'react';

const HIGHLIGHT_YELLOW = '#FFF176';
const HIGHLIGHT_SKY = '#B3E5FC';

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
      {/* 툴바 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 10px',
          backgroundColor: '#f8f8f8',
          border: '1px solid #e5e5e5',
          borderBottom: 'none',
          borderRadius: '10px 10px 0 0',
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
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">❝</ToolBtn>
        <Divider />
        {/* 하이라이트 */}
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
        <Divider />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="실행 취소">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="다시 실행">↪</ToolBtn>
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
  .tiptap p { margin: 0 0 1em; line-height: 1.8; color: #222; font-size: 16px; }
  .tiptap h2 { font-size: 22px; font-weight: 800; margin: 1.4em 0 0.4em; color: #111; }
  .tiptap h3 { font-size: 18px; font-weight: 700; margin: 1.2em 0 0.4em; color: #111; }
  .tiptap strong { font-weight: 700; }
  .tiptap em { font-style: italic; }
  .tiptap s { text-decoration: line-through; color: #888; }
  .tiptap ul, .tiptap ol { padding-left: 1.4em; margin: 0 0 1em; }
  .tiptap li { margin-bottom: 0.3em; line-height: 1.7; }
  .tiptap blockquote { border-left: 3px solid #FF6B6B; margin: 0 0 1em; padding: 6px 16px; color: #555; background: #fff5f5; border-radius: 0 8px 8px 0; }
  .tiptap img { max-width: 100%; height: auto; border-radius: 10px; margin: 1em 0; display: block; }
  .tiptap div[data-youtube-video] { margin: 1em 0; }
  .tiptap div[data-youtube-video] iframe { border-radius: 10px; max-width: 100%; }
  .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #bbb; pointer-events: none; float: left; height: 0; }
  .tiptap mark { border-radius: 3px; padding: 1px 2px; }
`;

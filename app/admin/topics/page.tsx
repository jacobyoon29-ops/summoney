'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = '다른나라' | '경제' | '사람';

interface Topic {
  title: string;
  viewCount: number;
  videoId: string;
  url: string;
  reason: string;
}

const TABS: { label: string; value: Category }[] = [
  { label: '다른나라 줍줍줍', value: '다른나라' },
  { label: '경제 줍줍줍', value: '경제' },
  { label: '사람 줍줍줍', value: '사람' },
];

function formatViewCount(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return String(n);
}

export default function TopicsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Category>('다른나라');
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[] | null>(null);

  async function discover() {
    setLoading(true);
    setTopics(null);
    try {
      const res = await fetch('/api/youtube-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab }),
      });
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1c1a17',
        fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
        padding: '32px 20px 80px',
      }}
    >
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        <h1
          style={{
            color: '#c8a96e',
            fontSize: '22px',
            fontWeight: 800,
            marginBottom: '24px',
          }}
        >
          소재 발굴
        </h1>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setTopics(null);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: activeTab === tab.value ? '1px solid #c8a96e' : '1px solid #333',
                backgroundColor: activeTab === tab.value ? '#c8a96e' : 'transparent',
                color: activeTab === tab.value ? '#1c1a17' : '#c8a96e',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 발굴 버튼 */}
        <button
          onClick={discover}
          disabled={loading}
          style={{
            padding: '10px 28px',
            backgroundColor: loading ? '#555' : '#c8a96e',
            color: '#1c1a17',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {loading && (
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid #1c1a17',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          )}
          {loading ? '발굴 중...' : '소재 발굴'}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* 결과 */}
        {topics !== null && topics.length === 0 && (
          <p style={{ color: '#888', fontSize: '15px' }}>
            조회수 2만 이상 소재가 없어요. 다시 발굴해보세요.
          </p>
        )}

        {topics && topics.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topics.map((topic) => (
              <div
                key={topic.videoId}
                style={{
                  border: '1px solid #333',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  backgroundColor: '#242118',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p
                    style={{
                      color: '#f0e8d6',
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: '0 0 4px',
                      lineHeight: 1.5,
                    }}
                  >
                    {topic.title}
                  </p>
                  <p style={{ color: '#c8a96e', fontSize: '13px', fontWeight: 700, margin: '0 0 6px' }}>
                    조회수 {formatViewCount(topic.viewCount)}
                  </p>
                  {topic.reason && (
                    <p style={{ color: '#888', fontSize: '12px', margin: 0, fontStyle: 'italic' }}>
                      💡 {topic.reason}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <a
                    href={topic.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '7px 14px',
                      border: '1px solid #333',
                      borderRadius: '7px',
                      color: '#c8a96e',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    유튜브 ↗
                  </a>
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/new?topic=${encodeURIComponent(topic.title)}`
                      )
                    }
                    style={{
                      padding: '7px 14px',
                      backgroundColor: '#c8a96e',
                      border: 'none',
                      borderRadius: '7px',
                      color: '#1c1a17',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    이 소재로 글쓰기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

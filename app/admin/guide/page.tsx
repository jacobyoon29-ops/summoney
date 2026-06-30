export default function GuidePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1c1a17', fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif', padding: '40px 20px 100px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ color: '#c8a96e', fontSize: '11px', letterSpacing: '5px', fontWeight: 700, marginBottom: '12px' }}>ADMIN GUIDE</p>
        <h1 style={{ color: '#f0e8d6', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '48px' }}>어드민 사용 가이드</h1>

        <Section title="1. 소재 발굴">
          <P>상단 네비게이션의 <Gold>소재 발굴</Gold> 메뉴에서 유튜브 쇼츠 기반으로 글감을 찾아요.</P>
          <ul>
            <Li><Gold>다른나라 줍줍줍</Gold> — 세계 문화·여행·럭셔리·이색 관습 등 해외 소재</Li>
            <Li><Gold>경제 줍줍줍</Gold> — 기업·브랜드·창업·가격 심리 등 비즈니스 소재</Li>
            <Li><Gold>사람 줍줍줍</Gold> — CEO·창업자·성공 인물 비하인드 소재</Li>
          </ul>
          <P>조회수 필터 드롭다운으로 &quot;5만 이상&quot; 등 원하는 기준을 선택하면 Claude가 줍줍줍 적합 소재만 골라줘요.</P>
          <P><Gold>이 소재로 글쓰기</Gold> 버튼을 누르면 글쓰기 화면으로 이동해요.</P>
        </Section>

        <Section title="2. AI 글 생성 모달">
          <P>글쓰기 화면의 <Gold>✨ AI로 글 생성</Gold> 버튼을 눌러 모달을 열어요.</P>
          <SubTitle>STEP 1 — 리서치 질문 생성 (선택사항)</SubTitle>
          <P>주제를 입력하고 <Gold>질문 생성</Gold>을 누르면 Claude가 5가지 리서치 질문을 만들어줘요. 자동으로 클립보드에 복사됩니다. Liner·유튜브·블로그에서 검색해 자료를 모아요.</P>
          <SubTitle>STEP 2 — 원본 자료 붙여넣기</SubTitle>
          <P>유튜브 자막, 기사, 메모 등 수집한 원본을 붙여넣어요.</P>
          <SubTitle>STEP 3 — 후킹 패턴 선택</SubTitle>
          <ul>
            <Li><Gold>외부 관찰자 시점</Gold> — 외국인이 바라보는 시선으로 신기함 부각</Li>
            <Li><Gold>숫자 반전</Gold> — &quot;줄었는데 오히려 매출이 늘었다&quot;는 역설 구조</Li>
            <Li><Gold>탄생 비화</Gold> — 처음엔 실패작·비웃음 받았던 제품의 역전 스토리</Li>
          </ul>
          <P>편집 방향 메모에 강조하고 싶은 각도를 적으면 더 원하는 방향으로 글이 나와요.</P>
          <P>생성 후 제목 3개 중 하나를 선택하고 <Gold>에디터에 적용</Gold>을 누르면 본문과 제목이 채워져요.</P>
        </Section>

        <Section title="3. 시리즈 / 특집 기능">
          <P>여러 글을 하나의 테마로 묶는 시리즈를 만들 수 있어요.</P>
          <SubTitle>시리즈 만들기</SubTitle>
          <ol>
            <Li>상단 네비게이션의 <Gold>시리즈</Gold> 메뉴 클릭</Li>
            <Li><Gold>+ 새 시리즈</Gold> 버튼 클릭</Li>
            <Li>시리즈 이름 입력 → <Gold>AI 생성</Gold>으로 영문 슬러그 자동 생성 (수정 가능)</Li>
            <Li>설명·커버 이미지 URL 입력 후 저장</Li>
          </ol>
          <SubTitle>글에 시리즈 배정하기</SubTitle>
          <P>글쓰기/수정 화면의 <Gold>시리즈 / 특집</Gold> 드롭다운에서 원하는 시리즈를 선택하면 돼요. 홈페이지 카드에 골드 배지가 표시되고, 카드 배지 클릭 시 시리즈 페이지로 이동해요.</P>
          <SubTitle>시리즈 공개 페이지</SubTitle>
          <P><code style={{ backgroundColor: '#2a2418', color: '#c8a96e', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>/series/[슬러그]</code> 경로로 자동 생성돼요. 히어로 영역 + 소속 글 그리드가 표시됩니다.</P>
        </Section>

        <Section title="4. AI 자동완성 (SEO 메타)">
          <P>본문을 먼저 작성한 후 <Gold>✦ AI 자동완성</Gold> 버튼을 누르면 Claude가 SEO 제목·메타 디스크립션·슬러그·해시태그를 자동으로 채워줘요.</P>
          <P>생성된 내용을 검토하고 수정한 뒤 발행하세요.</P>
        </Section>

        <Section title="5. 커버 이미지 — Unsplash">
          <P>글쓰기 화면에서 <Gold>커버 이미지</Gold> 업로드 영역에 직접 파일을 올리거나, Unsplash URL을 붙여넣어 사용할 수 있어요.</P>
          <P>Unsplash 추천 사용법: unsplash.com에서 키워드 검색 → 원하는 사진 우클릭 → &quot;이미지 주소 복사&quot; → URL 필드에 붙여넣기.</P>
          <P>시리즈 커버 이미지도 동일하게 Unsplash URL을 활용하세요.</P>
        </Section>

        <Section title="6. 카카오 공유">
          <P>글 상세 페이지 하단의 카카오 공유 버튼은 OG 이미지(커버)·제목·메타 디스크립션을 자동으로 사용해요.</P>
          <P>카카오 미리보기가 잘 나오려면 커버 이미지와 메타 디스크립션을 꼭 입력하세요.</P>
        </Section>

        <Section title="7. 예약 발행">
          <P>글쓰기 화면의 <Gold>예약 발행</Gold> 날짜/시간을 설정하면 해당 시각에 자동으로 발행돼요.</P>
          <P>예약된 글은 <Gold>예약 저장</Gold>으로 저장하고, Vercel Cron이 매 시간마다 체크해서 발행합니다.</P>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '48px' }}>
      <h2 style={{ color: '#c8a96e', fontSize: '18px', fontWeight: 800, marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #2a2a2a' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {children}
      </div>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#f0e8d6', fontSize: '14px', fontWeight: 700, margin: '8px 0 0' }}>{children}</p>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>{children}</p>;
}

function Gold({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#c8a96e', fontWeight: 700 }}>{children}</span>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.8, marginLeft: '16px' }}>{children}</li>;
}

import { getSiteSettings, saveSiteSettings } from '../actions';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const s = await getSiteSettings();

  async function save(formData: FormData) {
    'use server';
    const result = await saveSiteSettings(formData);
    if (result.ok) redirect('/admin/settings?saved=1');
  }

  return (
    <div style={{
      backgroundColor: '#fafafa', minHeight: '100vh',
      fontFamily: '"Pretendard", "Apple SD Gothic Neo", sans-serif',
      padding: '24px 20px 64px',
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <p style={{ color: '#c8a96e', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>
          줍줍줍 ADMIN
        </p>
        <h1 style={{ color: '#111', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '32px' }}>
          사이트 설정
        </h1>

        <form action={save}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f0f0f0', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Field label="사이트명" name="site_name" defaultValue={s.site_name} />
            <Field label="대표자명" name="owner_name" defaultValue={s.owner_name} />
            <Field label="사업자등록번호" name="business_number" defaultValue={s.business_number} />
            <Field label="회사명" name="company_name" defaultValue={s.company_name} />
            <Field label="고객센터" name="customer_service" defaultValue={s.customer_service} placeholder="예: 010-0000-0000" />
            <Field label="주소" name="address" defaultValue={s.address} />
            <Field label="저작권 문구" name="copyright" defaultValue={s.copyright} />
          </div>

          <button type="submit" style={{
            marginTop: '20px', width: '100%', padding: '14px',
            backgroundColor: '#c8a96e', color: '#fff', border: 'none',
            borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}>
            저장
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#555', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 12px', fontSize: '14px', color: '#111',
          border: '1.5px solid #e5e5e5', borderRadius: '8px', outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

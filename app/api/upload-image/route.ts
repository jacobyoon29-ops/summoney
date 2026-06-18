import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { isAuthed } from '@/app/admin/auth';

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // content-images 버킷 없으면 생성
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === 'content-images')) {
    await supabase.storage.createBucket('content-images', { public: true });
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

  const { error } = await supabase.storage
    .from('content-images')
    .upload(path, file, { contentType: file.type || undefined, upsert: false });

  if (error) {
    return NextResponse.json({ error: '업로드 실패: ' + error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from('content-images').getPublicUrl(path);
  return NextResponse.json({ url: publicUrl });
}

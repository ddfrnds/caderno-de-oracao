import { getCurrentUser } from '@/server/auth';
import { getFileForViewer } from '@/server/files';
import { storage } from '@/server/storage';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const file = await getFileForViewer(id, viewer);
  if (!file) return new Response('Não encontrado', { status: 404 });
  const obj = await storage().get(file.storage_key);
  if (!obj) return new Response('Não encontrado', { status: 404 });

  const isImage = file.kind === 'image';
  const encoded = encodeURIComponent(file.original_name);
  return new Response(obj.stream, {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(obj.size),
      'Content-Disposition': `${isImage ? 'inline' : 'attachment'}; filename="${file.original_name.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '')}"; filename*=UTF-8''${encoded}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      'Cache-Control': 'private, max-age=300',
    },
  });
}

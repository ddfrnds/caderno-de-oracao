'use client';
import { useEffect, useRef, useState } from 'react';
import { compressImage, formatSize } from '@/lib/compress-image';

type Props = {
  id: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  images?: boolean; // reduz as fotos no navegador e mostra miniaturas
};

/** Campo de arquivos com lista, botão "Remover" por arquivo e redução automática de fotos. */
export default function FilePicker({ id, name, accept, multiple, images }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!images) return;
    const u = files.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setUrls(u);
    return () => u.forEach((x) => x && URL.revokeObjectURL(x));
  }, [files, images]);

  const sync = (list: File[]) => {
    const dt = new DataTransfer();
    list.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    setFiles(list);
  };

  return (
    <div className="file-picker">
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={async (ev) => {
          const picked = Array.from(ev.target.files ?? []);
          setBusy(true);
          const done = await Promise.all(picked.map((f) => (images ? compressImage(f) : f)));
          sync(multiple ? [...files, ...done] : done.slice(0, 1));
          setBusy(false);
        }}
      />
      {busy && <p className="hint" role="status">Reduzindo o tamanho das fotos…</p>}
      {files.length > 0 && (
        <ul className="picked">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              {images && urls[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[i]} alt="" />
              )}
              <span className="picked-name">{f.name} <small>({formatSize(f.size)})</small></span>
              <button type="button" className="link-danger" onClick={() => sync(files.filter((_, j) => j !== i))} aria-label={`Remover ${f.name}`}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

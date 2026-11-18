'use client';
import { useActionState, useState } from 'react';
import { createPrayerAction, deleteFileAction, savePrayerAction } from '@/app/actions/admin';
import { parsePrayerBody } from '@/lib/prayer-body';
import { BACKGROUNDS, FONTS, HEX, SKINS, SKIN_PREFIX, resolveBackground, resolveFont, skinFor, skinPaperPct, skinSrc, skinThumb } from '@/lib/themes';
import FilePicker from './FilePicker';
import PrayerBody from './PrayerBody';

type FileLite = { id: string; original_name: string; kind: 'image' | 'document' };
export type EditorPrayer = {
  id?: string; title: string; body: string; font: string; background: string; cover_file_id: string | null;
  published: boolean; files: FileLite[]; included: string[];
};

export default function PrayerEditor({ prayer }: { prayer: EditorPrayer }) {
  const isNew = !prayer.id;
  const [state, action] = useActionState(isNew ? createPrayerAction : savePrayerAction, undefined);
  const isCustom = HEX.test(prayer.background);
  const [title, setTitle] = useState(prayer.title);
  const [body, setBody] = useState(prayer.body);
  const [font, setFont] = useState(prayer.font);
  const [bg, setBg] = useState(isCustom ? 'custom' : prayer.background);
  const [custom, setCustom] = useState(isCustom ? prayer.background : '#f3e8d2');
  const [coverSel, setCover] = useState(prayer.cover_file_id ?? '');
  const theme = resolveBackground(bg === 'custom' ? custom : bg);
  const skin = skinFor(bg);
  const f = resolveFont(font);
  const e = state?.errors;
  const images = prayer.files.filter((x) => x.kind === 'image');
  const cover = images.some((im) => im.id === coverSel) ? coverSel : ''; // capa apagada some da seleção
  const confirmDelete = (name: string) => (ev: React.MouseEvent) => {
    if (!window.confirm(`Excluir "${name}" definitivamente? Esta ação não pode ser desfeita.`)) ev.preventDefault();
  };

  return (
    <form action={action} className="editor" noValidate>
      {prayer.id && <input type="hidden" name="id" value={prayer.id} />}
      <div>
        {state?.ok && <div className="alert ok" role="status">{state.message}</div>}
        {state?.message && !state.ok && <div className="alert error" role="alert">{state.message}</div>}

        <div className="field">
          <label htmlFor="title">Título</label>
          <input id="title" name="title" type="text" value={title} onChange={(ev) => setTitle(ev.target.value)} maxLength={150} required />
          {e?.title && <span className="error" role="alert">{e.title[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="body">Texto da oração</label>
          <textarea id="body" name="body" value={body} onChange={(ev) => setBody(ev.target.value)} />
          <span className="hint">Formatação: <code>## Título</code> (centralizado), <code>&gt; linha</code> (centralizada), <code>**negrito**</code>, <code>*itálico*</code>. Linha em branco separa parágrafos.</span>
          {e?.body && <span className="error" role="alert">{e.body[0]}</span>}
        </div>

        <div className="field">
          <label htmlFor="font">Fonte</label>
          <select id="font" name="font" value={font} onChange={(ev) => setFont(ev.target.value)}>
            {Object.entries(FONTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="field">
          <span className="label">Cor de fundo (com a moldura de renda clássica)</span>
          <div className="swatches">
            {Object.entries(BACKGROUNDS).map(([k, v]) => (
              <label key={k}>
                <input type="radio" name="background" value={k} checked={bg === k} onChange={() => setBg(k)} />
                <span className="sw" style={{ background: v.bg }} /> {v.label}
              </label>
            ))}
            <label>
              <input type="radio" name="background" value="custom" checked={bg === 'custom'} onChange={() => setBg('custom')} /> Cor personalizada
              <input type="color" name="customColor" value={custom} onChange={(ev) => { setCustom(ev.target.value); setBg('custom'); }} aria-label="Cor personalizada" />
            </label>
          </div>
          {e?.background && <span className="error" role="alert">{e.background[0]}</span>}
        </div>

        <div className="field">
          <span className="label">Ou escolha uma moldura pronta</span>
          <div className="skin-grid">
            {SKINS.map((sk) => (
              <label key={sk.id} className={bg === SKIN_PREFIX + sk.id ? 'skin-opt on' : 'skin-opt'}>
                <input type="radio" name="background" value={SKIN_PREFIX + sk.id} checked={bg === SKIN_PREFIX + sk.id} onChange={() => setBg(SKIN_PREFIX + sk.id)} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={skinThumb(sk)} alt="" loading="lazy" />
                <span>{sk.label}</span>
              </label>
            ))}
          </div>
          <span className="hint">“Papel grande” aproveita quase toda a tela: ideal para orações longas.</span>
        </div>

        <div className="field">
          <span className="label">Capa</span>
          {images.length > 0 && (
            <div className="cover-options">
              <label className="none"><input type="radio" name="coverFileId" value="" checked={cover === ''} onChange={() => setCover('')} /> Sem capa</label>
              {images.map((im) => (
                <label key={im.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/files/${im.id}`} alt={im.original_name} />
                  <span><input type="radio" name="coverFileId" value={im.id} checked={cover === im.id} onChange={() => setCover(im.id)} /> usar</span>
                  <button type="submit" className="link-danger" formAction={deleteFileAction.bind(null, im.id)} onClick={confirmDelete(im.original_name)}>Excluir</button>
                </label>
              ))}
            </div>
          )}
          <label htmlFor="coverUpload" className="hint">{images.length ? 'Ou envie uma nova capa (substitui a seleção):' : 'Enviar capa:'}</label>
          <FilePicker id="coverUpload" name="coverUpload" accept="image/jpeg,image/png,image/webp,image/gif" images />
          {e?.coverUpload && <span className="error" role="alert">{e.coverUpload[0]}</span>}
        </div>

        {prayer.files.length > 0 && (
          <div className="field">
            <span className="label">Arquivos complementares exibidos na oração</span>
            {prayer.files.filter((x) => x.id !== cover).map((x) => (
              <label key={x.id} className="radio-row">
                <input type="checkbox" name="include" value={x.id} defaultChecked={prayer.included.includes(x.id)} /> {x.original_name}
                <button type="submit" className="link-danger" formAction={deleteFileAction.bind(null, x.id)} onClick={confirmDelete(x.original_name)}>Excluir</button>
              </label>
            ))}
          </div>
        )}
        <div className="field">
          <label htmlFor="extraFiles">Adicionar imagens ou arquivos complementares</label>
          <FilePicker id="extraFiles" name="extraFiles" multiple images />
          <span className="hint">As fotos são reduzidas automaticamente. Somam, no máximo, 4 MB por salvamento.</span>
          {e?.extraFiles && <span className="error" role="alert">{e.extraFiles[0]}</span>}
        </div>

        <div className="actions-bar">
          {isNew ? (
            <>
              <button className="btn secondary" type="submit" name="intent" value="save">Criar como rascunho</button>
              <button className="btn" type="submit" name="intent" value="publish">Criar e publicar</button>
            </>
          ) : (
            <>
              <button className="btn secondary" type="submit" name="intent" value="save">Salvar</button>
              {prayer.published
                ? <button className="btn secondary" type="submit" name="intent" value="unpublish">Despublicar</button>
                : null}
              <button className="btn" type="submit" name="intent" value="publish">{prayer.published ? 'Salvar e manter publicada' : 'Publicar'}</button>
            </>
          )}
        </div>
      </div>

      <aside className="preview" aria-label="Pré-visualização">
        <p className="hint">Pré-visualização</p>
        {skin?.kind === 'frame' ? (
          <div className="skin-preview" style={{ backgroundImage: `url(${skinSrc(skin)})`, aspectRatio: `${skin.w} / ${skin.h}`, color: theme.fg, fontFamily: f.family }}>
            <div className="skin-paper" style={{ top: `${skinPaperPct(skin).top}%`, right: `${skinPaperPct(skin).right}%`, bottom: `${skinPaperPct(skin).bottom}%`, left: `${skinPaperPct(skin).left}%` }}>
              <h2>{title || 'Título da oração'}</h2>
              <div className="book-flow" style={{ fontSize: `calc(${f.size} * .62)`, columnWidth: 'auto', transition: 'none' }}>
                <PrayerBody blocks={parsePrayerBody(body || 'O texto aparecerá aqui.')} />
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-sheet" style={{ background: skin ? `url(${skin.texture}) center / cover` : theme.bg, color: theme.fg, fontFamily: f.family }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${cover}`} alt="" style={{ display: 'block', margin: '0 auto 1rem', width: '55%', boxShadow: '0 10px 24px -12px rgba(0,0,0,.6)' }} />
            )}
            <h2>{title || 'Título da oração'}</h2>
            <div className="book-flow" style={{ fontSize: f.size, columnWidth: 'auto', transition: 'none' }}>
              <PrayerBody blocks={parsePrayerBody(body || 'O texto aparecerá aqui.')} />
            </div>
          </div>
        )}
      </aside>
    </form>
  );
}

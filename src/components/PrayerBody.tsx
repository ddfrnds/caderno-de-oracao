import { Fragment } from 'react';
import type { Block, Inline } from '@/lib/prayer-body';

function Inl({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.bold) return <strong key={i}>{p.text}</strong>;
        if (p.italic) return <em key={i}>{p.text}</em>;
        return <Fragment key={i}>{p.text}</Fragment>;
      })}
    </>
  );
}

function Lines({ lines }: { lines: Inline[][] }) {
  return (
    <>
      {lines.map((l, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <Inl parts={l} />
        </Fragment>
      ))}
    </>
  );
}

export default function PrayerBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === 'heading' ? (
          <h2 key={i} className="pb-heading"><Inl parts={b.content} /></h2>
        ) : b.type === 'center' ? (
          <p key={i} className="pb-center"><Lines lines={b.lines} /></p>
        ) : (
          <p key={i} className="pb-p"><Lines lines={b.lines} /></p>
        ),
      )}
    </>
  );
}

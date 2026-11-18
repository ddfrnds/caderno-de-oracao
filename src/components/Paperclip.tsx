export default function Paperclip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 110" aria-hidden="true" fill="none">
      <defs>
        <linearGradient id="clipg" x1="0" x2="1">
          <stop offset="0" stopColor="#5f6368" />
          <stop offset=".5" stopColor="#c4c7cb" />
          <stop offset="1" stopColor="#50545a" />
        </linearGradient>
      </defs>
      <path
        d="M12 78V24a9 9 0 0 1 18 0v66a15 15 0 0 1-30 0V30"
        transform="translate(5 3)"
        stroke="url(#clipg)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

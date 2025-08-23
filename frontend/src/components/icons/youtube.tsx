export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden={false}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Official-ish YouTube play button: rounded red rect with white triangle */}
      <rect x="1" y="4" width="22" height="16" rx="4" fill="#FF0000" />
      <path d="M10 8v8l6-4-6-4z" fill="#fff" />
    </svg>
  );
}

export default YouTubeIcon;

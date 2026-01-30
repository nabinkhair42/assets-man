export function AuthSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground/80"
        >
          <style>{`
            @keyframes draw {
              0% { stroke-dashoffset: 100; opacity: 0.3; }
              40% { opacity: 1; }
              60% { opacity: 1; }
              100% { stroke-dashoffset: 0; opacity: 0.3; }
            }
            .stone-path {
              stroke-dasharray: 100;
              animation: draw 2s ease-in-out infinite;
            }
            .stone-path:nth-child(2) { animation-delay: 0.2s; }
            .stone-path:nth-child(3) { animation-delay: 0.4s; }
          `}</style>
          <path
            className="stone-path"
            d="M11.264 2.205A4 4 0 0 0 6.42 4.211l-4 8a4 4 0 0 0 1.359 5.117l6 4a4 4 0 0 0 4.438 0l6-4a4 4 0 0 0 1.576-4.592l-2-6a4 4 0 0 0-2.53-2.53z"
          />
          <path className="stone-path" d="M11.99 22 14 12l7.822 3.184" />
          <path className="stone-path" d="M14 12 8.47 2.302" />
        </svg>
      </div>
    </div>
  );
}

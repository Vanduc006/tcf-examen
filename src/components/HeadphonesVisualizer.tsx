"use client";

interface HeadphonesVisualizerProps {
  isPlaying?: boolean;
}

export default function HeadphonesVisualizer({
  isPlaying = false,
}: HeadphonesVisualizerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <svg
        viewBox="0 0 320 280"
        className="h-64 w-72 max-w-full"
        aria-hidden="true"
      >
        <ellipse cx="70" cy="140" rx="55" ry="70" fill="#4a4a4a" />
        <ellipse cx="70" cy="140" rx="40" ry="55" fill="#2d2d2d" />
        <ellipse cx="250" cy="140" rx="55" ry="70" fill="#4a4a4a" />
        <ellipse cx="250" cy="140" rx="40" ry="55" fill="#2d2d2d" />
        <path
          d="M 125 80 Q 160 60 195 80"
          stroke="#333"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 125 200 Q 160 220 195 200"
          stroke="#333"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />

        {isPlaying ? (
          <g className="animate-pulse">
            <polyline
              points="130,140 140,110 150,170 160,90 170,150 180,120 190,140"
              fill="none"
              stroke="#2196F3"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </g>
        ) : (
          <polyline
            points="130,140 140,130 150,140 160,130 170,140 180,130 190,140"
            fill="none"
            stroke="#2196F3"
            strokeWidth="3"
            strokeLinejoin="round"
            opacity="0.5"
          />
        )}
      </svg>

      <p className="text-center text-sm text-gray-500">
        {isPlaying
          ? "Écoute en cours..."
          : "Cliquez sur Écouter pour lancer l'audio"}
      </p>
    </div>
  );
}

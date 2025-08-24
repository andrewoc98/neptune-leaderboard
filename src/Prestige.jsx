
export function Prestige() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="goldGradientAnimated" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0"   stopColor="#8f6b29" />
          <stop offset="0.2" stopColor="#fde08d" />
          <stop offset="0.5" stopColor="#b0822b" />
          <stop offset="0.8" stopColor="#fde08d" />
          <stop offset="1"   stopColor="#8f6b29" />
          {/* Simple shimmer */}
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="1 0"
            dur="3s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

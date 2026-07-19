/* A short-lived burst of particles radiating from the center of its
   container. Mount it (conditionally, keyed so it remounts per event) to
   play the burst once — it doesn't loop or clean itself up, it's meant to
   live only as long as the moment it's celebrating (a win, an elimination). */
export default function ParticleBurst({ count = 28, colors = ["#C9A84C", "#E8D5A3", "#2ED573"], spread = 140 }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = spread * 0.5 + Math.random() * spread;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist * 0.85 - spread * 0.15; // slight upward bias
    const size = 3 + Math.random() * 5;
    const color = colors[i % colors.length];
    const delay = Math.random() * 0.12;
    const dur = 0.85 + Math.random() * 0.55;
    return { id: i, dx, dy, size, color, delay, dur };
  });

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 6 }} aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            "--dx": `${p.dx}px`,
            "--dy": `${p.dy}px`,
            animation: `skParticleBurst ${p.dur}s cubic-bezier(.2,.8,.3,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

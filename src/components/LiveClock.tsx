import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <div className="clock-shell">
        <span
          className="clock-time"
          style={{
            fontFamily: '"Space Mono", monospace',
            fontWeight: 700,
          }}
        >
          --:--
        </span>
        <span className="clock-date">—</span>
      </div>
    );
  }

  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="clock-shell">
      <span
        className="clock-time"
        style={{
          fontFamily: '"Space Mono", monospace',
          fontWeight: 700,
        }}
      >
        {time}
      </span>

      <span className="clock-date">{date}</span>
    </div>
  );
}

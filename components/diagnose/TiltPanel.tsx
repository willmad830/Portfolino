import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function useTilt<T extends HTMLElement = HTMLDivElement>(intensity = 4, shift = 5) {
  const ref = useRef<T>(null);
  const onMove = (event: ReactPointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (event.clientX - r.left) / r.width - 0.5;
    const py = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", (py * intensity).toFixed(2) + "deg");
    el.style.setProperty("--ry", (-px * intensity).toFixed(2) + "deg");
    el.style.setProperty("--tx", (px * shift).toFixed(1) + "px");
    el.style.setProperty("--ty", (py * shift).toFixed(1) + "px");
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    ["--rx", "--ry", "--tx", "--ty"].forEach((key) => el.style.setProperty(key, "0px"));
  };
  return { ref, onMove, onLeave };
}

export function TiltPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { ref, onMove, onLeave } = useTilt<HTMLDivElement>(4, 5);
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "tilt relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-6 backdrop-blur-xl sm:p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

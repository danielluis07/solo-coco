"use client";

// PROTOTYPE: shows the hero route inside a phone-sized frame, so the phone variants for "How does
// the hero behave on phones?" (#11) can be judged from a desktop browser. Scroll inside the frame.
import { useState, useSyncExternalStore } from "react";

const variants = ["A", "P1", "P2", "P3"];
const devices = [
  { name: "360 × 780", w: 360, h: 780 },
  { name: "390 × 844", w: 390, h: 844 },
  { name: "430 × 932", w: 430, h: 932 },
];

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

export default function PhoneFrame() {
  const [variant, setVariant] = useState("P1");
  const [device, setDevice] = useState(devices[1]);
  // Shrinks the frame to fit short laptop screens; the page inside still sees the device size.
  const viewport = useSyncExternalStore(subscribe, () => window.innerHeight, () => 1000);
  const scale = Math.min(1, (viewport - 80) / (device.h + 16));

  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 ${on ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`;

  return (
    <div className="flex min-h-svh flex-col items-center gap-4 bg-neutral-900 p-4 font-sans text-sm text-white">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {variants.map((v) => (
          <button key={v} type="button" className={chip(v === variant)} onClick={() => setVariant(v)}>
            {v}
          </button>
        ))}
        <span className="mx-2 text-white/30">|</span>
        {devices.map((d) => (
          <button key={d.name} type="button" className={chip(d === device)} onClick={() => setDevice(d)}>
            {d.name}
          </button>
        ))}
      </div>
      <div style={{ width: (device.w + 16) * scale, height: (device.h + 16) * scale }}>
        <iframe
          style={{ width: device.w + 16, height: device.h + 16, transform: `scale(${scale})`, transformOrigin: "top left" }}
          key={`${variant}-${device.name}`}
          title={`Hero, variant ${variant}`}
          src={`/prototype/hero-scroll?variant=${variant}`}
          className="rounded-[2rem] border-8 border-black bg-white"
        />
      </div>
    </div>
  );
}

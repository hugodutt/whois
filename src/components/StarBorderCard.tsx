'use client';

import { ReactNode, useRef, useState } from 'react';

interface StarBorderCardProps {
  children: ReactNode;
  className?: string;
}

export function StarBorderCard({ children, className = '' }: StarBorderCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || isFocused) return;

    const div = divRef.current;
    const rect = div.getBoundingClientRect();

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-lg border border-slate-800 bg-gradient-to-r from-black to-slate-950 p-px before:absolute before:inset-0 before:rounded-lg before:p-px before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100 ${className}`}
      style={{
        background: `
          radial-gradient(
            600px circle at ${position.x}px ${position.y}px,
            rgba(255,182,255,.1),
            transparent 40%
          )
        `,
      }}
    >
      <div
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `
            radial-gradient(
              600px circle at ${position.x}px ${position.y}px,
              rgba(255,255,255,.4),
              transparent 40%
            )
          `,
        }}
      />
      <div className="relative h-full w-full rounded-lg bg-slate-950/50 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
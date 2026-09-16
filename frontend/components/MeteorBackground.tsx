"use client";

import { useEffect, useRef } from "react";

export function MeteorBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Realistic White Meteor Configuration
    const meteorCount = 18;
    const meteors: Array<{
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      size: number;
    }> = [];

    for (let i = 0; i < meteorCount; i++) {
      meteors.push({
        x: Math.random() * canvas.width * 1.4 - canvas.width * 0.2,
        y: Math.random() * canvas.height - canvas.height,
        length: Math.random() * 120 + 60,
        speed: Math.random() * 1.2 + 0.6, // Slower, realistic drift speed
        opacity: Math.random() * 0.5 + 0.2, // Subtle opacity range
        size: Math.random() * 0.8 + 0.4,   // Fine, needle-thin trails
      });
    }

    const draw = () => {
      // Smooth fade background for motion blur trail
      ctx.fillStyle = "rgba(10, 10, 12, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      meteors.forEach((m) => {
        // Gradient from bright white head to fully transparent tail
        const gradient = ctx.createLinearGradient(
          m.x,
          m.y,
          m.x - m.length * 0.45,
          m.y + m.length
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${m.opacity})`);
        gradient.addColorStop(0.2, `rgba(220, 230, 245, ${m.opacity * 0.6})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = m.size;
        ctx.lineCap = "round";
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.length * 0.45, m.y + m.length);
        ctx.stroke();

        // Soft, small glow point at the leading tip
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.fill();

        // Slow downwards/leftward motion vectors
        m.y += m.speed * 1.8;
        m.x -= m.speed * 0.8;

        // Reset particle position when exiting viewport boundaries
        if (m.y > canvas.height + 50 || m.x < -150) {
          m.y = -m.length;
          m.x = Math.random() * canvas.width * 1.4;
          m.speed = Math.random() * 1.2 + 0.6;
          m.opacity = Math.random() * 0.5 + 0.2;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-[#0a0a0c]"
    />
  );
}
"use client";

import { useEffect, useRef } from "react";

export function SpaceWarpBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const numStars = 500; // Optimal density
    const speed = 7; // Faster for the cinematic effect
    const colors = ["#00f3ff", "#ff0099", "#9d00ff", "#ff6600", "#00ff66", "#ffffff"];
    
    const stars: { x: number; y: number; z: number; pz: number; color: string }[] = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        pz: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationFrameId: number;

    const draw = () => {
      // Darker trail clearing for longer, smoother light streaks
      ctx.fillStyle = "rgba(5, 5, 7, 0.3)"; 
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      stars.forEach((star) => {
        star.pz = star.z;
        star.z -= speed;

        if (star.z < 1) {
          star.z = width;
          star.x = Math.random() * width - width / 2;
          star.y = Math.random() * height - height / 2;
          star.pz = star.z;
        }

        const sx = (star.x / star.z) * width + cx;
        const sy = (star.y / star.z) * height + cy;
        const px = (star.x / star.pz) * width + cx;
        const py = (star.y / star.pz) * height + cy;

        const size = (1 - star.z / width) * 2.5;
        const opacity = Math.max(0, 1 - star.z / width);

        ctx.beginPath();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = star.color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      });

      ctx.globalAlpha = 1.0; // Reset alpha
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 bg-[#050507]"
    />
  );
}
"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "framer-motion";

interface VortexProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}

export const Vortex = ({
  children,
  className,
  containerClassName,
  particleCount = 700,
  rangeY = 100,
  baseSpeed = 0.0,
  rangeSpeed = 1.5,
  baseRadius = 1,
  rangeRadius = 2,
  baseHue = 220,
  backgroundColor = "#000000",
}: VortexProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const particlePropsLength = particleCount * 9;
  const particleProps = useRef<Float32Array>(new Float32Array(0));
  const tick = useRef(0);
  const center = useRef<[number, number]>([0, 0]);
  const animationFrame = useRef<number | null>(null);

  const noise3D = createNoise3D();

  const rand = (n: number) => n * Math.random();
  const randRange = (n: number) => n - rand(2 * n);
  const fadeInOut = (t: number, m: number) => {
    const hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  };
  const lerp = (n1: number, n2: number, speed: number) => {
    return (1 - speed) * n1 + speed * n2;
  };

  const initParticle = (i: number, canvas: HTMLCanvasElement) => {
    const x = rand(canvas.width);
    const y = center.current[1] + randRange(rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = 50 + rand(150);
    const speed = baseSpeed + rand(rangeSpeed);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + rand(100);

    particleProps.current.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  };

  const updateParticle = (
    i: number,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ) => {
    const props = particleProps.current;
    let x = props[i];
    let y = props[i + 1];
    let vx = props[i + 2];
    let vy = props[i + 3];
    let life = props[i + 4];
    const ttl = props[i + 5];
    const speed = props[i + 6];
    const radius = props[i + 7];
    const hue = props[i + 8];

    const n =
      noise3D(x * 0.00125, y * 0.00125, tick.current * 0.0005) * 3 * (2 * Math.PI);

    const nextVx = lerp(vx, Math.cos(n), 0.5);
    const nextVy = lerp(vy, Math.sin(n), 0.5);
    const nextX = x + nextVx * speed;
    const nextY = y + nextVy * speed;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = radius;
    ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nextX, nextY);
    ctx.stroke();
    ctx.restore();

    props[i] = nextX;
    props[i + 1] = nextY;
    props[i + 2] = nextVx;
    props[i + 3] = nextVy;
    props[i + 4] = life + 1;

    if (
      nextX > canvas.width ||
      nextX < 0 ||
      nextY > canvas.height ||
      nextY < 0 ||
      life > ttl
    ) {
      initParticle(i, canvas);
    }
  };

  const draw = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    tick.current++;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particlePropsLength; i += 9) {
      updateParticle(i, canvas, ctx);
    }

    ctx.save();
    ctx.filter = "blur(8px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.filter = "blur(4px) brightness(200%)";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    animationFrame.current = requestAnimationFrame(() => draw(canvas, ctx));
  };

  const handleResize = (canvas: HTMLCanvasElement) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    center.current = [0.5 * canvas.width, 0.5 * canvas.height];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    particleProps.current = new Float32Array(particlePropsLength);
    handleResize(canvas);

    for (let i = 0; i < particlePropsLength; i += 9) {
      initParticle(i, canvas);
    }

    draw(canvas, ctx);

    const onResize = () => handleResize(canvas);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [
    particleCount,
    rangeY,
    baseSpeed,
    rangeSpeed,
    baseRadius,
    rangeRadius,
    baseHue,
    backgroundColor,
  ]);

  return (
    <div className={cn("relative h-full w-full", containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-0 flex h-full w-full items-center justify-center bg-transparent"
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </motion.div>
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

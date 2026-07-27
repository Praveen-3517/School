"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  friction?: number;
  trails?: number;
  size?: number;
  dampening?: number;
  tension?: number;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Strand {
  spring: number;
  friction: number;
  nodes: Node[];
}

export const SleekLineCursor: React.FC<Props> = ({
  friction = 0.5,
  trails = 20,
  size = 50,
  dampening = 0.25,
  tension = 0.98,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const mouse = { x: -9999, y: -9999 };
    let hasMoved = false;

    let strands: Strand[] = [];

    function buildStrands() {
      const baseSpring = 1 - tension;

      strands = Array.from({ length: trails }, () => ({
        spring: Math.max(0.001, baseSpring + (Math.random() * 0.08 - 0.04)),
        friction: Math.min(0.99, Math.max(0.01, friction + (Math.random() * 0.06 - 0.03))),
        nodes: Array.from({ length: size }, () => ({
          x: mouse.x,
          y: mouse.y,
          vx: 0,
          vy: 0,
        })),
      }));
    }

    function resize() {
      if (!canvas || !ctx) return;
      dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      hasMoved = true;
    }

    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      hasMoved = true;
    }

    function updateStrand(strand: Strand) {
      const { nodes, spring, friction: strandFriction } = strand;

      const head = nodes[0];
      head.vx += (mouse.x - head.x) * spring;
      head.vy += (mouse.y - head.y) * spring;
      head.vx *= strandFriction;
      head.vy *= strandFriction;
      head.x += head.vx;
      head.y += head.vy;

      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const prev = nodes[i - 1];

        node.vx += (prev.x - node.x) * spring;
        node.vy += (prev.y - node.y) * spring;
        node.vx += prev.vx * dampening;
        node.vy += prev.vy * dampening;

        node.vx *= strandFriction;
        node.vy *= strandFriction;
        node.x += node.vx;
        node.y += node.vy;
      }
    }

    function drawStrand(strand: Strand) {
      if (!ctx) return;
      const nodes = strand.nodes;
      const maxWidth = Math.max(0.6, size / 22);

      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);

      for (let i = 1; i < nodes.length - 2; i++) {
        const node = nodes[i];
        const next = nodes[i + 1];
        const midX = (node.x + next.x) * 0.5;
        const midY = (node.y + next.y) * 0.5;

        const t = i / nodes.length;
        const alpha = Math.max(0, 1 - t);

        ctx.lineWidth = Math.max(0.4, maxWidth * alpha);
        ctx.shadowBlur = 8 * alpha;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
        ctx.quadraticCurveTo(node.x, node.y, midX, midY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(midX, midY);
      }
    }

    function step() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(255, 255, 255, 0.9)";

      if (hasMoved) {
        for (const strand of strands) {
          updateStrand(strand);
          drawStrand(strand);
        }
      }

      rafId = requestAnimationFrame(step);
    }

    buildStrands();
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [friction, trails, size, dampening, tension]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  );
};

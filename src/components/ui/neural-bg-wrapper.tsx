"use client";

import dynamic from "next/dynamic";

export const NeuralBgWrapper = dynamic(
  () => import("./neural-bg").then((mod) => mod.NeuralBg),
  { ssr: false }
);

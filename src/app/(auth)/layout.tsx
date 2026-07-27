import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your EduManage account",
};

import { NeuralBgWrapper } from "@/components/ui/neural-bg-wrapper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <NeuralBgWrapper />
      </div>
      {/* Content layer */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

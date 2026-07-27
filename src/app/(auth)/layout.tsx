import type { Metadata } from "next";
import { Vortex } from "@/components/ui/vortex";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your EduManage account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-black">
      {/* Background layer */}
      <Vortex
        particleCount={500}
        baseHue={220}
        baseSpeed={0}
        rangeSpeed={1.5}
        backgroundColor="#000000"
        className="absolute inset-0 z-0"
        containerClassName="absolute inset-0 z-0"
      />
      
      {/* Content layer */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

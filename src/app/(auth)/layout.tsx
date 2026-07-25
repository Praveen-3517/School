import type { Metadata } from "next";
import { SingularityBackground } from "@/components/ui/singularity-background";

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
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background layer */}
      <SingularityBackground speed={0.5} mouseSensitivity={1} hue={220} saturation={0.8} brightness={0.5} />
      
      {/* Content layer */}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

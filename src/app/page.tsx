import Link from "next/link";
import { SingularityBackground } from "@/components/ui/singularity-background";

export default function RootPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background layer */}
      <SingularityBackground />

      {/* Content layer */}
      <div className="z-10 flex flex-col items-center text-center space-y-6 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          EduManage
        </h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl drop-shadow-lg font-medium">
          The ultimate platform for modern school management. Streamline operations, track performance, and empower educators.
        </p>
        
        <div className="pt-6">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md bg-white/10 px-8 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95 border border-white/20"
          >
            Access Portal
          </Link>
        </div>
      </div>
    </main>
  );
}

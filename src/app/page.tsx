import Link from "next/link";
import { Vortex } from "@/components/ui/vortex";

export default function RootPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
      <Vortex
        particleCount={700}
        rangeY={100}
        baseHue={220}
        baseSpeed={0}
        rangeSpeed={1.5}
        baseRadius={1}
        rangeRadius={2}
        backgroundColor="#000000"
        className="flex size-full flex-col items-center justify-center px-2 py-4 md:px-10"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-2xl">
          EduManage
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-200 max-w-2xl text-center drop-shadow-lg font-medium">
          The ultimate platform for modern school management. Streamline operations, track performance, and empower educators.
        </p>
        
        <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95 shadow-lg"
          >
            Access Portal
          </Link>
        </div>
      </Vortex>
    </main>
  );
}

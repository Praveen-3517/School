import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">Loading data...</p>
    </div>
  );
}

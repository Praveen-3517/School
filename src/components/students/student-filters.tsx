"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export function StudentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") || "";
  const initialStatus = searchParams.get("status") || "ALL";

  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);

  const debouncedQuery = useDebounce(query, 300);

  // Apply filters to URL
  const applyFilters = useCallback(
    (newQuery: string, newStatus: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (newQuery) {
        params.set("query", newQuery);
      } else {
        params.delete("query");
      }

      if (newStatus && newStatus !== "ALL") {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }

      // Reset to page 1 when filtering
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Trigger search on debounce query change
  useEffect(() => {
    applyFilters(debouncedQuery, status);
  }, [debouncedQuery, status, applyFilters]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, enrollment no, admission no..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="w-full sm:w-[200px]">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="GRADUATED">Graduated</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

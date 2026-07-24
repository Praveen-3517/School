import { redirect } from "next/navigation";

// Root page — middleware handles redirect based on auth state,
// but this is a fallback
export default function RootPage() {
  redirect("/login");
}

import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full flex flex-col items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center border-dashed">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Construction className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>
            {description || "This feature is currently under construction and will be available in the next phase of development."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We are working hard to bring you this functionality soon. Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

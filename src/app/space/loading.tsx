import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Loading spaces...</p>
    </div>
  );
}
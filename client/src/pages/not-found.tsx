import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center education-bg">
      <Card className="education-card max-w-lg mx-4">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="cinzel text-3xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="floating-action text-background font-semibold px-6 py-3"
          >
            Return to Dashboard
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ProgressCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  testId?: string;
}

export default function ProgressCard({ title, value, icon: Icon, gradient, testId }: ProgressCardProps) {
  return (
    <Card className="education-card elite-interactive border-primary/20 hover:border-primary/40 group" data-testid={testId}>
      <CardContent className="p-6 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-muted-foreground text-sm geist font-medium group-hover:text-foreground transition-colors">{title}</p>
            <p className="cinzel text-3xl font-bold text-shimmer mt-1">{value}</p>
          </div>
          <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
            <Icon className="w-7 h-7 text-white drop-shadow-lg" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </CardContent>
    </Card>
  );
}

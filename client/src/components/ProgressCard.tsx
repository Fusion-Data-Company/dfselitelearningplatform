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
    <Card className="glow-card glassmorphism ambient-glow border-border" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="cinzel text-2xl font-bold text-primary">{value}</p>
          </div>
          <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center opacity-20`}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

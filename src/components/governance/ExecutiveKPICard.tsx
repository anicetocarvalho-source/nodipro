import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ExecutiveKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  progress?: number;
  trend?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
  size?: "sm" | "md" | "lg";
}

export function ExecutiveKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  progress,
  trend,
  size = "md",
}: ExecutiveKPICardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
      <CardContent className={cn("p-4", size === "lg" && "p-6")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "font-bold",
                size === "sm" && "text-xl",
                size === "md" && "text-2xl",
                size === "lg" && "text-3xl",
              )}>
                {value}
              </span>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.type === "positive" && "text-success",
                  trend.type === "negative" && "text-destructive",
                  trend.type === "neutral" && "text-muted-foreground"
                )}>
                  {trend.value}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {progress !== undefined && (
              <Progress value={progress} className="h-1.5 mt-2" />
            )}
          </div>
          <div className={cn("p-3 rounded-xl bg-accent/50", iconColor)}>
            <Icon className={cn(
              size === "sm" && "h-4 w-4",
              size === "md" && "h-5 w-5",
              size === "lg" && "h-6 w-6",
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

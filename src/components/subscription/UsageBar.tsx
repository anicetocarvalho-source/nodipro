import { Progress } from '@/components/ui/progress';

interface UsageBarProps {
  label: string;
  current: number;
  max: number;
}

export function UsageBar({ label, current, max }: UsageBarProps) {
  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-yellow-600 font-medium' : 'text-foreground'}>
          {current} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percentage}
          className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
        />
      )}
    </div>
  );
}

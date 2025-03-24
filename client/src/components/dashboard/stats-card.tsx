import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: "up" | "down";
  };
  className?: string;
}

export function StatsCard({ title, value, icon, change, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white overflow-hidden shadow rounded-lg", className)}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 rounded-md p-3 bg-primary bg-opacity-10">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div 
                    className={cn(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      change.trend === "up" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {change.trend === "up" ? (
                      <ArrowUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-1" />
                    )}
                    <span>{Math.abs(change.value)}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

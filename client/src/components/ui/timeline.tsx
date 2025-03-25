import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TimelineItemProps = {
  date: Date | string;
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
  active?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

export function TimelineItem({
  date,
  title,
  description,
  icon,
  children,
  className,
  iconClassName,
  onClick,
  active = false,
  isFirst = false,
  isLast = false,
}: TimelineItemProps) {
  // Format the date
  const formattedDate = typeof date === "string" 
    ? date 
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);

  return (
    <div 
      className={cn(
        "relative flex gap-4 pb-8 group",
        isLast && "pb-0",
        className
      )}
      onClick={onClick}
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute left-[19px] top-[30px] bottom-0 w-[2px] bg-muted group-hover:bg-muted-foreground/20" />
      )}
      
      {/* Icon or marker */}
      <div className="relative z-10 flex-shrink-0">
        <div 
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm",
            active ? "border-primary" : "border-muted group-hover:border-muted-foreground/50",
            iconClassName
          )}
        >
          {icon || (
            <div className={cn(
              "h-3 w-3 rounded-full",
              active ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-muted-foreground/70"
            )} />
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <h4 className="font-medium leading-none">{title}</h4>
            <time className="text-sm text-muted-foreground">{formattedDate}</time>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {children && (
            <div className="mt-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type TimelineProps = {
  children: ReactNode;
  className?: string;
};

export function Timeline({ children, className }: TimelineProps) {
  // Count the children to determine first and last items
  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;
  
  // Clone children and add isFirst and isLast props
  const enhancedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      // Only add props safely
      const props: any = {
        isFirst: index === 0,
        isLast: index === childCount - 1,
      };
      return React.cloneElement(child, props);
    }
    return child;
  });
  
  return (
    <div className={cn("", className)}>
      {enhancedChildren}
    </div>
  );
}
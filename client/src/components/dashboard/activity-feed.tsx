import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Users, Calendar, MessageSquare, FileText, AlertCircle, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// Define the activity type
export interface ActivityItem {
  id: number;
  type: string; // Using string instead of union type for flexibility
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  relatedId?: number;
  priority?: string; // Using string instead of union type for flexibility
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxHeight?: string;
  onMarkAsRead?: (id: number) => void;
  onViewAll?: () => void;
}

export function ActivityFeed({ 
  activities, 
  maxHeight = "400px", 
  onMarkAsRead,
  onViewAll 
}: ActivityFeedProps) {
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...activities].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'patient':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-purple-500" />;
      case 'document':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'reminder':
        return <CheckCircle className="h-5 w-5 text-teal-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleMarkAsRead = (id: number) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div className="bg-card shadow rounded-lg">
      <div className="px-4 py-5 border-b border-border sm:px-6 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg leading-6 font-medium text-card-foreground">Activity Feed</h3>
          <div className="ml-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
            {activities.filter(a => !a.isRead).length}
          </div>
        </div>
      </div>
      
      <ScrollArea className={`p-4 max-h-[${maxHeight}]`}>
        {sortedActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedActivities.map((activity) => (
              <div 
                key={activity.id}
                className={`
                  p-3 border rounded-lg transition-colors
                  ${!activity.isRead ? 'bg-primary/5 border-primary/20' : 'bg-background border-border'}
                  ${activity.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
                  ${activity.priority === 'medium' ? 'border-l-4 border-l-yellow-500' : ''}
                `}
              >
                <div className="flex">
                  <div className="mr-3 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-card-foreground">{activity.title}</h4>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                    
                    {!activity.isRead && (
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-7 px-2"
                          onClick={() => handleMarkAsRead(activity.id)}
                        >
                          Mark as read
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {activities.length > 0 && (
        <div className="px-6 py-4 border-t border-border text-center">
          <Button variant="link" className="text-primary" onClick={onViewAll}>
            View all activity
          </Button>
        </div>
      )}
    </div>
  );
}
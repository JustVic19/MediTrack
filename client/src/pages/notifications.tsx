import { useState, useEffect } from "react";
import { 
  useQuery, 
  useQueryClient, 
  useMutation 
} from "@tanstack/react-query";
import { Bell, CheckCircle, AlertCircle, Calendar, Clock, Info, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Types for notifications
interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'alert' | 'info';
  read: boolean;
  linkTo?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  // Dummy data for notifications (will be replaced with API call)
  const dummyNotifications: Notification[] = [
    {
      id: 1,
      title: "New Appointment Scheduled",
      message: "A new appointment has been scheduled for John Doe on April 2, 2025.",
      type: "appointment",
      read: false,
      linkTo: "/appointments",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Patient Check-in Reminder",
      message: "Reminder to check in with patient Sarah Johnson for follow-up.",
      type: "reminder",
      read: true,
      linkTo: "/patients/3",
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 3,
      title: "Lab Results Available",
      message: "The lab results for patient Michael Brown are now available for review.",
      type: "alert",
      read: false,
      linkTo: "/patients/5/history",
      createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    },
    {
      id: 4,
      title: "New Message from Patient",
      message: "You have received a new message from Emily Parker regarding her medication.",
      type: "info",
      read: false,
      linkTo: "/patients/8",
      createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    },
    {
      id: 5,
      title: "Appointment Cancellation",
      message: "The appointment with Robert Wilson for tomorrow has been cancelled.",
      type: "appointment",
      read: true,
      linkTo: "/appointments",
      createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
  ];

  // Query for notifications (would need API endpoint)
  const { 
    data: notifications = [] as Notification[], 
    isLoading,
    error
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      // This should be replaced with an actual API call once implemented
      // For now, return dummy data
      return dummyNotifications;
    }
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      // This would be replaced with an actual API call in production
      // For now, simulate the API call by updating our local data
      const notificationIndex = dummyNotifications.findIndex(n => n.id === id);
      if (notificationIndex >= 0) {
        dummyNotifications[notificationIndex].read = true;
      }
      return { success: true };
    },
    onSuccess: () => {
      // Refresh the notifications data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not mark notification as read: ${error.message}`,
      });
    }
  });

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  // Count of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Handler for marking a notification as read
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // Handler for marking all notifications as read
  const handleMarkAllAsRead = () => {
    // This would be an API call in production
    // For now, simulate marking all as read
    dummyNotifications.forEach(notification => {
      notification.read = true;
    });
    
    // Refresh the notifications data
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    
    toast({
      title: "Success",
      description: "All notifications marked as read",
    });
  };

  // Icon mapping for notification types
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'alert': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <MessageSquare className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Color mapping for notification types
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment': return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'reminder': return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case 'alert': return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case 'info':
      default: return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your notifications and alerts
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-8">
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointment">Appointments</TabsTrigger>
          <TabsTrigger value="reminder">Reminders</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="info">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="mb-4">
                <Skeleton className="h-[140px] w-full rounded-md" />
              </div>
            ))
          ) : error ? (
            // Error state
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="h-10 w-10 text-destructive mb-2" />
                  <h3 className="font-medium text-lg mb-1">Error Loading Notifications</h3>
                  <p className="text-muted-foreground">
                    There was a problem loading your notifications.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/notifications'] })}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            // Empty state
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <Bell className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium text-lg mb-1">No Notifications</h3>
                  <p className="text-muted-foreground">
                    You don't have any {activeTab !== 'all' ? activeTab : ''} notifications yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Notification list
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-colors ${!notification.read ? 'border-primary/50 bg-accent/20' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline"
                          className={`mr-2 px-2 py-1 flex items-center ${getNotificationColor(notification.type)}`}
                        >
                          {getNotificationIcon(notification.type)}
                          <span className="ml-1 capitalize">{notification.type}</span>
                        </Badge>
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                      </div>
                      <Badge variant={notification.read ? "outline" : "default"}>
                        {notification.read ? "Read" : "New"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {format(new Date(notification.createdAt), 'PPp')}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p>{notification.message}</p>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-0">
                    <div>
                      {notification.linkTo && (
                        <Link to={notification.linkTo}>
                          <Button variant="link" size="sm" className="px-0">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark as Read
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
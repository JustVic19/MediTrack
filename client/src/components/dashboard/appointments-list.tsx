import { useState } from "react";
import { format } from "date-fns";
import { Patient } from "@shared/schema";
import { Appointment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface AppointmentsListProps {
  appointments: (Appointment & { patient?: Patient })[];
  date?: Date;
}

export function AppointmentsList({ appointments, date = new Date() }: AppointmentsListProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<{[key: number]: boolean}>({});

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
    }
  };

  const getNameInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const handleSendReminder = async (appointmentId: number) => {
    try {
      setIsLoading(prev => ({ ...prev, [appointmentId]: true }));
      await apiRequest('POST', `/api/appointments/${appointmentId}/send-reminder`, {});
      
      toast({
        title: "Reminder sent",
        description: "SMS reminder has been sent successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  return (
    <div className="bg-card shadow rounded-lg">
      <div className="px-4 py-5 border-b border-border sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-card-foreground">Today's Appointments</h3>
        <div className="text-sm text-muted-foreground">{format(date, 'MMMM d, yyyy')}</div>
      </div>
      
      <div className="p-4 space-y-3">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No appointments scheduled for today.
          </div>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="p-3 bg-background border border-border rounded-lg shadow-sm hover:bg-muted/10">
              <div className="flex justify-between">
                <div className="text-sm font-medium text-card-foreground">
                  {format(new Date(appointment.appointmentDate), 'h:mm a')}
                </div>
                <Badge variant="outline" className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="mt-2 flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${appointment.patient?.firstName}+${appointment.patient?.lastName}&background=random`} />
                  <AvatarFallback>
                    {appointment.patient ? 
                      getNameInitials(appointment.patient.firstName, appointment.patient.lastName) : 
                      'P'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-card-foreground">
                    {appointment.patient ? 
                      `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                      'Patient data loading...'}
                  </div>
                  <div className="text-xs text-muted-foreground">{appointment.reason}</div>
                </div>
              </div>
              
              <div className="mt-3 flex justify-end space-x-2">
                <Button size="sm" variant="default">
                  Details
                </Button>
                {!appointment.smsReminderSent && appointment.status === 'confirmed' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={isLoading[appointment.id]}
                    onClick={() => handleSendReminder(appointment.id)}
                  >
                    {isLoading[appointment.id] ? 'Sending...' : 'Send Reminder'}
                  </Button>
                )}
                {appointment.status !== 'cancelled' && (
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="px-6 py-4 border-t border-border">
        <Button variant="link" className="text-primary hover:text-primary/80 font-medium p-0">
          Schedule new appointment →
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Appointment } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarPlus, Clock, MapPin, Calendar as CalendarIcon, AlertCircle, ThumbsUp, Loader2 } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  onRequestCancel: (appointmentId: number) => void;
}

function AppointmentCard({ appointment, onRequestCancel }: AppointmentCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const statusColors: Record<string, string> = {
    'Scheduled': 'bg-blue-100 text-blue-800',
    'Confirmed': 'bg-green-100 text-green-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'Rescheduled': 'bg-yellow-100 text-yellow-800',
    'No-Show': 'bg-gray-100 text-gray-800',
  };
  
  const statusColor = statusColors[appointment.status] || 'bg-gray-100 text-gray-800';
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{appointment.reason}</CardTitle>
            <CardDescription>
              {format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')}
            </CardDescription>
          </div>
          <Badge className={statusColor}>{appointment.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(appointment.appointmentDate), 'h:mm a')}</span>
          </div>
          {appointment.doctorName && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>Dr. {appointment.doctorName}</span>
            </div>
          )}
          {appointment.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.location}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {appointment.status === 'Scheduled' || appointment.status === 'Confirmed' ? (
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            Request Cancellation
          </Button>
        ) : null}
      </CardFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to request to cancel this appointment? 
              Your healthcare provider will be notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                onRequestCancel(appointment.id);
                setDialogOpen(false);
              }}
            >
              Request Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AppointmentRequestForm({ patientId, onClose }: { patientId: number, onClose: () => void }) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  
  const appointmentMutation = useMutation({
    mutationFn: async (appointmentData: { patientId: number, appointmentDate: Date, reason: string }) => {
      const response = await apiRequest('POST', '/api/appointments/request', appointmentData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Appointment Requested',
        description: 'Your appointment request has been submitted. You will be notified when it is confirmed.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/appointments'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to request appointment: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast({
        title: 'Missing Date',
        description: 'Please select a preferred date for your appointment',
        variant: 'destructive',
      });
      return;
    }
    
    if (!reason.trim()) {
      toast({
        title: 'Missing Reason',
        description: 'Please provide a reason for your appointment',
        variant: 'destructive',
      });
      return;
    }
    
    appointmentMutation.mutate({
      patientId,
      appointmentDate: selectedDate,
      reason,
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Preferred Date</Label>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => {
            // Disable past dates and weekends
            const day = date.getDay();
            return date < new Date() || day === 0 || day === 6;
          }}
          className="rounded-md border mx-auto"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reason">Reason for Appointment</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please describe your symptoms or reason for visit"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={appointmentMutation.isPending}
        >
          {appointmentMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting
            </>
          ) : (
            'Request Appointment'
          )}
        </Button>
      </div>
    </form>
  );
}

export default function PatientPortalAppointments({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  const { data: appointments, isLoading, isError } = useQuery<Appointment[]>({
    queryKey: ['/api/patient-portal/appointments', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/appointments?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const response = await apiRequest('POST', `/api/appointments/${appointmentId}/cancel-request`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Cancellation Requested',
        description: 'Your cancellation request has been submitted. You will receive a confirmation soon.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/appointments'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to request cancellation: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleCancelRequest = (appointmentId: number) => {
    cancelMutation.mutate(appointmentId);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading appointments
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading your appointments. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Filter appointments into upcoming and past
  const now = new Date();
  const upcomingAppointments = appointments?.filter(
    appt => new Date(appt.appointmentDate) >= now && appt.status !== 'Cancelled'
  ) || [];
  
  const pastAppointments = appointments?.filter(
    appt => new Date(appt.appointmentDate) < now || appt.status === 'Cancelled'
  ) || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Appointments</h2>
        <Button 
          onClick={() => setShowRequestForm(true)}
          className="flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Request Appointment
        </Button>
      </div>
      
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request New Appointment</DialogTitle>
            <DialogDescription>
              Fill out the form below to request a new appointment with your healthcare provider.
            </DialogDescription>
          </DialogHeader>
          <AppointmentRequestForm 
            patientId={patientId} 
            onClose={() => setShowRequestForm(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(appointment => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                onRequestCancel={handleCancelRequest}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <ThumbsUp className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Upcoming Appointments</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any upcoming appointments scheduled. Use the "Request Appointment" button to schedule your next visit.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-4">
          {pastAppointments.length > 0 ? (
            pastAppointments.map(appointment => (
              <AppointmentCard 
                key={appointment.id} 
                appointment={appointment} 
                onRequestCancel={handleCancelRequest}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <CalendarIcon className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Past Appointments</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any past appointment records in our system.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
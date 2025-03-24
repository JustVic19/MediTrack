import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Pencil, Bell } from "lucide-react";
import { Appointment, Patient } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Appointments() {
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { toast } = useToast();
  const [loadingReminderIds, setLoadingReminderIds] = useState<number[]>([]);

  // Fetch all appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Fetch patients for mapping names
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsNewAppointmentModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setIsNewAppointmentModalOpen(false);
  };

  const getPatientName = (patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendReminder = async (appointment: Appointment) => {
    if (appointment.smsReminderSent) {
      toast({
        title: "Reminder already sent",
        description: "An SMS reminder has already been sent for this appointment.",
      });
      return;
    }

    try {
      setLoadingReminderIds(prev => [...prev, appointment.id]);
      
      await apiRequest('POST', `/api/appointments/${appointment.id}/send-reminder`, {});
      
      toast({
        title: "Reminder sent",
        description: "SMS reminder has been sent successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingReminderIds(prev => prev.filter(id => id !== appointment.id));
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading
              ? "Loading appointments..."
              : `Total ${appointments.length} appointment${appointments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsNewAppointmentModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Loading appointments...
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No appointments found. Create your first appointment.
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">
                        {getPatientName(appointment.patientId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="h-3 w-3 mr-2" />
                          {format(new Date(appointment.appointmentDate), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>{appointment.reason}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {appointment.smsReminderSent ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600">
                            Sent
                          </Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendReminder(appointment)}
                            disabled={loadingReminderIds.includes(appointment.id)}
                          >
                            {loadingReminderIds.includes(appointment.id) ? (
                              "Sending..."
                            ) : (
                              <>
                                <Bell className="h-3 w-3 mr-1" />
                                Send
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Modal */}
      <Dialog open={isNewAppointmentModalOpen} onOpenChange={setIsNewAppointmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
            </DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            defaultValues={selectedAppointment || undefined}
            onSuccess={closeModal}
            isEditMode={!!selectedAppointment}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

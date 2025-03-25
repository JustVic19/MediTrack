import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { PatientForm } from "@/components/forms/patient-form";
import { Patient, Appointment, PatientHistory } from "@shared/schema";
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Edit,
  FileText, // Using FileText instead of FileMedical
  MessageSquare,
  Stethoscope
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PatientDetail() {
  const [, params] = useRoute("/patients/:id");
  const patientId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("details");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch patient details
  const { data: patient, isLoading: isLoadingPatient } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch patient's appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !!patientId,
  });

  // Fetch patient's history
  const { data: patientHistory = [], isLoading: isLoadingHistory } = useQuery<PatientHistory[]>({
    queryKey: [`/api/patients/${patientId}/history`],
    enabled: !!patientId,
  });

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium">Loading patient information...</h2>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium text-red-500">Patient not found</h2>
          <p className="mt-2 text-gray-500">The patient you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="mt-4">
            <Link href="/patients">Back to Patients</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNameInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  const handleSendReminder = async (appointmentId: number) => {
    try {
      await apiRequest('POST', `/api/appointments/${appointmentId}/send-reminder`, {});
      
      toast({
        title: "Reminder sent",
        description: "SMS reminder has been sent successfully.",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}/appointments`] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/patients">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">Patient Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button asChild variant="outline" className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0">
            <Link href={`/symptom-checker?patientId=${patientId}`}>
              <Stethoscope className="h-4 w-4 mr-2" />
              Symptom Checker
            </Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Link href={`/health-timeline/${patientId}`}>
              <FileText className="h-4 w-4 mr-2" />
              View Health Timeline
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Patient Profile Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://ui-avatars.com/api/?name=${patient.firstName}+${patient.lastName}&background=random`} />
                <AvatarFallback>{getNameInitials(patient.firstName, patient.lastName)}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className={getStatusColor(patient.status)}>
                    {patient.status}
                  </Badge>
                  <span className="ml-2 text-sm text-gray-500">ID: {patient.patientId}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button variant="outline" onClick={() => setIsAppointmentModalOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
              <Button onClick={() => setIsEditModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Patient
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div>{patient.phone}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div>{patient.email || 'Not provided'}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <div className="text-sm text-gray-500">Date of Birth</div>
                <div>{format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')} ({new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for Details, Appointments, History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="history">Medical History</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Personal Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 block">Full Name</span>
                      <span>{patient.firstName} {patient.lastName}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Gender</span>
                      <span>{patient.gender}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Date of Birth</span>
                      <span>{format(new Date(patient.dateOfBirth), 'MMMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Patient ID</span>
                      <span>{patient.patientId}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-500 block">Phone Number</span>
                      <span>{patient.phone}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Email Address</span>
                      <span>{patient.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">Address</span>
                      <span>{patient.address || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block">SMS Notifications</span>
                      <span>{patient.smsOptIn ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Medical Information</h3>
                <div>
                  <span className="text-sm text-gray-500 block">Medical History</span>
                  <p className="mt-1 whitespace-pre-wrap">{patient.medicalHistory || 'No medical history recorded.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Appointments</span>
                <Button size="sm" onClick={() => setIsAppointmentModalOpen(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="text-center py-10">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No appointments found</h3>
                  <p className="text-gray-500 mb-4">This patient doesn't have any scheduled appointments yet.</p>
                  <Button onClick={() => setIsAppointmentModalOpen(true)}>
                    Schedule First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointmentDate), 'MMMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2" />
                            {format(new Date(appointment.appointmentDate), 'h:mm a')}
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          appointment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                        <p>{appointment.reason}</p>
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                          <p className="text-sm">{appointment.notes}</p>
                        </div>
                      )}
                      
                      <div className="mt-4 flex justify-end space-x-2">
                        {!appointment.smsReminderSent && 
                         patient.smsOptIn && 
                         ['scheduled', 'confirmed'].includes(appointment.status) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSendReminder(appointment.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Reminder
                          </Button>
                        )}
                        <Button size="sm">Edit Appointment</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Medical History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Medical History</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white border-0" asChild>
                    <Link href={`/symptom-checker?patientId=${patientId}`}>
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Symptom Checker
                    </Link>
                  </Button>
                  <Button size="sm" variant="default" asChild>
                    <Link href={`/health-timeline/${patientId}`}>
                      <FileText className="h-4 w-4 mr-2" />
                      View Health Timeline
                    </Link>
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Complete medical history for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-10">Loading medical history...</div>
              ) : patientHistory.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No medical history found</h3>
                  <p className="text-gray-500 mb-4">This patient doesn't have any recorded medical history yet.</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button asChild>
                      <Link href={`/symptom-checker?patientId=${patientId}`}>
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Run Symptom Checker
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/health-timeline/${patientId}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Health Timeline
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {patientHistory.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">
                          {format(new Date(entry.visitDate), 'MMMM d, yyyy')}
                        </h3>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Diagnosis</h4>
                          <p className="mt-1">{entry.diagnosis}</p>
                        </div>
                        
                        {entry.treatment && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Treatment</h4>
                            <p className="mt-1">{entry.treatment}</p>
                          </div>
                        )}
                        
                        {entry.prescriptions && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Prescriptions</h4>
                            <p className="mt-1">{entry.prescriptions}</p>
                          </div>
                        )}
                        
                        {entry.notes && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                            <p className="mt-1">{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Patient Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <PatientForm 
            defaultValues={patient} 
            onSuccess={() => setIsEditModalOpen(false)} 
            isEditMode={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* New Appointment Modal */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            onSuccess={() => setIsAppointmentModalOpen(false)}
            selectedPatientId={patient.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

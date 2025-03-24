import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PatientTable } from "@/components/dashboard/patient-table";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/forms/patient-form";
import { Search, UserRound, Calendar, UserPlus, Bell } from "lucide-react";
import { format } from "date-fns";
import { Patient, Appointment } from "@shared/schema";

export default function Dashboard() {
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch today's appointments with patient information
  const { data: todayAppointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/today'],
  });

  // Combine appointment data with patient data
  const appointmentsWithPatients = todayAppointments.map(appointment => {
    const patient = patients.find(p => p.id === appointment.patientId);
    return { ...appointment, patient };
  });

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Dashboard Header */}
      <div className="md:flex md:justify-between md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search patients..."
              className="pl-10 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button onClick={() => setIsNewPatientModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Patients"
          value={isLoadingStats ? "Loading..." : stats?.totalPatients}
          icon={<UserRound className="h-6 w-6 text-primary" />}
          change={{ value: 3.2, trend: "up" }}
        />
        
        <StatsCard
          title="Today's Appointments"
          value={isLoadingStats ? "Loading..." : stats?.todayAppointments}
          icon={<Calendar className="h-6 w-6 text-green-500" />}
          change={{ value: 12, trend: "up" }}
        />
        
        <StatsCard
          title="New Patients (This Week)"
          value={isLoadingStats ? "Loading..." : stats?.newPatients}
          icon={<UserPlus className="h-6 w-6 text-purple-500" />}
          change={{ value: 5.1, trend: "down" }}
        />
        
        <StatsCard
          title="SMS Reminders Sent"
          value={isLoadingStats ? "Loading..." : stats?.smsReminders}
          icon={<Bell className="h-6 w-6 text-yellow-500" />}
          change={{ value: 8.9, trend: "up" }}
        />
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Patients */}
        <div className="lg:col-span-2">
          <PatientTable 
            patients={patients} 
            limit={4} 
          />
        </div>
        
        {/* Today's Appointments */}
        <div>
          <AppointmentsList 
            appointments={appointmentsWithPatients} 
          />
        </div>
      </div>

      {/* New Patient Modal */}
      <Dialog open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={() => setIsNewPatientModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

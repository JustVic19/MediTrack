import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { PatientTable } from "@/components/dashboard/patient-table";
import { AppointmentsList } from "@/components/dashboard/appointments-list";
import { CalendarView } from "@/components/dashboard/calendar-view";
import { ActivityFeed, ActivityItem } from "@/components/dashboard/activity-feed";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientForm } from "@/components/forms/patient-form";
// We'll use PatientForm for now as AppointmentForm isn't completely implemented
// import { AppointmentForm } from "@/components/forms/appointment-form";
import { useToast } from "@/hooks/use-toast";
import { Search, UserRound, Calendar, UserPlus, Bell, RefreshCw } from "lucide-react";
import { format, addDays, addMonths } from "date-fns";
import { Patient, Appointment } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch dashboard statistics
  const { data: stats = { 
    totalPatients: 0, 
    todayAppointments: 0, 
    newPatients: 0, 
    smsReminders: 0 
  }, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch patients
  const { data: patients = [], isLoading: isLoadingPatients, refetch: refetchPatients } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch today's appointments with patient information
  const { data: todayAppointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/today'],
  });

  // Fetch all appointments for calendar view
  const { data: allAppointments = [], refetch: refetchAllAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
  });

  // Combine appointment data with patient data
  const appointmentsWithPatients = todayAppointments.map(appointment => {
    const patient = patients.find(p => p.id === appointment.patientId);
    return { ...appointment, patient };
  });

  // Sample activity data (this would come from an API in a real app)
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'appointment',
      title: 'New Appointment',
      description: 'Dr. Reynolds scheduled an appointment with Mary Johnson at 2:30 PM tomorrow.',
      timestamp: addDays(new Date(), -1),
      isRead: false,
      priority: 'medium',
    },
    {
      id: 2,
      type: 'patient',
      title: 'New Patient Registered',
      description: 'John Smith completed registration and is awaiting their first appointment.',
      timestamp: addDays(new Date(), -2),
      isRead: true,
    },
    {
      id: 3,
      type: 'alert',
      title: 'Prescription Refill Request',
      description: 'Sarah Williams requested a refill for their hypertension medication.',
      timestamp: new Date(),
      isRead: false,
      priority: 'high',
    },
    {
      id: 4,
      type: 'message',
      title: 'Message from Patient',
      description: 'David Brown sent a message about their upcoming appointment.',
      timestamp: addDays(new Date(), -1),
      isRead: false,
    },
    {
      id: 5,
      type: 'reminder',
      title: 'Appointment Reminder Sent',
      description: '15 SMS reminders were sent to patients with appointments tomorrow.',
      timestamp: addDays(new Date(), -3),
      isRead: true,
    },
  ]);

  // Sample metrics data (this would come from an API in a real app)
  const metricsData = {
    patientVisits: [
      { name: 'Mon', count: 12 },
      { name: 'Tue', count: 19 },
      { name: 'Wed', count: 15 },
      { name: 'Thu', count: 21 },
      { name: 'Fri', count: 16 },
      { name: 'Sat', count: 8 },
      { name: 'Sun', count: 5 },
    ],
    appointmentTypes: [
      { name: 'Check-up', value: 45 },
      { name: 'Follow-up', value: 30 },
      { name: 'Emergency', value: 10 },
      { name: 'Consultation', value: 25 },
      { name: 'Procedure', value: 15 },
    ],
    patientGrowth: [
      { month: 'Jan', patients: 210 },
      { month: 'Feb', patients: 230 },
      { month: 'Mar', patients: 245 },
      { month: 'Apr', patients: 270 },
      { month: 'May', patients: 290 },
      { month: 'Jun', patients: 310 },
      { month: 'Jul', patients: 325 },
      { month: 'Aug', patients: 340 },
      { month: 'Sep', patients: 360 },
      { month: 'Oct', patients: 375 },
      { month: 'Nov', patients: 390 },
      { month: 'Dec', patients: 410 },
    ],
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-patient':
        setIsNewPatientModalOpen(true);
        break;
      case 'new-appointment':
        setIsNewAppointmentModalOpen(true);
        break;
      case 'patient-records':
        window.location.href = '/patients';
        break;
      default:
        toast({
          title: "Feature Coming Soon",
          description: `The ${action.replace('-', ' ')} feature will be available in the next update.`,
        });
    }
  };

  const handleMarkActivityAsRead = (id: number) => {
    setActivities(activities.map(activity => 
      activity.id === id ? { ...activity, isRead: true } : activity
    ));
  };

  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchPatients(),
        refetchAppointments(),
        refetchAllAppointments()
      ]);
      toast({
        title: "Dashboard Refreshed",
        description: "All dashboard data has been updated."
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "There was an error refreshing the dashboard data.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
          <Button 
            variant="outline" 
            onClick={handleRefreshDashboard}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
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

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions onActionClick={handleQuickAction} />
      </div>

      {/* Main Dashboard Content - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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

      {/* Main Dashboard Content - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <CalendarView 
            appointments={allAppointments}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed 
            activities={activities}
            maxHeight="500px"
            onMarkAsRead={handleMarkActivityAsRead}
            onViewAll={() => toast({
              title: "Coming Soon",
              description: "The full activity log will be available in the next update."
            })}
          />
        </div>
      </div>

      {/* Main Dashboard Content - Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Performance Metrics - Takes 3/4 of the row on large screens */}
        <div className="lg:col-span-3">
          <PerformanceMetrics data={metricsData} />
        </div>

        {/* Weather Widget */}
        <div>
          <WeatherWidget 
            location="New York"
            onWeatherLoaded={(data) => console.log("Weather loaded:", data)}
          />
        </div>
      </div>

      {/* New Patient Modal */}
      <Dialog open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm 
            onSuccess={() => {
              setIsNewPatientModalOpen(false);
              refetchPatients();
              refetchStats();
              toast({
                title: "Patient Registered",
                description: "The new patient has been successfully registered.",
              });
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* New Appointment Modal */}
      <Dialog open={isNewAppointmentModalOpen} onOpenChange={setIsNewAppointmentModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Appointment</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="new">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="new">New Appointment</TabsTrigger>
              <TabsTrigger value="followup">Follow-up</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <div className="p-6 text-center">
                <p className="mb-4">This feature is coming soon!</p>
                <Button 
                  onClick={() => {
                    setIsNewAppointmentModalOpen(false);
                    toast({
                      title: "Coming Soon",
                      description: "The appointment scheduling feature will be available in the next update.",
                    });
                  }}
                >
                  Close
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="followup">
              <div className="p-6 text-center">
                <p className="mb-4">Follow-up appointments will be available soon!</p>
                <Button 
                  onClick={() => {
                    setIsNewAppointmentModalOpen(false);
                    toast({
                      title: "Coming Soon",
                      description: "The follow-up scheduling feature will be available in the next update.",
                    });
                  }}
                >
                  Close
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

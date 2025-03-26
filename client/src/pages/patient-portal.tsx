import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Mail,
  Pill,
  UserRound,
  Loader2
} from "lucide-react";

import PatientPortalAppointments from "@/components/patient-portal/appointments";
import PatientPortalRecords from "@/components/patient-portal/records";
import PatientPortalMessages from "@/components/patient-portal/messages";
import PatientPortalPrescriptions from "@/components/patient-portal/prescriptions";
import PatientPortalQuestionnaires from "@/components/patient-portal/questionnaires";

export default function PatientPortal() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Use the patient auth hook for authentication
  const { 
    patient, 
    isLoading, 
    error,
    logoutMutation 
  } = usePatientAuth();

  useEffect(() => {
    // If not loading and no patient is found, redirect to login
    if (!isLoading && !patient) {
      navigate("/patient-login");
    }
  }, [patient, isLoading, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-destructive">
          Error: {error.message || "Failed to check authentication status"}
        </div>
      </div>
    );
  }

  // If not authenticated yet (loading state not finished), show nothing
  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <h1 className="font-semibold text-lg md:text-xl">Patient Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <div className="font-medium">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                Patient ID: {patient.patientId}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="hidden md:block w-64 bg-white dark:bg-slate-900 border-r p-4 space-y-1">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("overview")}
          >
            <Home className="mr-2 h-4 w-4" /> Overview
          </Button>
          <Button
            variant={activeTab === "appointments" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("appointments")}
          >
            <Calendar className="mr-2 h-4 w-4" /> Appointments
          </Button>
          <Button
            variant={activeTab === "records" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("records")}
          >
            <FileText className="mr-2 h-4 w-4" /> Medical Records
          </Button>
          <Button
            variant={activeTab === "messages" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("messages")}
          >
            <Mail className="mr-2 h-4 w-4" /> Messages
          </Button>
          <Button
            variant={activeTab === "prescriptions" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("prescriptions")}
          >
            <Pill className="mr-2 h-4 w-4" /> Prescriptions
          </Button>
          <Button
            variant={activeTab === "questionnaires" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("questionnaires")}
          >
            <ClipboardList className="mr-2 h-4 w-4" /> Questionnaires
          </Button>
          <Separator className="my-4" />
          <Button
            variant={activeTab === "profile" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("profile")}
          >
            <UserRound className="mr-2 h-4 w-4" /> My Profile
          </Button>
        </nav>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t z-10">
          <div className="grid grid-cols-5 gap-1 p-1">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col gap-1 h-16 rounded-lg"
              onClick={() => setActiveTab("overview")}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant={activeTab === "appointments" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col gap-1 h-16 rounded-lg"
              onClick={() => setActiveTab("appointments")}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Visits</span>
            </Button>
            <Button
              variant={activeTab === "records" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col gap-1 h-16 rounded-lg"
              onClick={() => setActiveTab("records")}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Records</span>
            </Button>
            <Button
              variant={activeTab === "messages" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col gap-1 h-16 rounded-lg"
              onClick={() => setActiveTab("messages")}
            >
              <Mail className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              size="sm"
              className="flex flex-col gap-1 h-16 rounded-lg"
              onClick={() => setActiveTab("profile")}
            >
              <UserRound className="h-5 w-5" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-auto">
          <div className="container mx-auto max-w-6xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Card className="flex-1">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Welcome back, {patient.firstName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        Last login: {patient.portalLastLogin ? new Date(patient.portalLastLogin).toLocaleString() : 'First login'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                        Upcoming Appointments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        {/* Summary of upcoming appointments */}
                        <Button 
                          variant="link" 
                          className="p-0" 
                          onClick={() => setActiveTab("appointments")}
                        >
                          View all appointments
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <ClipboardList className="mr-2 h-4 w-4 text-primary" />
                        Questionnaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <Button 
                          variant="link" 
                          className="p-0" 
                          onClick={() => setActiveTab("questionnaires")}
                        >
                          View pending questionnaires
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-primary" />
                        Messages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <Button 
                          variant="link" 
                          className="p-0" 
                          onClick={() => setActiveTab("messages")}
                        >
                          View messages
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Your Appointments</h2>
                  <PatientPortalAppointments patientId={patient.id} />
                </div>
              </TabsContent>

              {/* Medical Records Tab */}
              <TabsContent value="records">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Medical Records</h2>
                  <PatientPortalRecords patientId={patient.id} />
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Messages</h2>
                  <PatientPortalMessages patientId={patient.id} />
                </div>
              </TabsContent>

              {/* Prescriptions Tab */}
              <TabsContent value="prescriptions">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Prescriptions</h2>
                  <PatientPortalPrescriptions patientId={patient.id} />
                </div>
              </TabsContent>

              {/* Questionnaires Tab */}
              <TabsContent value="questionnaires">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Questionnaires</h2>
                  <PatientPortalQuestionnaires patientId={patient.id} />
                </div>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">My Profile</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Full Name</div>
                            <div className="font-medium">{patient.firstName} {patient.lastName}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Patient ID</div>
                            <div className="font-medium">{patient.patientId}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Date of Birth</div>
                            <div className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Email</div>
                            <div className="font-medium">{patient.email || "Not provided"}</div>
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Button variant="outline" size="sm">
                            Change Password
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
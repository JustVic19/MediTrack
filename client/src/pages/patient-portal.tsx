import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import {
  CalendarDays,
  ClipboardList,
  Mail
} from "lucide-react";

import PatientLayout from "@/layouts/patient-layout";
import PatientPortalAppointments from "@/components/patient-portal/appointments";
import PatientPortalRecords from "@/components/patient-portal/records";
import PatientPortalMessages from "@/components/patient-portal/messages";
import PatientPortalPrescriptions from "@/components/patient-portal/prescriptions";
import PatientPortalQuestionnaires from "@/components/patient-portal/questionnaires";
import { ChangePasswordDialog } from "@/components/patient-portal/change-password-dialog";

export default function PatientPortal() {
  // Get the current location to check for query parameters
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Use the patient auth hook for authentication
  const { patient, isLoading, error } = usePatientAuth();

  // Add debugging
  console.log("PatientPortal component rendering", { 
    patient: patient ? `${patient.firstName} ${patient.lastName}` : 'null', 
    isLoading, 
    error: error?.message
  });

  // Parse the tab from URL query parameters
  useEffect(() => {
    // Add debugging
    console.log("Location changed:", location);
    
    try {
      // Extract tab from URL query parameter
      const url = new URL(window.location.href);
      const tab = url.searchParams.get("tab");
      console.log("Current tab from URL:", tab);
      
      // Set the active tab based on URL or default to overview
      if (tab) {
        console.log("Setting active tab to:", tab);
        setActiveTab(tab);
      } else if (location === "/patient-portal") {
        console.log("Setting active tab to overview");
        setActiveTab("overview");
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
  }, [location]);

  // Handle tab changes and update URL
  const handleTabChange = (value: string) => {
    console.log("Tab change requested to:", value);
    setActiveTab(value);
    
    // Update the URL to reflect the current tab
    try {
      const url = new URL(window.location.href);
      if (value === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", value);
      }
      
      console.log("Updating URL to:", url.toString());
      window.history.pushState({}, "", url.toString());
    } catch (error) {
      console.error("Error updating URL:", error);
    }
  };

  // Loading state handled by PatientProtectedRoute
  // Just in case, check here too
  if (isLoading) {
    console.log("PatientPortal: Still loading patient data");
    return null;
  }
  
  // Patient auth check handled by PatientProtectedRoute
  // Double-check here for extra safety
  if (!patient) {
    console.log("PatientPortal: No patient data available");
    return null;
  }

  return (
    <PatientLayout>
      <div className="p-4 md:p-6 container max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>
          
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
                      onClick={() => handleTabChange("appointments")}
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
                      onClick={() => handleTabChange("questionnaires")}
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
                      onClick={() => handleTabChange("messages")}
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
                      <ChangePasswordDialog patientId={patient.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
}
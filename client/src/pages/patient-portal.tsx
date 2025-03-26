import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, FileText, ClipboardCheck, Pill, MessageSquare } from "lucide-react";
import { useAuth } from '@/hooks/use-auth';
import { Appointment, PatientHistory, MedicalDocument } from '@shared/schema';
import PatientPortalAppointments from '@/components/patient-portal/appointments';
import PatientPortalRecords from '@/components/patient-portal/records';
import PatientPortalQuestionnaires from '@/components/patient-portal/questionnaires';
import PatientPortalPrescriptions from '@/components/patient-portal/prescriptions';
import PatientPortalMessages from '@/components/patient-portal/messages';

export default function PatientPortal() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");

  // Redirect if not logged in or not a patient
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Patient Portal Access</h1>
          <p className="mb-4">Please log in to access the patient portal</p>
          <Button onClick={() => setLocation("/auth")}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'patient') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="mb-4">The patient portal is only available to patients</p>
          <Button onClick={() => setLocation("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Patient Portal</h1>
        <p className="text-muted-foreground">
          Welcome, {user.fullName}. Manage your health information and communicate with your healthcare team.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Records</span>
          </TabsTrigger>
          <TabsTrigger value="questionnaires" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Questionnaires</span>
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="flex items-center gap-2">
            <Pill className="h-4 w-4" />
            <span className="hidden sm:inline">Prescriptions</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments">
          <PatientPortalAppointments patientId={user.id} />
        </TabsContent>

        <TabsContent value="records">
          <PatientPortalRecords patientId={user.id} />
        </TabsContent>

        <TabsContent value="questionnaires">
          <PatientPortalQuestionnaires patientId={user.id} />
        </TabsContent>

        <TabsContent value="prescriptions">
          <PatientPortalPrescriptions patientId={user.id} />
        </TabsContent>

        <TabsContent value="messages">
          <PatientPortalMessages patientId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
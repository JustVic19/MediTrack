import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Patient, PatientHistory, insertPatientHistorySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema
const historyFormSchema = insertPatientHistorySchema.extend({
  visitDate: z.coerce.date({
    required_error: "Visit date is required",
  }),
  patientId: z.coerce.number({
    required_error: "Patient is required",
  }),
  diagnosis: z.string().min(1, "Diagnosis is required"),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

export default function PatientHistoryPage() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch patients
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Fetch history for selected patient
  const { data: patientHistory = [], isLoading: isLoadingHistory } = useQuery<PatientHistory[]>({
    queryKey: [
      `/api/patients/${selectedPatientId}/history`,
      { enabled: !!selectedPatientId }
    ],
    enabled: !!selectedPatientId,
  });

  // Form setup
  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      patientId: selectedPatientId || undefined,
      visitDate: new Date(),
      diagnosis: "",
      treatment: "",
      prescriptions: "",
      notes: "",
    }
  });

  // Update patientId when selected patient changes
  useState(() => {
    if (selectedPatientId) {
      form.setValue('patientId', selectedPatientId);
    }
  });

  const onSubmit = async (data: HistoryFormValues) => {
    try {
      await apiRequest('POST', '/api/patient-history', data);
      toast({
        title: "Success",
        description: "Patient history entry added successfully",
      });
      form.reset();
      setIsNewEntryModalOpen(false);
      
      // Invalidate queries to refresh data
      if (selectedPatientId) {
        queryClient.invalidateQueries({ queryKey: [`/api/patients/${selectedPatientId}/history`] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add history entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSelectedPatientName = () => {
    if (!selectedPatientId) return "Select a patient";
    const patient = patients.find(p => p.id === selectedPatientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient";
  };

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="md:flex md:justify-between md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patient History</h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage medical history records
          </p>
        </div>
      </div>

      {/* Patient Selection and History List */}
      <div className="grid grid-cols-1 gap-6">
        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Patient</CardTitle>
            <CardDescription>
              Choose a patient to view their medical history
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="w-full max-w-md">
              <Select
                onValueChange={(value) => setSelectedPatientId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setIsNewEntryModalOpen(true)}
              disabled={!selectedPatientId}
            >
              Add New Entry
            </Button>
          </CardContent>
        </Card>

        {/* History List */}
        {selectedPatientId && (
          <Card>
            <CardHeader>
              <CardTitle>Medical History for {getSelectedPatientName()}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-10">Loading history records...</div>
              ) : patientHistory.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No history records found for this patient.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsNewEntryModalOpen(true)}
                  >
                    Add First Record
                  </Button>
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
        )}
      </div>

      {/* New History Entry Modal */}
      <Dialog open={isNewEntryModalOpen} onOpenChange={setIsNewEntryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Medical History Entry</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange(new Date(e.target.value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter diagnosis"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="treatment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter treatment details"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prescriptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prescriptions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter prescriptions"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes"
                        {...field}
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setIsNewEntryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Entry
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

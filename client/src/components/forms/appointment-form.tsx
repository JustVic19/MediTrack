import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertAppointmentSchema, InsertAppointment, Appointment, Patient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Extended validation schema for the form
const appointmentFormSchema = insertAppointmentSchema.extend({
  appointmentDate: z.coerce.date({
    required_error: "Please select a date and time",
  }),
  patientId: z.coerce.number({
    required_error: "Please select a patient",
  }),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  defaultValues?: Appointment;
  onSuccess?: () => void;
  isEditMode?: boolean;
  selectedPatientId?: number;
}

export function AppointmentForm({ 
  defaultValues, 
  onSuccess, 
  isEditMode = false,
  selectedPatientId 
}: AppointmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  // Set default date format for form display
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
  };

  // Initialize the form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: defaultValues 
      ? {
          ...defaultValues,
          appointmentDate: new Date(defaultValues.appointmentDate),
        }
      : {
          patientId: selectedPatientId || 0,
          appointmentDate: undefined,
          status: "scheduled",
          reason: "",
          notes: "",
        },
  });

  // Update form values if selectedPatientId changes
  useEffect(() => {
    if (selectedPatientId && !isEditMode) {
      form.setValue('patientId', selectedPatientId);
    }
  }, [selectedPatientId, form, isEditMode]);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditMode && defaultValues) {
        // Update existing appointment
        await apiRequest('PUT', `/api/appointments/${defaultValues.id}`, data);
        toast({
          title: "Success",
          description: "Appointment updated successfully",
        });
      } else {
        // Create new appointment
        await apiRequest('POST', '/api/appointments', data);
        toast({
          title: "Success",
          description: "Appointment scheduled successfully",
        });
        form.reset();
      }
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments/today'] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast({
        title: "Error",
        description: "Failed to save appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                defaultValue={field.value?.toString()}
                disabled={!!selectedPatientId || isEditMode}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.firstName} {patient.lastName} ({patient.patientId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and Time</FormLabel>
              <FormControl>
                <Input 
                  type="datetime-local" 
                  {...field} 
                  value={formatDateForInput(field.value)}
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
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Annual check-up, Follow-up, etc." 
                  {...field} 
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
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information about the appointment" 
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Status</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

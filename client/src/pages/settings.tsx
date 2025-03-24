import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { insertSettingsSchema, Settings as AppSettings } from "@shared/schema";
import { Loader2 } from "lucide-react";

// Form schema
const settingsFormSchema = insertSettingsSchema.extend({
  reminderHoursInAdvance: z.coerce
    .number()
    .min(1, "Must be at least 1 hour")
    .max(72, "Must be less than 72 hours"),
  systemName: z
    .string()
    .min(2, "System name must be at least 2 characters")
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ['/api/settings'],
  });

  // Initialize form with existing settings
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      twilioAccountSid: "",
      twilioAuthToken: "",
      twilioPhoneNumber: "",
      reminderHoursInAdvance: 24,
      systemName: "MediTrack",
    },
    values: settings ? {
      ...settings,
      twilioAccountSid: settings.twilioAccountSid || "",
      twilioAuthToken: settings.twilioAuthToken || "",
      twilioPhoneNumber: settings.twilioPhoneNumber || "",
      reminderHoursInAdvance: settings.reminderHoursInAdvance || 24,
      systemName: settings.systemName || "MediTrack",
    } : undefined,
  });

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setIsSubmitting(true);
      await apiRequest('PUT', '/api/settings', data);
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      
      // Refresh settings data
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your application settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic application settings
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="systemName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Name</FormLabel>
                        <FormControl>
                          <Input placeholder="MediTrack" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name displayed in the application and notifications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.formState.isDirty}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure SMS notifications via Twilio
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="twilioAccountSid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Account SID</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your Twilio Account SID" 
                            value={field.value || ""} 
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>
                          Your Twilio Account SID from your Twilio dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twilioAuthToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Auth Token</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your Twilio Auth Token" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Your Twilio Auth Token from your Twilio dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twilioPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twilio Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1234567890" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The Twilio phone number to send SMS from
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reminderHoursInAdvance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Hours in Advance</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="1"
                            max="72"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          How many hours before an appointment should reminders be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-gray-500">
                    Note: SMS notifications will only be sent to patients who have opted in
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.formState.isDirty}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

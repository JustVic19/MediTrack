import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePatientAuth } from '@/hooks/use-patient-auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const activateSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  token: z.string().min(1, "Activation token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ActivateFormValues = z.infer<typeof activateSchema>;

export default function PatientLogin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('login');
  const [activationSuccess, setActivationSuccess] = useState(false);
  
  // Use the patient auth hook
  const { patient, loginMutation, activateMutation } = usePatientAuth();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Activation form
  const activateForm = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: {
      patientId: '',
      token: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  // Redirect to portal if already logged in
  useEffect(() => {
    if (patient) {
      navigate('/patient-portal');
    }
  }, [patient, navigate]);
  
  // Handle URL parameters for activation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const patientId = params.get('patientId');
    
    if (token && patientId) {
      setActiveTab('activate');
      activateForm.setValue('token', token);
      activateForm.setValue('patientId', patientId);
    }
  }, [activateForm]);

  // Handle successful activation
  useEffect(() => {
    if (activateMutation.isSuccess) {
      setActivationSuccess(true);
      toast({
        title: 'Account activated',
        description: 'Your account has been activated successfully. You can now login.',
      });
    }
  }, [activateMutation.isSuccess, toast]);

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onActivateSubmit = (values: ActivateFormValues) => {
    activateMutation.mutate({
      patientId: values.patientId,
      token: values.token,
      password: values.password
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 text-white p-12 flex-col justify-between">
        <div>
          <Logo size={60} className="text-white" />
          <h1 className="text-4xl font-bold mt-12">Welcome to the MediTrack Patient Portal</h1>
          <p className="text-xl mt-4 text-indigo-100">
            Access your health information securely and connect with your healthcare providers.
          </p>
          
          <div className="mt-12 space-y-6">
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-white text-indigo-600 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">View appointments</h3>
                <p className="text-indigo-200">See your upcoming appointments and get reminders</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-white text-indigo-600 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Access medical records</h3>
                <p className="text-indigo-200">Review your health history and test results</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-white text-indigo-600 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Message your provider</h3>
                <p className="text-indigo-200">Send secure messages to your healthcare team</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-12 border-t border-indigo-500 text-indigo-200">
          <p>© {new Date().getFullYear()} MediTrack. All rights reserved.</p>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Patient Portal</CardTitle>
              <Logo size={40} className="text-indigo-600 md:hidden" />
            </div>
            <CardDescription>
              Access your personal health information securely
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="activate">Activate Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your username" 
                              {...field} 
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              disabled={loginMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="activate">
                {activationSuccess ? (
                  <Alert className="mb-4">
                    <AlertDescription>
                      Your account has been activated successfully. You can now login with your username and password.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Form {...activateForm}>
                    <form onSubmit={activateForm.handleSubmit(onActivateSubmit)} className="space-y-4">
                      <FormField
                        control={activateForm.control}
                        name="patientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Patient ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="PT-2023-0001" 
                                {...field} 
                                disabled={activateMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={activateForm.control}
                        name="token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Activation Token</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your activation token" 
                                {...field} 
                                disabled={activateMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={activateForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                disabled={activateMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={activateForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Confirm your password" 
                                {...field} 
                                disabled={activateMutation.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={activateMutation.isPending}
                      >
                        {activateMutation.isPending ? "Activating..." : "Activate Account"}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex-col space-y-4">
            <div className="text-sm text-gray-500 text-center">
              <p>Don't have an account? Ask your healthcare provider for an activation link.</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePatientAuth } from "@/hooks/use-patient-auth";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2 } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/10 p-4">
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-card p-1 rounded-md shadow-md border border-border">
          <ThemeToggle />
        </div>
      </div>
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/assets/meditrack-logo.svg" 
            alt="MediTrack Logo" 
            className="h-24 w-24 mb-2"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.style.display = 'none';
            }}
          />
          <Logo size={40} className="mb-2" />
          <h1 className="text-3xl font-bold text-primary">MediTrack</h1>
          <p className="text-muted-foreground text-center mt-2">
            Patient Portal Access
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              {activeTab === "login" ? "Patient Sign In" : "Activate Your Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
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
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
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
                        {activateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          "Activate Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col items-center justify-center space-y-4">
            <div className="text-sm text-muted-foreground">
              {activeTab === "login" ? (
                <span>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("activate")}>Activate an account</Button></span>
              ) : (
                <span>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>Login</Button></span>
              )}
            </div>

            <Separator className="w-full" />

            <div className="text-sm text-center w-full">
              <p className="mb-2">Looking for the Staff Login?</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Go to Staff Login
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-sm text-muted-foreground text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
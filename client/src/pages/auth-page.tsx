import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, LogIn, Mail } from "lucide-react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["doctor", "admin", "staff"], {
    invalid_type_error: "Please select a valid role",
  })
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// Email schema for password reset
const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Create the password reset form
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  // Create the login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Create the register form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "doctor"
    }
  });

  // Handle login form submission
  const onLoginSubmit = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  // Handle register form submission
  const onRegisterSubmit = (values: RegisterValues) => {
    registerMutation.mutate(values);
  };

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  // Functions to handle social login
  const handleGoogleLogin = () => {
    toast({
      title: "Google Login",
      description: "Google login integration will be implemented soon",
    });
  };

  const handleAppleLogin = () => {
    toast({
      title: "Apple Login",
      description: "Apple login integration will be implemented soon",
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
          />
          <h1 className="text-3xl font-bold text-primary">MediTrack</h1>
          <p className="text-muted-foreground text-center mt-2">
            Medical Practice Management System
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              {activeTab === "login" ? "Sign in to your account" : "Create your account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
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
                            <Input placeholder="Enter your username" {...field} />
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
                          <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-xs" 
                              type="button"
                              onClick={() => setIsResetModalOpen(true)}
                            >
                              Forgot password?
                            </Button>
                          </div>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
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
                          Signing In
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGoogleLogin}
                      >
                        <FaGoogle className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAppleLogin}
                      >
                        <FaApple className="mr-2 h-4 w-4" />
                        Apple
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="doctor@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="doctor">Doctor</option>
                            <option value="admin">Administrator</option>
                            <option value="staff">Staff</option>
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-2 text-xs text-muted-foreground">
                          Or sign up with
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGoogleLogin}
                      >
                        <FaGoogle className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAppleLogin}
                      >
                        <FaApple className="mr-2 h-4 w-4" />
                        Apple
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center space-y-4">
            <div className="text-sm text-muted-foreground">
              {activeTab === "login" ? (
                <span>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("register")}>Register</Button></span>
              ) : (
                <span>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>Login</Button></span>
              )}
            </div>

            <Separator className="w-full" />

            <div className="text-sm text-center w-full">
              <p className="mb-2">Looking for the Patient Portal?</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate("/patient-login")}
              >
                Go to Patient Login
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-sm text-muted-foreground text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
        

      </div>
      
      {/* Password Reset Modal */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Your Password</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <Form {...resetForm}>
            <form 
              onSubmit={resetForm.handleSubmit(async (data) => {
                try {
                  setIsResetSubmitting(true);
                  const response = await apiRequest("POST", "/api/auth/request-password-reset", data);
                  const result = await response.json();
                  
                  toast({
                    title: "Password Reset Email Sent",
                    description: "If your email exists in our system, you will receive a password reset link shortly.",
                    variant: "default",
                  });
                  
                  setIsResetModalOpen(false);
                  resetForm.reset();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "There was a problem sending the reset email. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsResetSubmitting(false);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="youremail@example.com" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isResetSubmitting}>
                  {isResetSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
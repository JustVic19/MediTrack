import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Save, User, Upload } from "lucide-react";
import MainLayout from "@/layouts/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User as UserType } from "@shared/schema";

// Define profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  profileImage: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Set up form with default values from user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      profileImage: user?.profileImage || "",
    },
  });

  // Handler for image upload simulation
  const handleImageUpload = () => {
    // For demo purposes, we'll use a random avatar from UI Avatars
    setIsUploading(true);
    
    setTimeout(() => {
      const randomColor = Math.floor(Math.random() * 16777215).toString(16);
      const newImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.fullName || "User"
      )}&background=${randomColor}&color=fff`;
      
      setPreviewImage(newImageUrl);
      form.setValue("profileImage", newImageUrl);
      setIsUploading(false);
      
      toast({
        title: "Image uploaded",
        description: "Your profile picture has been updated.",
      });
    }, 1500);
  };

  // Form submission handler
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      
      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update the cached user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
        
        setIsEditing(false);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "An error occurred while updating your profile",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Image Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 mb-4">
                <img 
                  src={previewImage || user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleImageUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Picture
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      View
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </div>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={form.formState.isSubmitting}
                      >
                        {form.formState.isSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p className="mt-1 text-base">{user.fullName}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="mt-1 text-base">{user.email}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p className="mt-1 text-base">{user.username}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                    <p className="mt-1 text-base capitalize">{user.role}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50 text-xs text-muted-foreground">
              Last updated on {new Date().toLocaleDateString()}
            </CardFooter>
          </Card>

          {/* Account Security Card */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">Last changed: Never</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Enhance your account security</p>
                  </div>
                  <Button variant="outline">Set Up 2FA</Button>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Account Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {user.isVerified ? 'Verified' : 'Not Verified'}
                    </p>
                  </div>
                  {!user.isVerified && (
                    <Button variant="outline">Verify Account</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation, UseMutationResult } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Basic patient info type
export type PatientInfo = {
  id: number;
  patientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dateOfBirth: Date;
  portalLastLogin: Date | null;
};

type PatientAuthContextType = {
  patient: PatientInfo | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ success: boolean; patient: PatientInfo }, Error, LoginCredentials>;
  logoutMutation: UseMutationResult<{ success: boolean }, Error, void>;
  activateMutation: UseMutationResult<{ success: boolean }, Error, ActivateCredentials>;
};

type LoginCredentials = {
  username: string;
  password: string;
};

type ActivateCredentials = {
  patientId: string;
  token: string;
  password: string;
};

export const PatientAuthContext = createContext<PatientAuthContextType | null>(null);

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Get current authenticated patient
  const {
    data,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/patient/auth-status'],
    queryFn: async () => {
      console.log('Checking patient auth status...');
      const res = await fetch('/api/patient/auth-status');
      if (!res.ok) throw new Error('Failed to check authentication status');
      const data = await res.json();
      console.log('Auth status response:', data);
      return data;
    },
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Patient login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('Patient login attempt...', credentials.username);
      try {
        const res = await apiRequest('POST', '/api/patient/login', credentials);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Login failed');
        }
        const data = await res.json();
        console.log('Login response:', data);
        return data;
      } catch (err) {
        console.error('Login error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Login successful, setting data and refetching...');
      // First set the data directly in the cache
      queryClient.setQueryData(['/api/patient/auth-status'], { 
        isLoggedIn: true, 
        patient: data.patient 
      });
      
      // Then trigger a refetch to ensure we have the latest data
      setTimeout(() => {
        refetch();
      }, 500);
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.patient.firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login mutation error:', error);
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Patient logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Patient logout attempt...');
      try {
        const res = await apiRequest('POST', '/api/patient/logout');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Logout failed');
        }
        console.log('Logout successful response received');
        return await res.json();
      } catch (err) {
        console.error('Logout error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log('Logout successful, updating auth status...');
      // Update the cache with logged out state
      queryClient.setQueryData(['/api/patient/auth-status'], { isLoggedIn: false, patient: null });
      
      // Then invalidate the query to force a refetch
      queryClient.invalidateQueries({queryKey: ['/api/patient/auth-status']});
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
    onError: (error: Error) => {
      console.error('Logout mutation error:', error);
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Patient account activation
  const activateMutation = useMutation({
    mutationFn: async (data: ActivateCredentials) => {
      console.log('Patient activation attempt...', data.patientId);
      try {
        const res = await apiRequest('POST', '/api/patient/set-password', data);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Activation failed');
        }
        console.log('Activation response received');
        return await res.json();
      } catch (err) {
        console.error('Activation error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Activation successful, response:', data);
      toast({
        title: 'Account activated',
        description: 'Your account has been activated successfully. You can now login.',
      });
    },
    onError: (error: Error) => {
      console.error('Activation mutation error:', error);
      toast({
        title: 'Activation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <PatientAuthContext.Provider
      value={{
        patient: data?.isLoggedIn ? data.patient : null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        activateMutation,
      }}
    >
      {children}
    </PatientAuthContext.Provider>
  );
}

export function usePatientAuth() {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
}
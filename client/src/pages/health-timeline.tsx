import React from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Patient } from '@shared/schema';
import { HealthTimeline } from '@/components/patient/health-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

export default function HealthTimelinePage() {
  // Get patientId from URL
  const [location] = useLocation();
  const patientId = parseInt(location.split('/').pop() || '0');

  // Fetch patient details
  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ['/api/patients', patientId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/patients/${patientId}`);
      return await res.json() as Patient;
    },
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Patient Not Found</CardTitle>
            <CardDescription>Unable to display health timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The requested patient could not be found. Please select a valid patient.
            </p>
            <Button asChild>
              <Link to="/patients">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Return to Patient List
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to={`/patients/${patientId}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {isPatientLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>Health Timeline: {patient?.firstName} {patient?.lastName}</>
            )}
          </h1>
        </div>
      </div>

      {isPatientLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      ) : (
        <HealthTimeline patientId={patientId} />
      )}
    </div>
  );
}
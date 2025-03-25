import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronRight, Search } from 'lucide-react';
import { Patient } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';

export default function HealthTimelines() {
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Fetch all patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/patients');
      return await res.json() as Patient[];
    },
  });

  // Update filtered patients when data or search term changes
  useEffect(() => {
    if (!patients) return;
    
    if (!searchTerm) {
      setFilteredPatients(patients);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    setFilteredPatients(
      patients.filter(patient => 
        patient.firstName.toLowerCase().includes(searchTermLower) ||
        patient.lastName.toLowerCase().includes(searchTermLower) ||
        patient.patientId.toLowerCase().includes(searchTermLower)
      )
    );
  }, [patients, searchTerm]);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Health Timelines</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select a Patient</CardTitle>
          <CardDescription>
            Choose a patient to view their complete health timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              className="pl-9"
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-0">
                <Link 
                  href={`/health-timeline/${patient.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-medium">{patient.firstName} {patient.lastName}</h3>
                      <p className="text-sm text-muted-foreground">ID: {patient.patientId}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No patients found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No patients match '${searchTerm}'` 
                  : 'No patients are currently registered in the system'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Pill, Loader2, CircleAlert, Clock, CalendarRange, CheckCircle2 } from 'lucide-react';

// Interfaces
interface Medication {
  id: number;
  patientId: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate: Date | null;
  refillsRemaining: number;
  isActive: boolean;
  instructions: string;
  prescribedBy: string;
  lastRefill: Date | null;
  nextRefillDate: Date | null;
  pharmacy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RefillRequest {
  id: number;
  medicationId: number;
  patientId: number;
  requestDate: Date;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  notes: string | null;
  pharmacy: string;
  responseDate: Date | null;
  responseNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function MedicationCard({ medication, onRequestRefill }: { 
  medication: Medication; 
  onRequestRefill: (medication: Medication) => void;
}) {
  // Calculate days of supply left
  const calculateDaysLeft = () => {
    if (!medication.endDate || !medication.isActive) return 0;
    return Math.max(0, differenceInDays(new Date(medication.endDate), new Date()));
  };
  
  const daysLeft = calculateDaysLeft();
  const lowSupply = daysLeft <= 7 && daysLeft > 0;
  const noSupply = daysLeft === 0;
  
  const statusBadge = medication.isActive 
    ? noSupply 
      ? 'bg-red-100 text-red-800' 
      : lowSupply 
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
  
  const statusText = medication.isActive
    ? noSupply
      ? 'Refill Needed'
      : lowSupply
        ? 'Low Supply'
        : 'Active'
    : 'Inactive';
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{medication.name}</CardTitle>
            <CardDescription>{medication.dosage}</CardDescription>
          </div>
          <Badge className={statusBadge}>{statusText}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Frequency:</span>
              <p>{medication.frequency}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Refills Remaining:</span>
              <p>{medication.refillsRemaining}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Start Date:</span>
              <p>{format(new Date(medication.startDate), 'MMM d, yyyy')}</p>
            </div>
            {medication.endDate && (
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p>{format(new Date(medication.endDate), 'MMM d, yyyy')}</p>
              </div>
            )}
          </div>
          
          {medication.isActive && medication.endDate && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Supply Remaining:</span>
                <span>{daysLeft} days left</span>
              </div>
              <Progress value={(daysLeft / 30) * 100} className="h-2" />
            </div>
          )}
          
          {medication.instructions && (
            <div className="mt-3">
              <Label className="text-muted-foreground text-sm">Instructions:</Label>
              <p className="text-sm mt-1">{medication.instructions}</p>
            </div>
          )}
          
          <div className="mt-3 pt-2 border-t border-border flex justify-between text-sm text-muted-foreground">
            <span>Prescribed by {medication.prescribedBy}</span>
            <span>Pharmacy: {medication.pharmacy}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {medication.isActive && (medication.refillsRemaining > 0 || lowSupply || noSupply) && (
          <Button 
            variant={lowSupply || noSupply ? "default" : "outline"} 
            onClick={() => onRequestRefill(medication)}
            className="w-full"
          >
            Request Refill
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function RefillRequestCard({ refill }: { refill: RefillRequest }) {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-blue-100 text-blue-800',
    'denied': 'bg-red-100 text-red-800',
    'completed': 'bg-green-100 text-green-800'
  };
  
  const statusLabels = {
    'pending': 'Pending',
    'approved': 'Approved',
    'denied': 'Denied',
    'completed': 'Completed'
  };
  
  const statusColor = statusColors[refill.status];
  const statusLabel = statusLabels[refill.status];
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">Refill Request</CardTitle>
            <CardDescription>
              {format(new Date(refill.requestDate), 'MMMM d, yyyy')}
            </CardDescription>
          </div>
          <Badge className={statusColor}>{statusLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            <span>Medication ID: {refill.medicationId}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Requested: {format(new Date(refill.requestDate), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span>Pharmacy: {refill.pharmacy}</span>
          </div>
          
          {refill.responseDate && (
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <span>Response: {format(new Date(refill.responseDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {refill.notes && (
            <div className="mt-2">
              <Label className="text-muted-foreground text-sm">Your Notes:</Label>
              <p className="text-sm mt-1">{refill.notes}</p>
            </div>
          )}
          
          {refill.responseNotes && (
            <div className="mt-2 p-2 bg-muted/40 rounded">
              <Label className="text-muted-foreground text-sm">Provider Response:</Label>
              <p className="text-sm mt-1">{refill.responseNotes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientPortalPrescriptions({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);
  const [refillNotes, setRefillNotes] = useState('');
  const [customPharmacy, setCustomPharmacy] = useState('');
  
  const { data: medications, isLoading: isLoadingMeds, isError: isMedsError } = useQuery<Medication[]>({
    queryKey: ['/api/patient-portal/medications', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/medications?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const { data: refillRequests, isLoading: isLoadingRefills, isError: isRefillsError } = useQuery<RefillRequest[]>({
    queryKey: ['/api/patient-portal/refill-requests', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/refill-requests?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const refillMutation = useMutation({
    mutationFn: async (data: { 
      medicationId: number; 
      patientId: number; 
      notes: string; 
      pharmacy: string;
    }) => {
      const response = await apiRequest('POST', '/api/patient-portal/refill-requests', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Refill Requested',
        description: 'Your refill request has been submitted successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/refill-requests'] });
      setRefillDialogOpen(false);
      setSelectedMedication(null);
      setRefillNotes('');
      setCustomPharmacy('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to request refill: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleRefillRequest = (medication: Medication) => {
    setSelectedMedication(medication);
    setCustomPharmacy(medication.pharmacy);
    setRefillDialogOpen(true);
  };
  
  const handleSubmitRefill = () => {
    if (!selectedMedication) return;
    
    refillMutation.mutate({
      medicationId: selectedMedication.id,
      patientId,
      notes: refillNotes,
      pharmacy: customPharmacy
    });
  };
  
  const isLoading = isLoadingMeds || isLoadingRefills;
  const isError = isMedsError || isRefillsError;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading prescriptions
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading your prescriptions. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const activeCount = medications?.filter(med => med.isActive).length || 0;
  const recentRefills = refillRequests?.filter(ref => 
    ref.status === 'pending' || ref.status === 'approved'
  ) || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Prescriptions</h2>
      </div>
      
      <Dialog open={refillDialogOpen} onOpenChange={setRefillDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Medication Refill</DialogTitle>
            <DialogDescription>
              Submit a request to refill your prescription for {selectedMedication?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="pharmacy">Pharmacy</Label>
              <Textarea 
                id="pharmacy" 
                value={customPharmacy} 
                onChange={(e) => setCustomPharmacy(e.target.value)}
                className="min-h-[60px]"
                placeholder="Enter pharmacy name and location"
              />
              <p className="text-muted-foreground text-xs mt-1">
                We'll send your refill to this pharmacy
              </p>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                value={refillNotes} 
                onChange={(e) => setRefillNotes(e.target.value)}
                className="min-h-[80px]"
                placeholder="Any special instructions or concerns?"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefillDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRefill}
              disabled={!customPharmacy.trim() || refillMutation.isPending}
            >
              {refillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                'Submit Refill Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active Prescriptions ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="refills">
            Refill Requests ({recentRefills.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {medications && medications.length > 0 ? (
            <div>
              {medications
                .filter(med => med.isActive)
                .map(medication => (
                  <MedicationCard 
                    key={medication.id} 
                    medication={medication}
                    onRequestRefill={handleRefillRequest}
                  />
                ))}
              
              {medications.filter(med => med.isActive).length === 0 && (
                <div className="text-center py-10 bg-muted/40 rounded-lg">
                  <Pill className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg mb-1">No Active Prescriptions</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You don't have any active prescriptions at this time.
                  </p>
                </div>
              )}
              
              {medications.filter(med => !med.isActive).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Inactive Prescriptions</h3>
                  {medications
                    .filter(med => !med.isActive)
                    .map(medication => (
                      <MedicationCard 
                        key={medication.id} 
                        medication={medication}
                        onRequestRefill={handleRefillRequest}
                      />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <CircleAlert className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Prescriptions Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any medications in our system.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="refills" className="mt-4">
          {refillRequests && refillRequests.length > 0 ? (
            <div>
              {recentRefills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Active Requests</h3>
                  {recentRefills.map(refill => (
                    <RefillRequestCard key={refill.id} refill={refill} />
                  ))}
                </div>
              )}
              
              {refillRequests.filter(r => r.status === 'completed' || r.status === 'denied').length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Past Requests</h3>
                  {refillRequests
                    .filter(r => r.status === 'completed' || r.status === 'denied')
                    .map(refill => (
                      <RefillRequestCard key={refill.id} refill={refill} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Refill Requests</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't made any refill requests yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
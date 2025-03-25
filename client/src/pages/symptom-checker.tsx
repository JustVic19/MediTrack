import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Check, 
  Clock, 
  Info, 
  Loader2, 
  Activity, 
  ThermometerSnowflake, 
  BadgeAlert,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { 
  bodyAreas, 
  severityLevels, 
  durationOptions, 
  type SymptomCheck,
  type InsertSymptomCheck,
  type AnalysisResult,
  type RecommendationResult
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const symptomFormSchema = z.object({
  patientId: z.number(),
  symptoms: z.array(z.object({
    description: z.string().min(3, "Please describe the symptom"),
    location: z.string().min(1, "Please select a body area"),
    characteristics: z.string().optional(),
  })).min(1, "Please add at least one symptom"),
  severity: z.number().min(1).max(5),
  duration: z.string().min(1, "Please select symptom duration"),
  checkDate: z.date().optional().default(() => new Date()),
  additionalNotes: z.string().optional(),
});

type SymptomFormValues = z.infer<typeof symptomFormSchema>;

function SymptomForm({ patientId, onSubmit }: { patientId: number, onSubmit: (data: SymptomFormValues) => void }) {
  const [symptoms, setSymptoms] = useState<Array<{ description: string, location: string, characteristics?: string }>>([{ 
    description: '', 
    location: '', 
    characteristics: '' 
  }]);

  const form = useForm<SymptomFormValues>({
    resolver: zodResolver(symptomFormSchema),
    defaultValues: {
      patientId,
      symptoms: [{ description: '', location: '', characteristics: '' }],
      severity: 3,
      duration: '',
      additionalNotes: '',
    },
  });

  const addSymptom = () => {
    setSymptoms([...symptoms, { description: '', location: '', characteristics: '' }]);
    form.setValue('symptoms', [...form.getValues().symptoms, { description: '', location: '', characteristics: '' }]);
  };

  const removeSymptom = (index: number) => {
    if (symptoms.length > 1) {
      const updatedSymptoms = [...symptoms];
      updatedSymptoms.splice(index, 1);
      setSymptoms(updatedSymptoms);
      form.setValue('symptoms', updatedSymptoms);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Symptoms Information</h3>
          
          {symptoms.map((symptom, index) => (
            <div key={index} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Symptom {index + 1}</h4>
                {symptoms.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSymptom(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              
              <FormField
                control={form.control}
                name={`symptoms.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Headache, Cough, Fever" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`symptoms.${index}.location`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Area</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select body area" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bodyAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
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
                name={`symptoms.${index}.characteristics`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Characteristics (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Sharp, Dull, Throbbing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSymptom}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add Another Symptom
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity Level</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))} 
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level.label} value={level.value.toString()}>
                        {level.label}
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
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="additionalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any additional information that may be relevant..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Symptoms
          </Button>
        </div>
      </form>
    </Form>
  );
}

// No longer needed as we import from shared/schema

function SymptomAnalysisResults({ check }: { check: SymptomCheck }) {
  if (!check.analysis || !check.recommendations) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h3 className="text-lg font-medium mb-2">Analysis in progress...</h3>
        <p className="text-muted-foreground text-center">
          Your symptoms are being analyzed. This may take a moment.
        </p>
      </div>
    );
  }

  // Type assertion for the analysis and recommendations
  const analysis = check.analysis as AnalysisResult;
  const recommendations = check.recommendations as RecommendationResult;

  // Badge variants in the UI
  const urgencyColorMap: Record<string, "destructive" | "default" | "outline" | "secondary"> = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Analysis Results</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Urgency Level:</span>
          <Badge variant={urgencyColorMap[analysis.urgencyLevel] || 'default'}>
            {analysis.urgencyLevel.charAt(0).toUpperCase() + analysis.urgencyLevel.slice(1)}
          </Badge>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="conditions">
            <AccordionTrigger>Possible Conditions</AccordionTrigger>
            <AccordionContent>
              {analysis.possibleConditions.length > 0 ? (
                <ul className="space-y-3">
                  {analysis.possibleConditions.map((condition, index) => (
                    <li key={index} className="bg-white dark:bg-slate-800 p-3 rounded-md">
                      <div className="font-medium">{condition.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Probability: {condition.probability}
                      </div>
                      {condition.description && (
                        <div className="text-sm mt-2">{condition.description}</div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No specific conditions identified.</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {analysis.disclaimer && (
          <div className="mt-4 text-sm text-muted-foreground bg-background p-3 rounded-md border">
            <span className="font-medium">Disclaimer: </span>
            {analysis.disclaimer}
          </div>
        )}
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Recommendations</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">General Advice</h4>
            <p>{recommendations.generalAdvice}</p>
          </div>
          
          {recommendations.suggestedActions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Suggested Actions</h4>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.suggestedActions.map((action: string, index: number) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-2">Follow-up Recommendation</h4>
            <p>{recommendations.followUpRecommendation}</p>
          </div>
          
          {recommendations.disclaimer && (
            <div className="mt-4 text-sm text-muted-foreground bg-background p-3 rounded-md border">
              <span className="font-medium">Disclaimer: </span>
              {recommendations.disclaimer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SymptomCheckHistory({ patientId }: { patientId: number }) {
  const { data: checks, isLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'symptom-checks'],
    queryFn: async () => {
      const response = await fetch(`/api/patients/${patientId}/symptom-checks`);
      if (!response.ok) throw new Error('Failed to fetch symptom checks');
      return response.json();
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!checks || checks.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No symptom checks found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {checks.map((check: SymptomCheck) => {
        // Format check date
        const checkDate = new Date(check.checkDate);
        const dateString = checkDate.toLocaleDateString();
        const timeString = checkDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
          <Card key={check.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Symptom Check</CardTitle>
                  <CardDescription>
                    {dateString} at {timeString}
                  </CardDescription>
                </div>
                <Badge className="flex items-center gap-1">
                  {getStatusIcon(check.status)}
                  {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Symptoms:</span>
                  <ul className="list-disc list-inside">
                    {Array.isArray(check.symptoms) && check.symptoms.map((symptom: any, index: number) => (
                      <li key={index} className="text-sm">
                        {symptom.description} {symptom.location && `(${symptom.location})`}
                        {symptom.characteristics && ` - ${symptom.characteristics}`}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-sm font-medium">Severity:</span>
                    <span className="text-sm ml-1">{severityLevels[check.severity - 1]?.label || `Level ${check.severity}`}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm ml-1">{check.duration}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="p-0" asChild>
                <a href={`/symptom-checker?id=${check.id}`}>View Details</a>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

function SymptomCheckerDetailPage() {
  const [_, setLocation] = useLocation();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const idParam = searchParams.get('id');
  const checkId = idParam ? parseInt(idParam) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: check, isLoading, error } = useQuery({
    queryKey: ['/api/symptom-checks', checkId],
    queryFn: async () => {
      const response = await fetch(`/api/symptom-checks/${checkId}`);
      if (!response.ok) throw new Error('Failed to fetch symptom check');
      return response.json();
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/symptom-checks/${checkId}/analyze`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/symptom-checks', checkId], data);
      toast({
        title: 'Analysis Complete',
        description: 'Symptom analysis has been completed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4">Loading symptom check...</p>
      </div>
    );
  }

  if (error || !check) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Symptom Check</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'Failed to load symptom check details'}
        </p>
        <Button onClick={() => {
          // Try to preserve patient ID if available
          const patientId = searchParams.get('patientId');
          setLocation(patientId ? `/symptom-checker?patientId=${patientId}` : '/symptom-checker');
        }}>
          Return to Symptom Checker
        </Button>
      </div>
    );
  }

  // Format check date
  const checkDate = new Date(check.checkDate);
  const dateString = checkDate.toLocaleDateString();
  const timeString = checkDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
          <Check className="h-4 w-4" />
          Completed
        </Badge>;
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
          <Clock className="h-4 w-4" />
          Pending
        </Badge>;
      default:
        return <Badge className="flex items-center gap-1">
          <Info className="h-4 w-4" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>;
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Symptom Check Details</h1>
          <p className="text-muted-foreground">
            {dateString} at {timeString}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(check.status)}
          <Button 
            variant="outline" 
            onClick={() => {
              // Get patient ID from check or try from query params
              const patientId = check.patientId || searchParams.get('patientId');
              setLocation(patientId ? `/symptom-checker?patientId=${patientId}` : '/symptom-checker');
            }}
          >
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThermometerSnowflake className="h-5 w-5 text-primary" />
              Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{severityLevels[check.severity - 1]?.label || `Level ${check.severity}`}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{check.duration}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeAlert className="h-5 w-5 text-primary" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-2xl font-bold capitalize">{check.status}</p>
            
            {check.status === 'pending' && (
              <Button 
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="mt-3 w-full"
                size="sm"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Analyze Symptoms
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Reported Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {Array.isArray(check.symptoms) && check.symptoms.map((symptom: any, index: number) => (
              <li key={index} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
                <div className="font-medium text-lg mb-2">{symptom.description}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Body Area:</span>
                    <span className="text-sm ml-2">{symptom.location}</span>
                  </div>
                  {symptom.characteristics && (
                    <div>
                      <span className="text-sm font-medium">Characteristics:</span>
                      <span className="text-sm ml-2">{symptom.characteristics}</span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          
          {check.additionalNotes && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Additional Notes</h4>
              <p className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md text-sm">
                {check.additionalNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis & Recommendations</CardTitle>
          <CardDescription>
            Detailed analysis of reported symptoms and recommended actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SymptomAnalysisResults check={check} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SymptomChecker() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const patientIdParam = searchParams.get('patientId');
  
  // If viewing details for a specific symptom check
  const idParam = searchParams.get('id');
  if (idParam) {
    return <SymptomCheckerDetailPage />;
  }
  
  const patientId = patientIdParam ? parseInt(patientIdParam) : undefined;
  
  // Fetch patient details if we have a patientId
  const { data: patient } = useQuery({
    queryKey: ['/api/patients', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      return response.json();
    },
    enabled: !!patientId,
  });
  
  const createSymptomCheckMutation = useMutation({
    mutationFn: async (data: SymptomFormValues) => {
      // Transform the form data to match the InsertSymptomCheck schema
      const submissionData: InsertSymptomCheck = {
        patientId: data.patientId,
        symptoms: data.symptoms,
        severity: data.severity,
        duration: data.duration,
        checkDate: data.checkDate,
        // Remove additionalNotes as it's not part of the InsertSymptomCheck schema
      };
      
      const response = await apiRequest('POST', '/api/symptom-checks', submissionData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients', patientId, 'symptom-checks'] });
      toast({
        title: 'Symptoms Submitted',
        description: 'Your symptoms have been successfully recorded.',
      });
      // Navigate to the symptom check details page
      setLocation(`/symptom-checker?id=${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = (data: SymptomFormValues) => {
    createSymptomCheckMutation.mutate(data);
  };
  
  // If no patientId is provided, show a message or redirect
  if (!patientId) {
    return (
      <div className="container py-8 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Symptom Checker</h1>
        <p className="mb-6">Please select a patient to use the symptom checker.</p>
        <Button onClick={() => setLocation('/patients')}>
          Go to Patients List
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Symptom Checker</h1>
          {patient && (
            <p className="text-muted-foreground">
              Patient: {patient.firstName} {patient.lastName}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          className="mt-2 md:mt-0"
          onClick={() => setLocation(`/patients/${patientId}`)}
        >
          Back to Patient
        </Button>
      </div>
      
      <Tabs defaultValue="new" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="new">New Symptom Check</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Symptoms</CardTitle>
              <CardDescription>
                Describe your symptoms in detail to get an assessment and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SymptomForm patientId={patientId} onSubmit={handleSubmit} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Symptom Check History</CardTitle>
              <CardDescription>
                View previous symptom checks and their results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SymptomCheckHistory patientId={patientId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
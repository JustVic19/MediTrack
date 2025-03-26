import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, AlertCircle, Loader2, CheckCircle2, CirclePlus } from 'lucide-react';

// Questionnaire types
interface Question {
  id: string;
  text: string;
  type: 'radio' | 'checkbox' | 'text';
  options?: string[];
  required: boolean;
}

interface Questionnaire {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  dueDate: Date;
  status: 'pending' | 'completed' | 'expired';
  questions: Question[];
  appointmentId?: number;
  appointmentDate?: Date;
  appointmentReason?: string;
}

interface QuestionnaireResponse {
  id: number;
  questionnaireId: number;
  patientId: number;
  submittedAt: Date;
  answers: Record<string, string | string[]>;
}

// Example questionnaire templates
const PRE_VISIT_QUESTIONNAIRE: Question[] = [
  {
    id: 'symptoms',
    text: 'Please describe your current symptoms and how long you have been experiencing them',
    type: 'text',
    required: true
  },
  {
    id: 'severity',
    text: 'How would you rate the severity of your symptoms?',
    type: 'radio',
    options: ['Mild', 'Moderate', 'Severe', 'Very Severe'],
    required: true
  },
  {
    id: 'medications',
    text: 'Are you currently taking any medications?',
    type: 'text',
    required: false
  },
  {
    id: 'allergies',
    text: 'Do you have any allergies we should be aware of?',
    type: 'text',
    required: false
  }
];

const HEALTH_ASSESSMENT_QUESTIONNAIRE: Question[] = [
  {
    id: 'overall_health',
    text: 'How would you rate your overall health?',
    type: 'radio',
    options: ['Excellent', 'Good', 'Fair', 'Poor'],
    required: true
  },
  {
    id: 'physical_limitations',
    text: 'Do you have any physical limitations that affect your daily activities?',
    type: 'radio',
    options: ['None', 'Mild', 'Moderate', 'Severe'],
    required: true
  },
  {
    id: 'diet',
    text: 'How would you describe your diet?',
    type: 'text',
    required: false
  },
  {
    id: 'exercise',
    text: 'How often do you exercise?',
    type: 'radio',
    options: ['Daily', '2-3 times per week', 'Once per week', 'Rarely', 'Never'],
    required: true
  },
  {
    id: 'smoke',
    text: 'Do you smoke?',
    type: 'radio',
    options: ['Yes', 'No', 'Former smoker'],
    required: true
  },
  {
    id: 'alcohol',
    text: 'How often do you consume alcoholic beverages?',
    type: 'radio',
    options: ['Never', 'Rarely', 'Socially', 'Weekly', 'Daily'],
    required: true
  }
];

function QuestionnaireCard({ questionnaire, onOpen }: { 
  questionnaire: Questionnaire; 
  onOpen: (questionnaire: Questionnaire) => void;
}) {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-green-100 text-green-800',
    'expired': 'bg-red-100 text-red-800',
  };
  
  const statusBadge = statusColors[questionnaire.status];
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{questionnaire.title}</CardTitle>
            <CardDescription>{questionnaire.description}</CardDescription>
          </div>
          <Badge className={statusBadge}>
            {questionnaire.status === 'pending' ? 'Pending' : 
             questionnaire.status === 'completed' ? 'Completed' : 'Expired'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {questionnaire.appointmentReason && (
          <div className="mb-2">
            <span className="text-sm text-muted-foreground">For appointment:</span>
            <p className="font-medium">{questionnaire.appointmentReason}</p>
            <p className="text-sm">{questionnaire.appointmentDate && 
              format(new Date(questionnaire.appointmentDate), 'MMM d, yyyy h:mm a')}</p>
          </div>
        )}
        <div className="text-sm mt-4">
          <div className="flex justify-between text-muted-foreground mb-1">
            <span>Due by:</span>
            <span>{format(new Date(questionnaire.dueDate), 'MMMM d, yyyy')}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {questionnaire.status === 'pending' ? (
          <Button onClick={() => onOpen(questionnaire)}>
            Fill Out Questionnaire
          </Button>
        ) : questionnaire.status === 'completed' ? (
          <Button variant="outline" onClick={() => onOpen(questionnaire)}>
            View Responses
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Expired
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function QuestionnaireForm({ 
  questionnaire, 
  onSubmit, 
  onCancel,
  existingResponses
}: { 
  questionnaire: Questionnaire; 
  onSubmit: (responses: Record<string, string | string[]>) => void;
  onCancel: () => void;
  existingResponses?: Record<string, string | string[]>;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | string[]>>(existingResponses || {});
  const [progress, setProgress] = useState(0);
  
  const questions = questionnaire.questions;
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isViewOnly = !!existingResponses;
  
  // Update progress bar
  useState(() => {
    setProgress(((currentStep + 1) / totalSteps) * 100);
  });
  
  const handleNextStep = () => {
    // Validate current question
    if (currentQuestion.required && !responses[currentQuestion.id]) {
      return; // Don't proceed if required field is empty
    }
    
    if (isLastStep) {
      onSubmit(responses);
    } else {
      setCurrentStep(currentStep + 1);
      setProgress(((currentStep + 2) / totalSteps) * 100);
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(((currentStep) / totalSteps) * 100);
    }
  };
  
  const handleResponseChange = (id: string, value: string | string[]) => {
    setResponses(prev => ({ ...prev, [id]: value }));
  };
  
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>Question {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>
      
      <div className="min-h-[200px]">
        <Label className="text-lg mb-2 block">{currentQuestion.text}</Label>
        
        {currentQuestion.type === 'radio' && (
          <RadioGroup 
            value={responses[currentQuestion.id] as string || ''} 
            onValueChange={(value) => handleResponseChange(currentQuestion.id, value)}
            disabled={isViewOnly}
            className="mt-4 space-y-3"
          >
            {currentQuestion.options?.map(option => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${currentQuestion.id}-${option}`} />
                <Label htmlFor={`${currentQuestion.id}-${option}`} className="cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
        
        {currentQuestion.type === 'text' && (
          <Textarea 
            value={responses[currentQuestion.id] as string || ''} 
            onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
            placeholder="Enter your response here"
            className="mt-2"
            rows={4}
            disabled={isViewOnly}
          />
        )}
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePreviousStep}
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        
        <Button 
          type="button" 
          onClick={handleNextStep}
          disabled={currentQuestion.required && !responses[currentQuestion.id]}
        >
          {isLastStep ? (isViewOnly ? 'Close' : 'Submit') : 'Next'}
        </Button>
      </div>
    </div>
  );
}

export default function PatientPortalQuestionnaires({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [responseData, setResponseData] = useState<Record<string, string | string[]> | undefined>(undefined);
  
  const { data: questionnaires, isLoading, isError } = useQuery<Questionnaire[]>({
    queryKey: ['/api/patient-portal/questionnaires', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/questionnaires?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const { data: responses } = useQuery<QuestionnaireResponse[]>({
    queryKey: ['/api/patient-portal/questionnaire-responses', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/questionnaire-responses?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const submitMutation = useMutation({
    mutationFn: async (data: { 
      questionnaireId: number; 
      patientId: number; 
      answers: Record<string, string | string[]>;
    }) => {
      const response = await apiRequest('POST', '/api/patient-portal/questionnaire-responses', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Questionnaire Submitted',
        description: 'Your responses have been submitted successfully.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/questionnaires'] });
      queryClient.invalidateQueries({ queryKey: ['/api/patient-portal/questionnaire-responses'] });
      setFormDialogOpen(false);
      setSelectedQuestionnaire(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to submit questionnaire: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleOpenQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    
    // If completed, check for responses
    if (questionnaire.status === 'completed' && responses) {
      const response = responses.find(r => r.questionnaireId === questionnaire.id);
      if (response) {
        setResponseData(response.answers);
      }
    } else {
      setResponseData(undefined);
    }
    
    setFormDialogOpen(true);
  };
  
  const handleSubmitResponses = (answers: Record<string, string | string[]>) => {
    if (!selectedQuestionnaire) return;
    
    submitMutation.mutate({
      questionnaireId: selectedQuestionnaire.id,
      patientId,
      answers
    });
  };
  
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
              Error loading questionnaires
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading your questionnaires. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const pendingQuestionnaires = questionnaires?.filter(q => q.status === 'pending') || [];
  const completedQuestionnaires = questionnaires?.filter(q => q.status === 'completed') || [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Pre-Visit Questionnaires</h2>
      </div>
      
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedQuestionnaire?.title}</DialogTitle>
            <DialogDescription>
              {selectedQuestionnaire?.description}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {selectedQuestionnaire && (
              <QuestionnaireForm 
                questionnaire={selectedQuestionnaire}
                onSubmit={handleSubmitResponses}
                onCancel={() => setFormDialogOpen(false)}
                existingResponses={responseData}
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingQuestionnaires.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedQuestionnaires.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {pendingQuestionnaires.length > 0 ? (
            pendingQuestionnaires.map(questionnaire => (
              <QuestionnaireCard 
                key={questionnaire.id} 
                questionnaire={questionnaire}
                onOpen={handleOpenQuestionnaire}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Pending Questionnaires</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any questionnaires to complete at this time.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {completedQuestionnaires.length > 0 ? (
            completedQuestionnaires.map(questionnaire => (
              <QuestionnaireCard 
                key={questionnaire.id} 
                questionnaire={questionnaire}
                onOpen={handleOpenQuestionnaire}
              />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Completed Questionnaires</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You haven't completed any questionnaires yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
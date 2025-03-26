import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PatientHistory, MedicalDocument } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileDown, 
  FileText, 
  FileX, 
  FilePlus2, 
  FileCog, 
  CalendarDays, 
  AlertCircle, 
  Loader2, 
  Stethoscope 
} from 'lucide-react';

type HistoryRecord = PatientHistory;
type DocumentRecord = MedicalDocument;

function DocumentItem({ document }: { document: DocumentRecord }) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const documentTypeIcons: Record<string, React.ReactNode> = {
    'pdf': <FileText className="h-5 w-5 text-red-500" />,
    'docx': <FileText className="h-5 w-5 text-blue-500" />,
    'jpg': <FileText className="h-5 w-5 text-green-500" />,
    'png': <FileText className="h-5 w-5 text-green-500" />,
    'default': <FileText className="h-5 w-5 text-gray-500" />,
  };
  
  const fileTypeKey = document.fileType.toLowerCase();
  const Icon = documentTypeIcons[fileTypeKey] || documentTypeIcons.default;
  
  // Convert file size to readable format
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {Icon}
            <CardTitle className="text-base font-medium">{document.fileName}</CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(document.uploadDate), 'MMM d, yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span>{document.fileType.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Size:</span>
            <span>{formatFileSize(document.fileSize)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Category:</span>
            <span className="capitalize">{document.category}</span>
          </div>
          {document.description && (
            <div className="text-sm mt-2">
              <span className="text-muted-foreground">Description:</span>
              <p className="mt-1">{document.description}</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setViewDialogOpen(true)}
            >
              <FileCog className="h-4 w-4" />
              View
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
      
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{document.fileName}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 min-h-[400px] flex items-center justify-center bg-muted/40 rounded-lg">
            {/* In a real implementation, this would render the document using appropriate viewer */}
            <div className="text-center p-6">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Document Preview</p>
              <p className="text-muted-foreground mt-2">
                This is where the actual document viewer would be integrated.
                <br />
                For PDFs, you would use a PDF viewer library.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function HistoryItem({ record }: { record: HistoryRecord }) {
  const renderVitals = (vitals: any) => {
    if (!vitals) return null;
    
    return (
      <div className="mt-4 p-3 bg-muted/40 rounded-lg">
        <h4 className="font-medium mb-2">Vitals</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-sm">
          {vitals.bloodPressure && (
            <div>
              <span className="text-muted-foreground">Blood Pressure:</span>
              <div>{vitals.bloodPressure}</div>
            </div>
          )}
          {vitals.heartRate && (
            <div>
              <span className="text-muted-foreground">Heart Rate:</span>
              <div>{vitals.heartRate} bpm</div>
            </div>
          )}
          {vitals.temperature && (
            <div>
              <span className="text-muted-foreground">Temperature:</span>
              <div>{vitals.temperature} °F</div>
            </div>
          )}
          {vitals.oxygenSaturation && (
            <div>
              <span className="text-muted-foreground">Oxygen Saturation:</span>
              <div>{vitals.oxygenSaturation}%</div>
            </div>
          )}
          {vitals.respiratoryRate && (
            <div>
              <span className="text-muted-foreground">Respiratory Rate:</span>
              <div>{vitals.respiratoryRate} breaths/min</div>
            </div>
          )}
          {vitals.weight && (
            <div>
              <span className="text-muted-foreground">Weight:</span>
              <div>{vitals.weight} lbs</div>
            </div>
          )}
          {vitals.height && (
            <div>
              <span className="text-muted-foreground">Height:</span>
              <div>{vitals.height} in</div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const typeLabels: Record<string, string> = {
    'history': 'Office Visit',
    'vitals': 'Vitals Check',
    'medication': 'Medication Update',
    'labs': 'Lab Results',
    'document': 'Document Update',
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium">
              {typeLabels[record.type || 'history'] || 'Office Visit'}
              {record.visitReason ? `: ${record.visitReason}` : ''}
            </CardTitle>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(record.visitDate), 'MMM d, yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          {record.notes && (
            <div>
              <h4 className="font-medium mb-1">Notes</h4>
              <p className="text-sm">{record.notes}</p>
            </div>
          )}
          
          {record.diagnosis && (
            <div>
              <h4 className="font-medium mb-1">Diagnosis</h4>
              <p className="text-sm">{record.diagnosis}</p>
            </div>
          )}
          
          {record.treatment && (
            <div>
              <h4 className="font-medium mb-1">Treatment</h4>
              <p className="text-sm">{record.treatment}</p>
            </div>
          )}
          
          {record.prescriptions && (
            <div>
              <h4 className="font-medium mb-1">Prescriptions</h4>
              <p className="text-sm">{record.prescriptions}</p>
            </div>
          )}
          
          {record.vitals && renderVitals(record.vitals)}
          
          {record.medications && record.medications.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Medications</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.medications.map((med, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{med.name}</TableCell>
                      <TableCell>{med.dosage}</TableCell>
                      <TableCell>{med.frequency}</TableCell>
                      <TableCell>
                        {med.startDate && format(new Date(med.startDate), 'MM/dd/yyyy')}
                        {med.endDate && ` - ${format(new Date(med.endDate), 'MM/dd/yyyy')}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {record.labResults && record.labResults.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Lab Results</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Normal Range</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {record.labResults.map((lab, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{lab.name}</TableCell>
                      <TableCell>{lab.result}</TableCell>
                      <TableCell>{lab.normalRange}</TableCell>
                      <TableCell>
                        {lab.date && format(new Date(lab.date), 'MM/dd/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {record.recordedBy && (
            <div className="text-sm text-muted-foreground mt-4">
              Recorded by: {record.recordedBy}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatientPortalRecords({ patientId }: { patientId: number }) {
  const { toast } = useToast();
  
  const { data: historyRecords, isLoading: isLoadingHistory, isError: isHistoryError } = useQuery<HistoryRecord[]>({
    queryKey: ['/api/patient-portal/history', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/history?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const { data: documents, isLoading: isLoadingDocuments, isError: isDocumentsError } = useQuery<DocumentRecord[]>({
    queryKey: ['/api/patient-portal/documents', patientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/patient-portal/documents?patientId=${patientId}`);
      return await response.json();
    },
  });
  
  const isLoading = isLoadingHistory || isLoadingDocuments;
  const isError = isHistoryError || isDocumentsError;
  
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
              Error loading medical records
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>There was an error loading your medical records. Please try again later.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Medical Records</h2>
      </div>
      
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Visit History ({historyRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documents?.length || 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="mt-4">
          {historyRecords && historyRecords.length > 0 ? (
            <div className="space-y-4">
              {historyRecords.map(record => (
                <HistoryItem key={record.id} record={record} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <Stethoscope className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Visit History</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your medical visit history will appear here after your appointments.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="mt-4">
          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map(doc => (
                <DocumentItem key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/40 rounded-lg">
              <FileX className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-medium text-lg mb-1">No Documents</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any medical documents in our system yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
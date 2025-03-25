import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  FileText, 
  FilePlus2, 
  Heart, 
  Pill, 
  Stethoscope
} from "lucide-react";
import { format } from "date-fns";
import { PatientHistory, Appointment } from "@shared/schema";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Type to represent all types of health events
type HealthEvent = {
  id: number;
  date: Date;
  title: string;
  description?: string;
  type: 'appointment' | 'history' | 'medication' | 'vitals' | 'labs' | 'document';
  status?: string;
  metadata?: Record<string, any>;
  iconColor?: string;
};

// Get icon component based on event type
function getEventIcon(type: HealthEvent['type']) {
  switch (type) {
    case 'appointment':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'history':
      return <FileText className="h-5 w-5 text-emerald-500" />;
    case 'medication':
      return <Pill className="h-5 w-5 text-purple-500" />;
    case 'vitals':
      return <Activity className="h-5 w-5 text-rose-500" />;
    case 'labs':
      return <Stethoscope className="h-5 w-5 text-amber-500" />;
    case 'document':
      return <FilePlus2 className="h-5 w-5 text-sky-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
}

// Function to get status badge color
function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30';
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30';
    case 'rescheduled':
      return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30';
    case 'normal':
      return 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30';
    case 'abnormal':
      return 'bg-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/30';
    case 'critical':
      return 'bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 hover:bg-gray-500/30';
  }
}

// Health event detail card component
type EventDetailProps = {
  event: HealthEvent;
};

function EventDetail({ event }: EventDetailProps) {
  if (!event) return null;

  // Render different content based on event type
  const renderContent = () => {
    switch (event.type) {
      case 'appointment':
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              {event.status && (
                <Badge className={cn(getStatusColor(event.status))}>
                  {event.status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">{event.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>{' '}
                {format(new Date(event.date), 'PPP')}
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>{' '}
                {format(new Date(event.date), 'p')}
              </div>
              {event.metadata?.doctor && (
                <div>
                  <span className="text-muted-foreground">Doctor:</span>{' '}
                  {event.metadata.doctor}
                </div>
              )}
              {event.metadata?.location && (
                <div>
                  <span className="text-muted-foreground">Location:</span>{' '}
                  {event.metadata.location}
                </div>
              )}
            </div>
          </>
        );
      
      case 'history':
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{event.description}</p>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>{' '}
                {format(new Date(event.date), 'PPP')}
              </div>
              {event.metadata?.recordedBy && (
                <div>
                  <span className="text-muted-foreground">Recorded by:</span>{' '}
                  {event.metadata.recordedBy}
                </div>
              )}
              {event.metadata?.diagnosis && (
                <div>
                  <span className="text-muted-foreground">Diagnosis:</span>{' '}
                  {event.metadata.diagnosis}
                </div>
              )}
              {event.metadata?.treatment && (
                <div>
                  <span className="text-muted-foreground">Treatment:</span>{' '}
                  {event.metadata.treatment}
                </div>
              )}
            </div>
          </>
        );

      case 'medication':
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              {event.status && (
                <Badge className={cn(getStatusColor(event.status))}>
                  {event.status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">{event.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>{' '}
                {event.metadata?.startDate ? format(new Date(event.metadata.startDate), 'PP') : 'N/A'}
              </div>
              <div>
                <span className="text-muted-foreground">Ends:</span>{' '}
                {event.metadata?.endDate ? format(new Date(event.metadata.endDate), 'PP') : 'Ongoing'}
              </div>
              {event.metadata?.dosage && (
                <div>
                  <span className="text-muted-foreground">Dosage:</span>{' '}
                  {event.metadata.dosage}
                </div>
              )}
              {event.metadata?.frequency && (
                <div>
                  <span className="text-muted-foreground">Frequency:</span>{' '}
                  {event.metadata.frequency}
                </div>
              )}
              {event.metadata?.prescribedBy && (
                <div>
                  <span className="text-muted-foreground">Prescribed by:</span>{' '}
                  {event.metadata.prescribedBy}
                </div>
              )}
            </div>
          </>
        );

      case 'vitals':
      case 'labs':
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
              {event.status && (
                <Badge className={cn(getStatusColor(event.status))}>
                  {event.status}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">{event.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {event.metadata && Object.entries(event.metadata).map(([key, value]) => (
                key !== 'status' && (
                  <div key={key}>
                    <span className="text-muted-foreground">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>{' '}
                    {value}
                  </div>
                )
              ))}
            </div>
          </>
        );

      default:
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">{event.title}</h3>
            </div>
            <p className="text-muted-foreground mb-4">{event.description}</p>
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          {getEventIcon(event.type)}
          <span>{event.type.charAt(0).toUpperCase() + event.type.slice(1)} Record</span>
        </CardTitle>
        <CardDescription>
          {format(new Date(event.date), 'PPPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

// Filter component for timeline events
type TimelineFilterProps = {
  selectedTypes: HealthEvent['type'][];
  onFilterChange: (types: HealthEvent['type'][]) => void;
};

function TimelineFilter({ selectedTypes, onFilterChange }: TimelineFilterProps) {
  const toggleType = (type: HealthEvent['type']) => {
    if (selectedTypes.includes(type)) {
      onFilterChange(selectedTypes.filter(t => t !== type));
    } else {
      onFilterChange([...selectedTypes, type]);
    }
  };

  const isSelected = (type: HealthEvent['type']) => selectedTypes.includes(type);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button
        size="sm"
        variant={isSelected('appointment') ? "default" : "outline"}
        onClick={() => toggleType('appointment')}
        className="gap-1"
      >
        <Calendar className="h-4 w-4" />
        <span>Appointments</span>
      </Button>
      <Button
        size="sm"
        variant={isSelected('history') ? "default" : "outline"}
        onClick={() => toggleType('history')}
        className="gap-1"
      >
        <FileText className="h-4 w-4" />
        <span>Medical History</span>
      </Button>
      <Button
        size="sm"
        variant={isSelected('medication') ? "default" : "outline"}
        onClick={() => toggleType('medication')}
        className="gap-1"
      >
        <Pill className="h-4 w-4" />
        <span>Medications</span>
      </Button>
      <Button
        size="sm"
        variant={isSelected('vitals') ? "default" : "outline"}
        onClick={() => toggleType('vitals')}
        className="gap-1"
      >
        <Heart className="h-4 w-4" />
        <span>Vitals</span>
      </Button>
      <Button
        size="sm"
        variant={isSelected('labs') ? "default" : "outline"}
        onClick={() => toggleType('labs')}
        className="gap-1"
      >
        <Stethoscope className="h-4 w-4" />
        <span>Lab Results</span>
      </Button>
      <Button
        size="sm"
        variant={isSelected('document') ? "default" : "outline"}
        onClick={() => toggleType('document')}
        className="gap-1"
      >
        <FilePlus2 className="h-4 w-4" />
        <span>Documents</span>
      </Button>
    </div>
  );
}

// Loading skeleton component for the timeline
function TimelineLoading() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty state component
function TimelineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No health records found</h3>
      <p className="text-muted-foreground max-w-sm mt-2">
        There are no health events to display for this patient. Records will appear here as they are added.
      </p>
    </div>
  );
}

// Main health timeline component
interface HealthTimelineProps {
  patientId: number;
}

export function HealthTimeline({ patientId }: HealthTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<HealthEvent['type'][]>([
    'appointment', 'history', 'medication', 'vitals', 'labs', 'document'
  ]);
  const [selectedEvent, setSelectedEvent] = useState<HealthEvent | null>(null);

  // Fetch patient history
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'history'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/patients/${patientId}/history`);
      return await res.json() as PatientHistory[];
    },
  });

  // Fetch patient appointments
  const { data: appointmentsData, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['/api/patients', patientId, 'appointments'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/patients/${patientId}/appointments`);
      return await res.json() as Appointment[];
    },
  });

  // Combine and transform all health events
  const allEvents: HealthEvent[] = React.useMemo(() => {
    const events: HealthEvent[] = [];

    // Add appointments as events
    if (appointmentsData) {
      appointmentsData.forEach(appointment => {
        events.push({
          id: appointment.id,
          date: new Date(appointment.appointmentDate),
          title: appointment.type || 'Medical Appointment',
          description: appointment.notes || 'No additional notes',
          type: 'appointment',
          status: appointment.status,
          metadata: {
            doctor: appointment.doctorName || 'Not specified',
            location: appointment.location || 'Main Office',
          }
        });
      });
    }

    // Add history entries as events
    if (historyData) {
      historyData.forEach(history => {
        // Add the main history record
        events.push({
          id: history.id,
          date: new Date(history.visitDate),
          title: history.visitReason || 'Medical Visit',
          description: history.notes || 'No additional notes',
          type: 'history',
          metadata: {
            recordedBy: history.recordedBy || 'Not specified',
            diagnosis: history.diagnosis || 'Not specified',
            treatment: history.treatment || 'Not specified',
          }
        });

        // If there are vitals in the history, add as a separate event
        if (history.vitals) {
          try {
            const vitalsData = typeof history.vitals === 'string' 
              ? JSON.parse(history.vitals) 
              : history.vitals;
            
            let vitalsStatus = 'normal';
            // Basic logic to determine vitals status (this could be more sophisticated)
            if (vitalsData.bloodPressure && (
              parseInt(vitalsData.bloodPressure.split('/')[0]) > 140 || 
              parseInt(vitalsData.bloodPressure.split('/')[1]) > 90)) {
              vitalsStatus = 'abnormal';
            }

            events.push({
              id: history.id * 1000 + 1, // Generate a unique ID
              date: new Date(history.visitDate),
              title: 'Vital Signs Record',
              description: 'Patient vital signs recorded during visit',
              type: 'vitals',
              status: vitalsStatus,
              metadata: {
                ...vitalsData,
                recordedBy: history.recordedBy || 'Not specified',
              }
            });
          } catch (e) {
            console.error('Error parsing vitals data:', e);
          }
        }

        // If there are medications in the history, add as separate events
        if (history.medications) {
          try {
            const medsData = typeof history.medications === 'string' 
              ? JSON.parse(history.medications) 
              : history.medications;
            
            if (Array.isArray(medsData)) {
              medsData.forEach((med, index) => {
                events.push({
                  id: history.id * 1000 + 100 + index, // Generate a unique ID
                  date: new Date(history.visitDate),
                  title: med.name || 'Medication Prescribed',
                  description: med.instructions || 'No specific instructions',
                  type: 'medication',
                  status: 'active',
                  metadata: {
                    dosage: med.dosage || 'Not specified',
                    frequency: med.frequency || 'Not specified',
                    startDate: history.visitDate,
                    endDate: med.endDate || null,
                    prescribedBy: history.recordedBy || 'Not specified',
                  }
                });
              });
            }
          } catch (e) {
            console.error('Error parsing medications data:', e);
          }
        }

        // If there are lab results in the history, add as a separate event
        if (history.labResults) {
          try {
            const labsData = typeof history.labResults === 'string' 
              ? JSON.parse(history.labResults) 
              : history.labResults;
            
            let labStatus = 'normal';
            // Logic to determine if any lab results are abnormal
            if (labsData && typeof labsData === 'object') {
              const abnormalValues = Object.values(labsData).filter(
                val => typeof val === 'string' && val.toLowerCase().includes('abnormal')
              );
              if (abnormalValues.length > 0) {
                labStatus = 'abnormal';
              }
            }

            events.push({
              id: history.id * 1000 + 2, // Generate a unique ID
              date: new Date(history.visitDate),
              title: 'Laboratory Results',
              description: 'Results from laboratory tests',
              type: 'labs',
              status: labStatus,
              metadata: {
                ...labsData,
                recordedBy: history.recordedBy || 'Not specified',
              }
            });
          } catch (e) {
            console.error('Error parsing lab results data:', e);
          }
        }

        // If there are documents in the history, add as separate events
        if (history.documents) {
          try {
            const docsData = typeof history.documents === 'string' 
              ? JSON.parse(history.documents) 
              : history.documents;
            
            if (Array.isArray(docsData)) {
              docsData.forEach((doc, index) => {
                events.push({
                  id: history.id * 1000 + 200 + index, // Generate a unique ID
                  date: new Date(doc.date || history.visitDate),
                  title: doc.title || 'Medical Document',
                  description: doc.description || 'No description provided',
                  type: 'document',
                  metadata: {
                    type: doc.type || 'Unknown',
                    url: doc.url || null,
                    uploadedBy: doc.uploadedBy || history.recordedBy || 'Not specified',
                  }
                });
              });
            }
          } catch (e) {
            console.error('Error parsing documents data:', e);
          }
        }
      });
    }

    // Sort all events by date (newest first)
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [historyData, appointmentsData]);

  // Filter events based on selected types
  const filteredEvents = allEvents.filter(event => selectedTypes.includes(event.type));

  // Handle event selection
  const handleEventClick = (event: HealthEvent) => {
    setSelectedEvent(event);
  };

  const isLoading = isHistoryLoading || isAppointmentsLoading;

  return (
    <div className="space-y-4">
      <TimelineFilter 
        selectedTypes={selectedTypes} 
        onFilterChange={setSelectedTypes} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Health Timeline</CardTitle>
              <CardDescription>
                Chronological view of the patient's health events and medical history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TimelineLoading />
              ) : filteredEvents.length > 0 ? (
                <Timeline>
                  {filteredEvents.map(event => (
                    <TimelineItem
                      key={`${event.type}-${event.id}`}
                      date={event.date}
                      title={event.title}
                      description={event.description}
                      icon={getEventIcon(event.type)}
                      active={selectedEvent?.id === event.id && selectedEvent?.type === event.type}
                      onClick={() => handleEventClick(event)}
                      className="cursor-pointer hover:bg-muted/50 rounded-lg -mx-3 px-3 transition-colors"
                    >
                      {event.status && (
                        <Badge 
                          className={cn("text-xs", getStatusColor(event.status))}
                        >
                          {event.status}
                        </Badge>
                      )}
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <TimelineEmpty />
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          {selectedEvent ? (
            <EventDetail event={selectedEvent} />
          ) : (
            <Card className="h-full flex items-center justify-center text-center">
              <CardContent className="py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No event selected</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  Click on a timeline event to view detailed information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
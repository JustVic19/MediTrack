import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, addDays, isEqual, isToday, isBefore, startOfDay } from "date-fns";
import { Appointment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface CalendarViewProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
}

export function CalendarView({ appointments, onDateSelect }: CalendarViewProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"month" | "week">("week");

  // Create appointment markers for each day with appointments
  const appointmentDates = appointments.reduce((acc, appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const dateKey = format(appointmentDate, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Generate days for week view
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(date), i));

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onDateSelect(newDate);
    }
  };

  return (
    <div className="bg-card shadow rounded-lg">
      <div className="px-4 py-5 border-b border-border sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-card-foreground">Appointment Calendar</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={view === "week" ? "bg-primary/10" : ""}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={view === "month" ? "bg-primary/10" : ""}
            onClick={() => setView("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <div className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            className="mx-auto"
            modifiersStyles={{
              today: {
                fontWeight: "bold",
                border: "2px solid var(--primary)",
              },
            }}
            modifiers={{
              appointment: (date) => 
                Object.keys(appointmentDates).includes(format(date, "yyyy-MM-dd")),
              past: (date) => isBefore(date, startOfDay(new Date())) && !isToday(date)
            }}
            modifiersClassNames={{
              appointment: "bg-primary/20 font-medium",
              past: "text-muted-foreground/70 line-through"
            }}
            footer={
              <div className="mt-3 text-sm text-center space-y-1">
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-primary/20 mr-2"></div>
                  <span className="text-muted-foreground">Has appointments</span>
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDate(addDays(date, -7))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Week
            </Button>
            <div className="text-sm font-medium text-card-foreground">
              {format(weekDays[0], "MMMM d")} - {format(weekDays[6], "MMMM d, yyyy")}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDate(addDays(date, 7))}
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayHasAppointments = appointmentDates[dayKey]?.length > 0;
              const isPastDay = isBefore(day, startOfDay(new Date())) && !isToday(day);
              
              return (
                <div 
                  key={dayKey}
                  className={`
                    p-2 text-center border rounded-md cursor-pointer transition-colors
                    ${isToday(day) ? 'border-primary' : 'border-border'} 
                    ${isEqual(startOfDay(day), startOfDay(date)) ? 'bg-primary/10' : ''} 
                    ${isPastDay ? 'text-muted-foreground dark:text-muted-foreground/70' : 'text-card-foreground'}
                    hover:bg-muted/10
                  `}
                  onClick={() => handleDateChange(day)}
                >
                  <div className="font-medium mb-1">{format(day, "EEE")}</div>
                  <div className={`text-lg ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                    {format(day, "d")}
                  </div>
                  {dayHasAppointments && (
                    <Badge className="mt-1 mx-auto">
                      {appointmentDates[dayKey].length} appt{appointmentDates[dayKey].length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Show appointments for selected date */}
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex items-center">
              <CalendarDays className="h-5 w-5 text-primary mr-2" />
              <h4 className="text-sm font-medium text-card-foreground">{format(date, "MMMM d, yyyy")} Appointments</h4>
            </div>
            <div className="mt-2 space-y-2">
              {appointmentDates[format(date, "yyyy-MM-dd")]?.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="p-2 border border-border rounded-md text-sm hover:bg-muted/10"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-card-foreground">{format(new Date(appointment.appointmentDate), "h:mm a")}</div>
                    <Badge variant="outline" className={
                      appointment.status.toLowerCase() === 'confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      appointment.status.toLowerCase() === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      appointment.status.toLowerCase() === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 
                      'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300'
                    }>{appointment.status}</Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">{appointment.reason}</div>
                </div>
              ))}
              {!appointmentDates[format(date, "yyyy-MM-dd")] && (
                <div className="text-center py-4 text-muted-foreground">
                  No appointments scheduled for this date.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { 
  UserPlus, Calendar, FileText, MessageSquare, Settings, 
  PhoneCall, Bell, Clipboard, ArrowRight 
} from "lucide-react";

interface QuickActionProps {
  onActionClick: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionProps) {
  const actions = [
    { 
      id: 'new-patient', 
      name: 'Add Patient', 
      description: 'Register a new patient',
      icon: <UserPlus className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
      color: 'bg-blue-100 dark:bg-blue-950/40'
    },
    { 
      id: 'new-appointment', 
      name: 'New Appointment', 
      description: 'Schedule an appointment',
      icon: <Calendar className="h-6 w-6 text-green-500 dark:text-green-400" />,
      color: 'bg-green-100 dark:bg-green-950/40'
    },
    { 
      id: 'patient-records', 
      name: 'Patient Records', 
      description: 'View medical records',
      icon: <FileText className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />,
      color: 'bg-yellow-100 dark:bg-yellow-950/40'
    },
    { 
      id: 'send-message', 
      name: 'Send Message', 
      description: 'Contact a patient',
      icon: <MessageSquare className="h-6 w-6 text-purple-500 dark:text-purple-400" />,
      color: 'bg-purple-100 dark:bg-purple-950/40'
    },
    { 
      id: 'manage-settings', 
      name: 'Settings', 
      description: 'Manage your account',
      icon: <Settings className="h-6 w-6 text-gray-500 dark:text-gray-400" />,
      color: 'bg-gray-100 dark:bg-gray-800/60'
    },
    { 
      id: 'phone-call', 
      name: 'Make Call', 
      description: 'Call a patient',
      icon: <PhoneCall className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />,
      color: 'bg-indigo-100 dark:bg-indigo-950/40'
    },
    { 
      id: 'appointment-reminder', 
      name: 'Send Reminder', 
      description: 'Send appointment reminders',
      icon: <Bell className="h-6 w-6 text-orange-500 dark:text-orange-400" />,
      color: 'bg-orange-100 dark:bg-orange-950/40'
    },
    { 
      id: 'patient-history', 
      name: 'Patient History', 
      description: 'View patient visit history',
      icon: <Clipboard className="h-6 w-6 text-teal-500 dark:text-teal-400" />,
      color: 'bg-teal-100 dark:bg-teal-950/40'
    }
  ];

  return (
    <div className="bg-card shadow rounded-lg">
      <div className="px-4 py-5 border-b border-border sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-card-foreground">Quick Actions</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {actions.map((action) => (
            <div 
              key={action.id}
              className="border border-border rounded-lg p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-md hover:border-primary bg-background"
              onClick={() => onActionClick(action.id)}
            >
              <div className={`p-3 rounded-full mb-3 ${action.color}`}>
                {action.icon}
              </div>
              <h4 className="text-sm font-medium text-card-foreground">{action.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 py-4 border-t border-border flex justify-end">
        <button className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
          Customize actions
          <ArrowRight className="ml-1 h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
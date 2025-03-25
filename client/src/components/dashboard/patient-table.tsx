import { useState } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Patient } from "@shared/schema";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PatientTableProps {
  patients: Patient[];
  limit?: number;
}

export function PatientTable({ patients, limit }: PatientTableProps) {
  const displayedPatients = limit ? patients.slice(0, limit) : patients;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
      case 'follow-up':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300';
    }
  };

  const getNameInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <div className="bg-card shadow rounded-lg">
      <div className="px-4 py-5 border-b border-border sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-card-foreground">
          {limit ? 'Recent Patients' : 'All Patients'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Visit</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card divide-y divide-border">
            {displayedPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${patient.firstName}+${patient.lastName}&background=random`} />
                      <AvatarFallback>{getNameInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-card-foreground">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-muted-foreground">{patient.email || 'No email provided'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-card-foreground">{patient.patientId}</div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-card-foreground">
                    {patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM d, yyyy') : 'Never'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className={getStatusColor(patient.status)}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/patients/${patient.id}`} className="text-primary hover:text-primary/80">
                    View
                  </Link>
                  <span className="mx-1 text-muted-foreground">|</span>
                  <Link href={`/patients/${patient.id}/edit`} className="text-muted-foreground hover:text-card-foreground">
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {displayedPatients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {limit && patients.length > limit && (
        <div className="px-6 py-4 border-t border-border">
          <Link href="/patients" className="text-primary hover:text-primary/80 font-medium">
            View all patients →
          </Link>
        </div>
      )}
    </div>
  );
}

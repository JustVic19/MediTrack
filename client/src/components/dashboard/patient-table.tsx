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
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNameInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {limit ? 'Recent Patients' : 'All Patients'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {displayedPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${patient.firstName}+${patient.lastName}&background=random`} />
                      <AvatarFallback>{getNameInitials(patient.firstName, patient.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-500">{patient.email || 'No email provided'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.patientId}</div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM d, yyyy') : 'Never'}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className={getStatusColor(patient.status)}>
                    {patient.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/patients/${patient.id}`} className="text-primary hover:text-blue-700">
                    View
                  </Link>
                  <span className="mx-1">|</span>
                  <Link href={`/patients/${patient.id}/edit`} className="text-gray-600 hover:text-gray-900">
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {displayedPatients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                  No patients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {limit && patients.length > limit && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Link href="/patients" className="text-primary hover:text-blue-700 font-medium">
            View all patients →
          </Link>
        </div>
      )}
    </div>
  );
}

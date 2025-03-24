import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PatientTable } from "@/components/dashboard/patient-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientForm } from "@/components/forms/patient-form";
import { Search, UserPlus } from "lucide-react";
import { Patient } from "@shared/schema";
import { useDebounce } from "use-debounce";

export default function Patients() {
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // Fetch patients with optional search
  const {
    data: patients = [],
    isLoading,
    isError,
  } = useQuery<Patient[]>({
    queryKey: ['/api/patients', debouncedSearchQuery ? { search: debouncedSearchQuery } : null],
  });

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8">
      {/* Page Header */}
      <div className="md:flex md:justify-between md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Patients</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading
              ? "Loading patient records..."
              : `${patients.length} patient${patients.length !== 1 ? "s" : ""} in the system`}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by name, ID, or phone..."
              className="pl-10 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Button onClick={() => setIsNewPatientModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Patients Table */}
      {isError ? (
        <div className="text-center py-8 text-red-500">
          Error loading patients. Please try again.
        </div>
      ) : (
        <PatientTable patients={patients} />
      )}

      {/* New Patient Modal */}
      <Dialog open={isNewPatientModalOpen} onOpenChange={setIsNewPatientModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm onSuccess={() => setIsNewPatientModalOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

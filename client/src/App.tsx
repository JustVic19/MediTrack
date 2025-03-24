import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientDetail from "@/pages/patient-detail";
import Appointments from "@/pages/appointments";
import PatientHistory from "@/pages/patient-history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import MainLayout from "@/layouts/main-layout";

function App() {
  return (
    <>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/patients" component={Patients} />
          <Route path="/patients/:id" component={PatientDetail} />
          <Route path="/appointments" component={Appointments} />
          <Route path="/patient-history" component={PatientHistory} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
      <Toaster />
    </>
  );
}

export default App;

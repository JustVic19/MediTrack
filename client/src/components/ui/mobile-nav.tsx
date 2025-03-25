import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, LayoutDashboard, UserRound, Calendar, History, Activity, Settings as SettingsIcon } from "lucide-react";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">MediTrack</h1>
        <button
          type="button"
          className="p-2 rounded-md text-gray-400"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {isOpen && <MobileMenu />}
    </>
  );
}

function MobileMenu() {
  const [location] = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: UserRound },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Patient History', href: '/patient-history', icon: History },
    { name: 'Health Timeline', href: '/health-timeline/1', icon: Activity },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="md:hidden absolute inset-x-0 top-12 z-40 bg-white border-b border-gray-200">
      <div className="pt-2 pb-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium",
                isActive
                  ? "border-primary text-primary bg-indigo-50"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="pt-4 pb-3 border-t border-gray-200">
        <div className="flex items-center px-4">
          <div className="flex-shrink-0">
            <img 
              className="h-10 w-10 rounded-full" 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
              alt="Profile" 
            />
          </div>
          <div className="ml-3">
            <div className="text-base font-medium text-gray-800">Dr. Sarah Johnson</div>
            <div className="text-sm font-medium text-gray-500">sarah.johnson@meditrack.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const [location] = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Patients', href: '/patients', icon: UserRound },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Timeline', href: '/health-timeline/1', icon: Activity },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
      <div className="grid grid-cols-5 h-16">
        {navigation.map((item) => {
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

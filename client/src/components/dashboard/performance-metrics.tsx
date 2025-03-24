import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetricsData {
  patientVisits: {
    name: string;
    count: number;
  }[];
  appointmentTypes: {
    name: string;
    value: number;
  }[];
  patientGrowth: {
    month: string;
    patients: number;
  }[];
}

interface PerformanceMetricsProps {
  data: MetricsData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0', '#F5B041'];

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Performance Metrics</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={timeRange === 'week' ? 'bg-primary/10' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={timeRange === 'month' ? 'bg-primary/10' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={timeRange === 'quarter' ? 'bg-primary/10' : ''}
            onClick={() => setTimeRange('quarter')}
          >
            Quarter
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={timeRange === 'year' ? 'bg-primary/10' : ''}
            onClick={() => setTimeRange('year')}
          >
            Year
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <Tabs defaultValue="patients">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="patients" className="flex-1">Patient Growth</TabsTrigger>
            <TabsTrigger value="visits" className="flex-1">Patient Visits</TabsTrigger>
            <TabsTrigger value="appointments" className="flex-1">Appointment Types</TabsTrigger>
          </TabsList>
          
          <TabsContent value="patients" className="mt-0">
            <div className="p-2 h-80">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Patient Growth Over Time</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.patientGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="patients" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 text-center mt-2">
                Showing patient growth over {timeRange}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="visits" className="mt-0">
            <div className="p-2 h-80">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Patient Visits by Day</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.patientVisits}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Visits" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 text-center mt-2">
                Number of patient visits per day
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="appointments" className="mt-0">
            <div className="p-2 h-80 flex flex-col items-center">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Appointment Types Distribution</h4>
              <div className="w-full h-full flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.appointmentTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.appointmentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 flex flex-wrap justify-center mt-4 md:mt-0">
                  {data.appointmentTypes.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center mr-4 mb-2">
                      <div 
                        className="w-3 h-3 mr-1 rounded-sm" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Distribution of appointment types for the {timeRange}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
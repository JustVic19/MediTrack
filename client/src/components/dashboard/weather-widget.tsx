import { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Wind, Droplets, Loader } from "lucide-react";

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  forecast: {
    day: string;
    temperature: number;
    condition: string;
  }[];
}

interface WeatherWidgetProps {
  apiKey?: string;
  location?: string;
  onWeatherLoaded?: (data: WeatherData) => void;
}

export function WeatherWidget({ apiKey, location = "New York", onWeatherLoaded }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This is a placeholder for actual API integration
    // In a real app, you would use the API key to fetch weather data
    if (!apiKey) {
      // If no API key provided, use sample data
      const sampleData: WeatherData = {
        temperature: 72,
        condition: "sunny",
        humidity: 65,
        windSpeed: 5,
        location: location,
        forecast: [
          { day: "Mon", temperature: 74, condition: "sunny" },
          { day: "Tue", temperature: 70, condition: "partly-cloudy" },
          { day: "Wed", temperature: 68, condition: "cloudy" },
          { day: "Thu", temperature: 65, condition: "rainy" },
          { day: "Fri", temperature: 69, condition: "sunny" },
        ]
      };

      // Simulate API call
      setTimeout(() => {
        setWeather(sampleData);
        setIsLoading(false);
        if (onWeatherLoaded) {
          onWeatherLoaded(sampleData);
        }
      }, 1000);
    } else {
      // Here you would implement actual API call
      // For now, just use the dummy data
      setWeather({
        temperature: 72,
        condition: "sunny",
        humidity: 65,
        windSpeed: 5,
        location: location,
        forecast: [
          { day: "Mon", temperature: 74, condition: "sunny" },
          { day: "Tue", temperature: 70, condition: "partly-cloudy" },
          { day: "Wed", temperature: 68, condition: "cloudy" },
          { day: "Thu", temperature: 65, condition: "rainy" },
          { day: "Fri", temperature: 69, condition: "sunny" },
        ]
      });
      setIsLoading(false);
    }
  }, [apiKey, location, onWeatherLoaded]);

  // Function to get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'partly-cloudy':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'stormy':
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
      case 'snowy':
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case 'drizzle':
        return <CloudDrizzle className="h-8 w-8 text-blue-400" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  // Function to get small weather icon for forecast
  const getSmallWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-5 w-5 text-yellow-500" />;
      case 'partly-cloudy':
        return <Cloud className="h-5 w-5 text-gray-400" />;
      case 'cloudy':
        return <Cloud className="h-5 w-5 text-gray-500" />;
      case 'rainy':
        return <CloudRain className="h-5 w-5 text-blue-500" />;
      case 'stormy':
        return <CloudLightning className="h-5 w-5 text-purple-500" />;
      case 'snowy':
        return <CloudSnow className="h-5 w-5 text-blue-200" />;
      case 'drizzle':
        return <CloudDrizzle className="h-5 w-5 text-blue-400" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (error) {
    return (
      <div className="bg-card shadow rounded-lg p-4">
        <div className="text-center text-destructive">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-border sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-card-foreground">Local Weather</h3>
      </div>
      
      {isLoading ? (
        <div className="p-8 flex justify-center items-center">
          <Loader className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : weather ? (
        <div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-card-foreground">{weather.location}</div>
              <div className="text-xl mt-1 text-card-foreground">{weather.temperature}°F</div>
              <div className="text-sm text-muted-foreground capitalize">{weather.condition}</div>
            </div>
            <div className="flex flex-col items-center">
              {getWeatherIcon(weather.condition)}
            </div>
          </div>
          
          <div className="px-4 py-3 bg-muted/30 flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Droplets className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-card-foreground">Humidity: {weather.humidity}%</span>
            </div>
            <div className="flex items-center">
              <Wind className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-card-foreground">Wind: {weather.windSpeed} mph</span>
            </div>
          </div>
          
          <div className="px-4 py-3 border-t border-border">
            <div className="text-sm font-medium mb-2 text-card-foreground">5-Day Forecast</div>
            <div className="flex justify-between">
              {weather.forecast.map((day, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs font-medium text-card-foreground">{day.day}</div>
                  <div className="my-1">
                    {getSmallWeatherIcon(day.condition)}
                  </div>
                  <div className="text-xs text-card-foreground">{day.temperature}°</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <p>Unable to load weather data</p>
        </div>
      )}
    </div>
  );
}
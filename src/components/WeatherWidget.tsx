
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { weatherService, DailyWeather } from '../services/weatherService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  WiDaySunny,
  WiDayCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog
} from 'react-icons/wi';

const WidgetContainer = styled.div`
  background: white; // linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%);
  border-radius: 1.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(56, 178, 172, 0.15); // Soft teal shadow
  border: 1px solid #e6fffa;
  color: #2c7a7b;
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #234e52; // Dark teal
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg { font-size: 1.5rem; }
`;

const ForecastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(4, 1fr); // Show 4 on very small screens, scroll or wrap
    overflow-x: auto;
    padding-bottom: 0.5rem;
    
    // Hide scrollbar but keep functionality
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none; /* IE as well */
  }
`;

const DayCard = styled.div<{ isRainy?: boolean }>`
  background: ${props => props.isRainy ? '#ebf8ff' : 'rgba(255, 255, 255, 0.6)'};
  border: ${props => props.isRainy ? '2px solid #4299e1' : '1px solid transparent'}; // Blue border for rain
  border-radius: 1rem;
  padding: 0.75rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  // Rain visual effect if needed
  ${props => props.isRainy && `
    box-shadow: 0 0 15px rgba(66, 153, 225, 0.4);
    transform: translateY(-4px);
  `}

  &:hover {
    background: white;
    transform: translateY(-4px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .day-name {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    color: ${props => props.isRainy ? '#2c5282' : '#285e61'};
  }

  .icon {
    font-size: 2rem;
    margin: 0.25rem 0;
    color: ${props => props.isRainy ? '#3182ce' : '#38b2ac'};
  }

  .temps {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2d3748;
    
    .max { color: #e53e3e; margin-right: 4px; }
    .min { color: #3182ce; }
  }

  .precip {
    font-size: 0.75rem;
    color: #2b6cb0;
    margin-top: 0.25rem;
    font-weight: 700;
    background: #bee3f8;
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

const getWeatherIcon = (code: number, precip?: number) => {
  // WMO Weather interpretation codes (WW)

  // Custom Override: If precip is negligible (< 1.0mm), show clouds instead of rain
  // This prevents "Rain" icon when it's just a 0.2mm drizzle
  if (precip !== undefined && precip < 1.0 && (code >= 51 && code <= 99)) {
    return <WiDayCloudy color="#a0aec0" />;
  }

  // 0: Clear sky
  if (code === 0) return <WiDaySunny color="#ecc94b" />;
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code <= 3) return <WiDayCloudy color="#a0aec0" />;
  // 45, 48: Fog
  if (code <= 48) return <WiFog color="#cbd5e0" />;
  // 51-67: Drizzle and Rain
  if (code <= 67) return <WiRain color="#4299e1" />;
  // 71-77: Snow
  if (code <= 77) return <WiSnow color="#63b3ed" />;
  // 80-82: Rain showers
  if (code <= 82) return <WiRain color="#4299e1" />;
  // 95-99: Thunderstorm
  return <WiThunderstorm color="#805ad5" />;
};

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<{ current: { temp: number; code: number }; daily: DailyWeather[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await weatherService.getForecast();
      setWeather(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !weather) return null;

  return (
    <WidgetContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Title style={{ margin: 0 }}><WiDaySunny /> Pronóstico (Munro/Olivos)</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e6fffa', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {getWeatherIcon(weather.current.code)}
          <span>{Math.round(weather.current.temp)}°C Ahora</span>
        </div>
      </div>

      <ForecastGrid>
        {weather.daily.map((day) => {
          // Strict visual alarm: ONLY if precipitation is significant (> 1.5mm)
          // We ignore the code here to avoid "bordering" drizzle days
          const isRainy = day.precipitation >= 1.5;

          return (
            <DayCard key={day.date} isRainy={isRainy}>
              <div className="day-name">
                {format(new Date(day.date + 'T00:00:00'), 'EEE', { locale: es })}
              </div>
              <div className="icon">
                {getWeatherIcon(day.weatherCode, day.precipitation)}
              </div>
              <div className="temps">
                <span className="max">{Math.round(day.maxTemp)}°</span>
                <span className="min">{Math.round(day.minTemp)}°</span>
              </div>
              {day.precipitation >= 1.0 && (
                <div className="precip">{day.precipitation}mm</div>
              )}
            </DayCard>
          );
        })}
      </ForecastGrid>
    </WidgetContainer>
  );
};

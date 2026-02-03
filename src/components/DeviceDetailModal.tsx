import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { TuyaDevice, tuyaService, DeviceSettings } from '../services/tuyaService';
import { roomsService } from '../services/roomsService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FaTimes, FaThermometerHalf, FaTint, FaHistory, FaArrowUp, FaArrowDown, FaMinus, FaCog, FaSave } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 1rem 1rem 0 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  font-size: 1.25rem;
  transition: color 0.2s;
  &:hover { color: #e53e3e; }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #718096;
  font-weight: 600;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${p => p.color || '#2d3748'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem 1rem 1rem 0; /* padding right for YAxis */
  height: 350px;
  position: relative;
`;

const ChartTitle = styled.h4`
    margin: 0 0 1rem 1.5rem;
    color: #4a5568;
    display: flex;
    align-items: center;
    gap: 0.5rem;
`;



const TabButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  background: ${p => p.$active ? '#e2e8f0' : 'transparent'};
  color: ${p => p.$active ? '#2d3748' : '#718096'};
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  &:hover { background: #edf2f7; }
`;

interface DeviceDetailModalProps {
    device: TuyaDevice;
    onClose: () => void;
}

import { ToastModal } from './ToastModal';

// ... (keep styled components)

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, onClose }) => {
    const [view, setView] = useState<'history' | 'config'>('history');
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Config State
    const [settings, setSettings] = useState<DeviceSettings>({ device_id: device.id });
    const [rooms, setRooms] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    // Toast State
    const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        type: 'info'
    });

    useEffect(() => {
        if (view === 'history') {
            // ... (existing fetchLogs logic - keep unchanged)
            const fetchLogs = async () => {
                setLoading(true);
                try {
                    let startTime;
                    const now = new Date().getTime();
                    switch (timeRange) {
                        case '24h': startTime = now - 24 * 60 * 60 * 1000; break;
                        case '7d': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
                        case '30d': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
                        default: startTime = now - 7 * 24 * 60 * 60 * 1000;
                    }

                    const data = await tuyaService.getDeviceLogs(device.id, startTime);

                    if (data) {
                        let logsArray = [];
                        if (Array.isArray(data)) {
                            logsArray = data;
                        } else if (data.logs && Array.isArray(data.logs)) {
                            logsArray = data.logs;
                        } else if (data.result && Array.isArray(data.result)) {
                            logsArray = data.result;
                        }

                        setLogs(logsArray.sort((a: any, b: any) => b.event_time - a.event_time));
                    }
                } catch (error) {
                    console.error("Failed to fetch logs", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchLogs();
        } else {
            // Fetch Settings AND Rooms
            const loadSettings = async () => {
                setLoading(true);
                try {
                    // Parallel fetch
                    const [settingsData, roomsData] = await Promise.all([
                        tuyaService.getDeviceSettings(device.id),
                        roomsService.getRooms()
                    ]);

                    if (settingsData) setSettings(settingsData);
                    if (roomsData) setRooms(roomsData);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            loadSettings();
        }
    }, [device.id, timeRange, view]);

    // Process data for charts
    const chartData = useMemo(() => {
        const chronologicalLogs = [...logs].reverse();

        return chronologicalLogs
            .filter((log: any) => log.code === 'va_temperature' || log.code === 'va_humidity' || log.code === 'temp_current' || log.code === 'humidity_value')
            .map((log: any) => ({
                time: timeRange === '24h'
                    ? new Date(log.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date(log.event_time).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + (timeRange === '7d' ? ' ' + new Date(log.event_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')
                ,
                fullDate: new Date(log.event_time),
                value: log.code.includes('temp') ? Number(log.value) / 10 : Number(log.value),
                type: log.code.includes('temp') ? 'temp' : 'hum',
            }));
    }, [logs, timeRange]);

    // ... (rest of separate data logic relies on chartData, so it updates automatically)
    const tempData = chartData.filter(d => d.type === 'temp');
    const humData = chartData.filter(d => d.type === 'hum');

    const calculateStats = (data: any[]) => {
        if (data.length === 0) return { min: 0, max: 0, avg: 0, current: 0 };
        const values = data.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const current = values[values.length - 1];
        return { min, max, avg, current };
    };

    const tempStats = calculateStats(tempData);
    const humStats = calculateStats(humData);
    const hasData = logs.length > 0;

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await tuyaService.saveDeviceSettings({ ...settings, device_id: device.id });
            setToast({ open: true, message: 'Configuración guardada correctamente', type: 'success' });
            setTimeout(() => setView('history'), 1500); // Wait a bit before closing config
        } catch (e) {
            setToast({ open: true, message: 'Error al guardar configuración.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <React.Fragment>
            <ModalOverlay onClick={onClose}>
                {/* ... Modal Content ... */}
                <ModalContent onClick={e => e.stopPropagation()}>
                    <ModalHeader>
                        {/* ... Header ... */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Title>{device.name}</Title>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <TabButton
                                    $active={view === 'history'}
                                    onClick={() => setView('history')}
                                    title="Ver Historial"
                                >
                                    <FaHistory /> Historial
                                </TabButton>
                                <TabButton
                                    $active={view === 'config'}
                                    onClick={() => setView('config')}
                                    title="Configuración de Alertas"
                                >
                                    <FaCog /> Configuración
                                </TabButton>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {view === 'history' && (['24h', '7d', '30d'] as const).map(range => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        border: '1px solid #cbd5e0',
                                        background: timeRange === range ? '#3182ce' : 'white',
                                        color: timeRange === range ? 'white' : '#4a5568',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {range === '24h' ? '24hs' : range === '7d' ? '7 Días' : '30 Días'}
                                </button>
                            ))}
                            <CloseButton onClick={onClose}><FaTimes /></CloseButton>
                        </div>
                    </ModalHeader>

                    <ModalBody>
                        {view === 'config' ? (
                            <div style={{ padding: '1rem' }}>
                                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Configuración General</h4>

                                {/* Room Assignment */}
                                <div style={{ marginBottom: '2rem', background: '#f7fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #edf2f7' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#4a5568', marginBottom: '0.5rem', fontWeight: 'bold' }}>📍 Asignar a Sala / Cultivo</label>
                                    <select
                                        value={settings.room_id || ''}
                                        onChange={(e) => setSettings({ ...settings, room_id: e.target.value || undefined })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #cbd5e0', background: 'white', fontSize: '1rem' }}
                                    >
                                        <option value="">-- Sin asignar --</option>
                                        {rooms.map((room: any) => (
                                            <option key={room.id} value={room.id}>
                                                {room.name} ({room.type === 'vegetation' ? 'Vegetación' : room.type === 'flowering' ? 'Floración' : room.type === 'drying' ? 'Secado' : 'Otro'})
                                            </option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.5rem' }}>
                                        Asignar este sensor a una sala te permitirá filtrar y ver sus datos directamente en la vista de detalle de esa sala.
                                    </p>
                                </div>

                                <h4 style={{ color: '#2d3748', marginBottom: '1rem' }}>Umbrales de Alerta</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {/* Temperature Settings */}
                                    <div style={{ background: '#fff5f5', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #feb2b2' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c53030', fontWeight: 'bold', marginBottom: '1rem' }}>
                                            <FaThermometerHalf /> Alertas de Temperatura
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>Mínima (°C)</label>
                                            <input
                                                type="number"
                                                value={settings.min_temp ?? ''}
                                                onChange={e => setSettings({ ...settings, min_temp: Number(e.target.value) })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>Máxima (°C)</label>
                                            <input
                                                type="number"
                                                value={settings.max_temp ?? ''}
                                                onChange={e => setSettings({ ...settings, max_temp: Number(e.target.value) })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Humidity Settings */}
                                    <div style={{ background: '#ebf8ff', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #bee3f8' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2b6cb0', fontWeight: 'bold', marginBottom: '1rem' }}>
                                            <FaTint /> Alertas de Humedad
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>Mínima (%)</label>
                                            <input
                                                type="number"
                                                value={settings.min_hum ?? ''}
                                                onChange={e => setSettings({ ...settings, min_hum: Number(e.target.value) })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '0.5rem' }}>Máxima (%)</label>
                                            <input
                                                type="number"
                                                value={settings.max_hum ?? ''}
                                                onChange={e => setSettings({ ...settings, max_hum: Number(e.target.value) })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={saving}
                                        style={{
                                            background: '#48bb78',
                                            color: 'white',
                                            border: 'none',
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '0.5rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            opacity: saving ? 0.7 : 1
                                        }}
                                    >
                                        <FaSave /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // ... history view (restored or kept)
                            loading ? <LoadingSpinner text="Cargando historial..." /> : !hasData ? (
                                <div style={{ textAlign: 'center', color: '#a0aec0', padding: '3rem' }}>
                                    <FaHistory style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem' }} />
                                    No hay datos históricos disponibles para este periodo.
                                </div>
                            ) : (
                                <>
                                    {/* Temperature Section */}
                                    {tempData.length > 0 && (
                                        <div>
                                            <StatsGrid style={{ marginBottom: '1rem' }}>
                                                <StatCard>
                                                    <StatLabel>Temperatura Actual</StatLabel>
                                                    <StatValue color="#e53e3e"><FaThermometerHalf /> {tempStats.current.toFixed(1)}°C</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Máxima ({timeRange})</StatLabel>
                                                    <StatValue color="#d53f8c"><FaArrowUp size={16} /> {tempStats.max.toFixed(1)}°C</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Mínima ({timeRange})</StatLabel>
                                                    <StatValue color="#3182ce"><FaArrowDown size={16} /> {tempStats.min.toFixed(1)}°C</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Promedio</StatLabel>
                                                    <StatValue color="#805ad5"><FaMinus size={16} /> {tempStats.avg.toFixed(1)}°C</StatValue>
                                                </StatCard>
                                            </StatsGrid>

                                            <ChartContainer>
                                                <ChartTitle><FaThermometerHalf color="#e53e3e" /> Historial de Temperatura</ChartTitle>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={tempData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                        <XAxis dataKey="time" minTickGap={30} fontSize={12} stroke="#a0aec0" />
                                                        <YAxis domain={['auto', 'auto']} fontSize={12} stroke="#a0aec0" unit="°C" />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                            formatter={(value: any) => [`${Number(value).toFixed(1)} °C`, 'Temperatura']}
                                                            labelStyle={{ color: '#718096' }}
                                                        />
                                                        <Line type="monotone" dataKey="value" stroke="#e53e3e" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    )}

                                    {/* Humidity Section */}
                                    {humData.length > 0 && (
                                        <div style={{ marginTop: '2rem' }}>
                                            <StatsGrid style={{ marginBottom: '1rem' }}>
                                                <StatCard>
                                                    <StatLabel>Humedad Actual</StatLabel>
                                                    <StatValue color="#3182ce"><FaTint /> {humStats.current.toFixed(0)}%</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Máxima ({timeRange})</StatLabel>
                                                    <StatValue color="#d53f8c"><FaArrowUp size={16} /> {humStats.max.toFixed(0)}%</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Mínima ({timeRange})</StatLabel>
                                                    <StatValue color="#3182ce"><FaArrowDown size={16} /> {humStats.min.toFixed(0)}%</StatValue>
                                                </StatCard>
                                                <StatCard>
                                                    <StatLabel>Promedio</StatLabel>
                                                    <StatValue color="#805ad5"><FaMinus size={16} /> {humStats.avg.toFixed(0)}%</StatValue>
                                                </StatCard>
                                            </StatsGrid>

                                            <ChartContainer>
                                                <ChartTitle><FaTint color="#3182ce" /> Historial de Humedad</ChartTitle>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <LineChart data={humData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                        <XAxis dataKey="time" minTickGap={30} fontSize={12} stroke="#a0aec0" />
                                                        <YAxis domain={[0, 100]} fontSize={12} stroke="#a0aec0" unit="%" />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                                            formatter={(value: any) => [`${Number(value).toFixed(0)} %`, 'Humedad']}
                                                            labelStyle={{ color: '#718096' }}
                                                        />
                                                        <Line type="monotone" dataKey="value" stroke="#3182ce" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </ModalBody>
                </ModalContent>
                <ToastModal
                    isOpen={toast.open}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, open: false }))}
                />
            </ModalOverlay>
        </React.Fragment>
    );
};

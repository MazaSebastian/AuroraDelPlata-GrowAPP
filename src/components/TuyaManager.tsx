
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { tuyaService, TuyaDevice } from '../services/tuyaService';
import { FaLightbulb, FaPlug, FaThermometerHalf, FaTint, FaPowerOff, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { LoadingSpinner } from './LoadingSpinner';
import { DeviceDetailModal } from './DeviceDetailModal';

const Container = styled.div`
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  h3 { margin: 0; color: #2d3748; display: flex; align-items: center; gap: 0.5rem; }
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  &:hover { color: #3182ce; }
`;

const DeviceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const DeviceCard = styled.div<{ $online: boolean }>`
  border: 1px solid ${p => p.$online ? '#e2e8f0' : '#feb2b2'};
  border-radius: 0.5rem;
  padding: 1rem;
  background: ${p => p.$online ? 'white' : '#fff5f5'};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
`;

const StatusBadge = styled.span<{ $online: boolean }>`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${p => p.$online ? '#48bb78' : '#e53e3e'};
`;

const DeviceIcon = styled.div`
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 0.25rem;
`;

const DeviceName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DeviceInfo = styled.div`
  font-size: 0.75rem;
  color: #718096;
`;

const ControlButton = styled.button<{ $isOn: boolean }>`
  background: ${p => p.$isOn ? '#48bb78' : '#cbd5e0'};
  color: white;
  border: none;
  padding: 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: auto;
  transition: background 0.2s;

  &:hover {
    background: ${p => p.$isOn ? '#38a169' : '#a0aec0'};
  }
`;

const SensorValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #2d3748;
  margin-top: 0.25rem;
`;


interface TuyaManagerProps {
    mode?: 'full' | 'sensors' | 'switches';
    roomId?: string;
    compact?: boolean;
}

// ...

export const TuyaManager: React.FC<TuyaManagerProps> = ({ mode = 'full', roomId, compact = false }) => {
    // ... (keep state)
    const [devices, setDevices] = useState<TuyaDevice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<TuyaDevice | null>(null);
    const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});

    // ... (keep loadDevices, loadSettings, useEffect, handleToggle, getSensorData, filteredDevices, getAlertStatus)
    const loadDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Race against a 10s timeout
            const timeoutPromise = new Promise<TuyaDevice[]>((_, reject) => {
                setTimeout(() => reject(new Error('Tiempo de espera agotado. Verifique su conexión o la API.')), 10000);
            });

            const data = await Promise.race([
                tuyaService.getDevices(),
                timeoutPromise
            ]);

            setDevices(data);

            // We can stop loading here to show devices immediately, 
            // even if status refresh is still pending/ongoing in background.
            // But to be consistent with previous logic, we keep loading false.
            // However, we should ensure finally block handles it.

            // Refresh status in background (non-blocking for UI spinner if we set loading false now? 
            // The original code set loading false immediately after getting devices list)

            // Refresh status
            const freshDataPromises = data.map(async (device) => {
                try {
                    const freshStatus = await tuyaService.getDeviceStatus(device.id);
                    return { ...device, status: freshStatus };
                } catch (e) {
                    console.warn(`Failed to refresh status for ${device.name}`, e);
                    return device;
                }
            });

            // We await this to show fresh status, or we could let it update later.
            // Let's await it but if it fails/timeouts, we still show devices.
            Promise.all(freshDataPromises).then(freshDevices => {
                setDevices(freshDevices);
            }).catch(e => console.error("Error updating statuses", e));

        } catch (err: any) {
            console.error("Error loading Tuya devices:", err);
            setError(err.message || "Error al cargar dispositivos.");
        } finally {
            setLoading(false);
        }
    };



    const loadSettings = async () => {
        const { data } = await import('../services/supabaseClient').then(m => m.supabase!.from('tuya_device_settings').select('*'));
        if (data) {
            const map: Record<string, any> = {};
            data.forEach((s: any) => map[s.device_id] = s);
            setSettingsMap(map);
        }
    };

    useEffect(() => {
        loadDevices();
        loadSettings();
        const interval = setInterval(() => {
            loadDevices();
            loadSettings();
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = async (device: TuyaDevice) => {
        const switchStatus = device.status.find(s => s.code.startsWith('switch'));
        const currentVal = switchStatus ? switchStatus.value : false;
        const code = switchStatus ? switchStatus.code : 'switch_1';

        try {
            await tuyaService.toggleDevice(device.id, currentVal, code);
            loadDevices();
        } catch (err) {
            alert("Error al controlar el dispositivo");
        }
    };

    const getSensorData = (status: any[]) => {
        const temp = status.find(s => s.code.includes('temp'));
        const hum = status.find(s => s.code.includes('humid'));
        return { temp, hum };
    };

    const filteredDevices = devices.filter(device => {
        const { temp, hum } = getSensorData(device.status);
        const switchStatus = device.status.find(s => s.code.startsWith('switch'));

        if (roomId) {
            const setting = settingsMap[device.id];
            if (!setting || setting.room_id !== roomId) return false;
        }

        if (mode === 'sensors') return !!(temp || hum);
        if (mode === 'switches') return !!switchStatus;
        return true;
    });

    const getAlertStatus = (device: TuyaDevice) => {
        const setting = settingsMap[device.id];
        if (!setting) return null;

        const { temp, hum } = getSensorData(device.status);
        let alert = null;

        if (temp) {
            const tempVal = (typeof temp.value === 'number') ? (temp.value / 10) : temp.value;
            if (setting.max_temp && tempVal > setting.max_temp) alert = 'Temp. Alta';
            if (setting.min_temp && tempVal < setting.min_temp) alert = 'Temp. Baja';
        }
        if (hum) {
            const humVal = hum.value;
            if (setting.max_hum && humVal > setting.max_hum) alert = alert ? `${alert} / Hum. Alta` : 'Hum. Alta';
            if (setting.min_hum && humVal < setting.min_hum) alert = alert ? `${alert} / Hum. Baja` : 'Hum. Baja';
        }
        return alert;
    };


    // REMOVED: Blocking spinner. User prefers non-blocking load.
    // if (loading && devices.length === 0) return <LoadingSpinner text="Cargando dispositivos..." />;

    return (
        <Container style={compact ? { padding: '0.5rem', boxShadow: 'none', background: 'transparent' } : undefined}>
            {!compact && (
                <Header>
                    <h3>
                        {roomId ? 'Sensor Asignado' : (mode === 'sensors' ? 'Monitoreo Ambiental (Tuya)' : 'Dispositivos Tuya (IoT)')}
                    </h3>
                    <RefreshButton onClick={() => { loadDevices(); loadSettings(); }} title="Actualizar">
                        <FaSync className={loading ? 'fa-spin' : ''} />
                    </RefreshButton>
                </Header>
            )}

            {error ? (
                <div style={{ color: '#e53e3e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaExclamationTriangle /> {error}
                </div>
            ) : (
                <DeviceGrid style={compact ? { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' } : undefined}>
                    {filteredDevices.map(device => {
                        const switchStatus = device.status.find(s => s.code.startsWith('switch'));
                        const isSwitch = !!switchStatus;
                        const isOn = switchStatus ? switchStatus.value : false;
                        const { temp, hum } = getSensorData(device.status);
                        const isSensor = temp || hum;
                        const alert = getAlertStatus(device);
                        const showControls = mode !== 'sensors';

                        // Compact Card Rendering
                        if (compact) {
                            return (
                                <DeviceCard
                                    key={device.id}
                                    $online={device.online}
                                    onClick={() => isSensor && setSelectedDevice(device)}
                                    style={{
                                        cursor: isSensor ? 'pointer' : 'default',
                                        border: alert ? '1px solid #e53e3e' : '1px solid #e2e8f0',
                                        background: alert ? '#fff5f5' : 'white',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        gap: '1rem',
                                        minHeight: 'auto'
                                    }}
                                >
                                    <StatusBadge $online={device.online} style={{ top: '0.25rem', right: '0.25rem' }} />
                                    <div style={{ fontSize: '1.5rem', color: '#4a5568' }}>
                                        {isSensor ? <FaThermometerHalf /> : isSwitch ? <FaPlug /> : <FaLightbulb />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#2d3748', marginBottom: '0.25rem' }}>{device.name}</div>
                                        {isSensor && (
                                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                {temp && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#e53e3e', fontWeight: '600' }}>
                                                        <FaThermometerHalf /> {typeof temp.value === 'number' ? (temp.value / 10).toFixed(1) : temp.value}°C
                                                    </span>
                                                )}
                                                {hum && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3182ce', fontWeight: '600' }}>
                                                        <FaTint /> {hum.value}%
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {alert && <FaExclamationTriangle style={{ color: '#e53e3e' }} title={alert} />}
                                </DeviceCard>
                            );
                        }

                        // Full Card Rendering (Existing)
                        return (
                            <DeviceCard
                                key={device.id}
                                $online={device.online}
                                onClick={() => isSensor && setSelectedDevice(device)}
                                style={{
                                    cursor: isSensor ? 'pointer' : 'default',
                                    border: alert ? '2px solid #e53e3e' : undefined,
                                    background: alert ? '#fff5f5' : undefined
                                }}
                            >
                                <StatusBadge $online={device.online} />
                                <DeviceIcon>
                                    {isSensor ? <FaThermometerHalf /> : isSwitch ? <FaPlug /> : <FaLightbulb />}
                                </DeviceIcon>
                                <DeviceName title={device.name}>{device.name}</DeviceName>
                                <DeviceInfo>{device.product_name}</DeviceInfo>

                                {/* Sensor Data Display */}
                                {isSensor && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        {temp && (
                                            <SensorValue>
                                                <FaThermometerHalf color="#e53e3e" />
                                                <span>{(typeof temp.value === 'number') ? (temp.value / 10).toFixed(1) : temp.value}°C</span>
                                            </SensorValue>
                                        )}
                                        {hum && (
                                            <SensorValue>
                                                <FaTint color="#3182ce" />
                                                <span>{hum.value}%</span>
                                            </SensorValue>
                                        )}
                                        {alert && (
                                            <div style={{
                                                marginTop: '0.5rem',
                                                color: '#e53e3e',
                                                fontSize: '0.8rem',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <FaExclamationTriangle /> {alert}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Switch Control */}
                                {isSwitch && showControls && (
                                    <ControlButton
                                        $isOn={isOn}
                                        onClick={(e) => { e.stopPropagation(); handleToggle(device); }}
                                        disabled={!device.online}
                                    >
                                        <FaPowerOff /> {isOn ? 'Encendido' : 'Apagado'}
                                    </ControlButton>
                                )}
                            </DeviceCard>
                        );
                    })}
                    {filteredDevices.length === 0 && !loading && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#a0aec0', padding: '1rem', border: '1px dashed #cbd5e0', borderRadius: '0.5rem' }}>
                            {roomId
                                ? 'No hay sensor asignado a esta sala.'
                                : (mode === 'sensors' ? 'No hay sensores disponibles.' : 'No se encontraron dispositivos.')
                            }
                        </div>
                    )}
                </DeviceGrid>
            )}

            {/* Modal */}
            {selectedDevice && (
                <DeviceDetailModal
                    device={selectedDevice}
                    onClose={() => setSelectedDevice(null)}
                />
            )}
        </Container>
    );
};

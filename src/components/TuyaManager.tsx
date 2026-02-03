
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
}



// ...

export const TuyaManager: React.FC<TuyaManagerProps> = ({ mode = 'full' }) => {
    const [devices, setDevices] = useState<TuyaDevice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<TuyaDevice | null>(null);

    const loadDevices = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await tuyaService.getDevices();
            setDevices(data);
        } catch (err: any) {
            console.error(err); // debug
            setError("Error al cargar dispositivos. Verifica las credenciales.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDevices();
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

    // Helper to extract sensor data
    const getSensorData = (status: any[]) => {
        const temp = status.find(s => s.code.includes('temp'));
        const hum = status.find(s => s.code.includes('humid'));
        return { temp, hum };
    };

    // Filter devices based on mode
    const filteredDevices = devices.filter(device => {
        const { temp, hum } = getSensorData(device.status);
        const switchStatus = device.status.find(s => s.code.startsWith('switch'));

        if (mode === 'sensors') return !!(temp || hum); // Only show if it has sensor data
        if (mode === 'switches') return !!switchStatus; // Only show if it has a switch
        return true; // 'full' shows everything
    });


    // Load settings for alerts
    const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});

    useEffect(() => {
        const loadSettings = async () => {
            const { data } = await import('../services/supabaseClient').then(m => m.supabase!.from('tuya_device_settings').select('*'));
            if (data) {
                const map: Record<string, any> = {};
                data.forEach((s: any) => map[s.device_id] = s);
                setSettingsMap(map);
            }
        };
        loadSettings();
    }, []);

    const getAlertStatus = (device: TuyaDevice) => {
        const setting = settingsMap[device.id];
        if (!setting) return null;

        const { temp, hum } = getSensorData(device.status);
        let alert = null;

        if (temp) {
            const tempVal = (typeof temp.value === 'number' && temp.value > 50) ? (temp.value / 10) : temp.value; // Normalize
            if (setting.max_temp && tempVal > setting.max_temp) alert = 'Temperatura Alta';
            if (setting.min_temp && tempVal < setting.min_temp) alert = 'Temperatura Baja';
        }
        if (hum) {
            const humVal = hum.value;
            if (setting.max_hum && humVal > setting.max_hum) alert = alert ? `${alert} / Humedad Alta` : 'Humedad Alta';
            if (setting.min_hum && humVal < setting.min_hum) alert = alert ? `${alert} / Humedad Baja` : 'Humedad Baja';
        }
        return alert;
    };

    if (loading && devices.length === 0) return <LoadingSpinner text="Cargando dispositivos..." />;

    return (
        <Container>
            <Header>
                <h3>
                    {mode === 'sensors' ? 'Monitoreo Ambiental (Tuya)' : 'Dispositivos Tuya (IoT)'}
                </h3>
                <RefreshButton onClick={loadDevices} title="Actualizar">
                    <FaSync className={loading ? 'fa-spin' : ''} />
                </RefreshButton>
            </Header>

            {error ? (
                <div style={{ color: '#e53e3e', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaExclamationTriangle /> {error}
                </div>
            ) : (
                <DeviceGrid>
                    {filteredDevices.map(device => {
                        const switchStatus = device.status.find(s => s.code.startsWith('switch'));
                        const isSwitch = !!switchStatus;
                        const isOn = switchStatus ? switchStatus.value : false;
                        const { temp, hum } = getSensorData(device.status);
                        const isSensor = temp || hum;
                        const alert = getAlertStatus(device);

                        const showControls = mode !== 'sensors';

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
                                                <span>{(typeof temp.value === 'number' && temp.value > 50) ? (temp.value / 10).toFixed(1) : temp.value}°C</span>
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

                                {/* Switch Control - Start */}
                                {isSwitch && showControls && (
                                    <ControlButton
                                        $isOn={isOn}
                                        onClick={(e) => { e.stopPropagation(); handleToggle(device); }}
                                        disabled={!device.online}
                                    >
                                        <FaPowerOff /> {isOn ? 'Encendido' : 'Apagado'}
                                    </ControlButton>
                                )}
                                {/* Switch Control - End */}
                            </DeviceCard>
                        );
                    })}
                    {filteredDevices.length === 0 && !loading && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#a0aec0', padding: '1rem' }}>
                            {mode === 'sensors' ? 'No hay sensores disponibles.' : 'No se encontraron dispositivos.'}
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

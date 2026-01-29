import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  location: string;
  status: 'in' | 'out' | 'complete';
  timestamp: number; // Timestamp local para ordenamiento
}

interface TimeClockState {
  records: TimeRecord[];
  todayRecord: TimeRecord | null;
  isLoading: boolean;
  error: string | null;
}

type TimeClockAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_RECORD'; payload: TimeRecord }
  | { type: 'UPDATE_RECORD'; payload: TimeRecord }
  | { type: 'SET_RECORDS'; payload: TimeRecord[] }
  | { type: 'SET_TODAY_RECORD'; payload: TimeRecord | null };

const initialState: TimeClockState = {
  records: [],
  todayRecord: null,
  isLoading: false,
  error: null,
};

const timeClockReducer = (state: TimeClockState, action: TimeClockAction): TimeClockState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'ADD_RECORD':
      return {
        ...state,
        records: [action.payload, ...state.records],
        todayRecord: action.payload.date === new Date().toISOString().split('T')[0] ? action.payload : state.todayRecord
      };
    
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map(record => 
          record.id === action.payload.id ? action.payload : record
        ),
        todayRecord: action.payload.date === new Date().toISOString().split('T')[0] ? action.payload : state.todayRecord
      };
    
    case 'SET_RECORDS':
      return {
        ...state,
        records: action.payload,
        todayRecord: action.payload.find(record => 
          record.date === new Date().toISOString().split('T')[0]
        ) || null
      };
    
    case 'SET_TODAY_RECORD':
      return { ...state, todayRecord: action.payload };
    
    default:
      return state;
  }
};

interface TimeClockContextType {
  state: TimeClockState;
  clockIn: (employeeId: string, employeeName: string, location: string) => Promise<TimeRecord>;
  clockOut: (recordId: string) => Promise<TimeRecord>;
  getRecords: () => TimeRecord[];
  getTodayRecord: () => TimeRecord | null;
  canClockIn: () => boolean;
  canClockOut: () => boolean;
  exportRecords: () => void;
}

const TimeClockContext = createContext<TimeClockContextType | undefined>(undefined);

export const useTimeClock = () => {
  const context = useContext(TimeClockContext);
  if (!context) {
    throw new Error('useTimeClock debe ser usado dentro de TimeClockProvider');
  }
  return context;
};

interface TimeClockProviderProps {
  children: ReactNode;
}

export const TimeClockProvider: React.FC<TimeClockProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(timeClockReducer, initialState);

  // Cargar registros desde localStorage al inicializar
  useEffect(() => {
    const loadRecords = () => {
      try {
        const savedRecords = localStorage.getItem('timeClockRecords');
        if (savedRecords) {
          const records: TimeRecord[] = JSON.parse(savedRecords);
          dispatch({ type: 'SET_RECORDS', payload: records });
        }
      } catch (error) {
        console.error('Error al cargar registros:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Error al cargar registros' });
      }
    };

    loadRecords();
  }, []);

  // Guardar registros en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem('timeClockRecords', JSON.stringify(state.records));
    } catch (error) {
      console.error('Error al guardar registros:', error);
    }
  }, [state.records]);

  // Función para obtener fecha y hora local
  const getLocalDateTime = () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    const timestamp = now.getTime();
    
    return { date, time, timestamp };
  };

  // Fichar entrada
  const clockIn = async (employeeId: string, employeeName: string, location: string): Promise<TimeRecord> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { date, time, timestamp } = getLocalDateTime();
      
      const newRecord: TimeRecord = {
        id: `record_${timestamp}`,
        employeeId,
        employeeName,
        date,
        timeIn: time,
        timeOut: null,
        location,
        status: 'in',
        timestamp
      };

      dispatch({ type: 'ADD_RECORD', payload: newRecord });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return newRecord;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al registrar fichaje de entrada' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Fichar salida
  const clockOut = async (recordId: string): Promise<TimeRecord> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const record = state.records.find(r => r.id === recordId);
      if (!record) {
        throw new Error('Registro no encontrado');
      }

      const { time } = getLocalDateTime();
      
      const updatedRecord: TimeRecord = {
        ...record,
        timeOut: time,
        status: 'complete'
      };

      dispatch({ type: 'UPDATE_RECORD', payload: updatedRecord });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return updatedRecord;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Error al registrar fichaje de salida' });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Obtener todos los registros
  const getRecords = (): TimeRecord[] => {
    return state.records.sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero
  };

  // Obtener registro de hoy
  const getTodayRecord = (): TimeRecord | null => {
    return state.todayRecord;
  };

  // Verificar si puede fichar entrada
  const canClockIn = (): boolean => {
    return !!(state.todayRecord && state.todayRecord.status === 'complete') || !state.todayRecord;
  };

  // Verificar si puede fichar salida
  const canClockOut = (): boolean => {
    return !!(state.todayRecord && state.todayRecord.status === 'in');
  };

  // Exportar registros
  const exportRecords = () => {
    try {
      const records = getRecords();
      const csvContent = [
        ['Fecha', 'Entrada', 'Salida', 'Ubicación', 'Estado', 'Empleado'],
        ...records.map(record => [
          new Date(record.date).toLocaleDateString('es-AR'),
          record.timeIn || '-',
          record.timeOut || '-',
          record.location,
          record.status === 'in' ? 'En trabajo' : 
          record.status === 'out' ? 'Salida' : 'Completo',
          record.employeeName
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fichajes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error al exportar registros' });
    }
  };

  const value: TimeClockContextType = {
    state,
    clockIn,
    clockOut,
    getRecords,
    getTodayRecord,
    canClockIn,
    canClockOut,
    exportRecords
  };

  return (
    <TimeClockContext.Provider value={value}>
      {children}
    </TimeClockContext.Provider>
  );
};

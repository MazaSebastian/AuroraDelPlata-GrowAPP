import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Crop, Task } from '../types';
import { Room } from '../types/rooms';
import { tasksService } from '../services/tasksService';
import { cropsService } from '../services/cropsService';
import { roomsService } from '../services/roomsService';
import { stickiesService } from '../services/stickiesService';
import { useAuth } from './AuthContext';

interface DataContextType {
    crops: Crop[];
    rooms: Room[];
    tasks: Task[];
    stickies: any[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    updateTasks: () => Promise<void>;
    updateCrops: () => Promise<void>;
    updateRooms: () => Promise<void>;
    updateStickies: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};

interface DataProviderProps {
    children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stickies, setStickies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCrops = useCallback(async () => {
        try {
            const data = await cropsService.getCrops();
            setCrops(data);
        } catch (e) {
            console.error("Error fetching crops", e);
        }
    }, []);

    const fetchRooms = useCallback(async () => {
        try {
            const data = await roomsService.getRooms();
            setRooms(data);
        } catch (e) {
            console.error("Error fetching rooms", e);
        }
    }, []);

    const fetchTasks = useCallback(async () => {
        try {
            const data = await tasksService.getPendingTasks();
            setTasks(data);
        } catch (e) {
            console.error("Error fetching tasks", e);
        }
    }, []);

    const fetchStickies = useCallback(async () => {
        try {
            const data = await stickiesService.getStickies();
            setStickies(data);
        } catch (e) {
            console.error("Error fetching stickies", e);
        }
    }, []);

    const refreshData = useCallback(async () => {
        // Should we set loading true here? Maybe not for silent refresh.
        // For initial load, we want to know when it's done.
        await Promise.all([
            fetchCrops(),
            fetchRooms(),
            fetchTasks(),
            fetchStickies()
        ]);
    }, [fetchCrops, fetchRooms, fetchTasks, fetchStickies]);

    // Initial Load
    useEffect(() => {
        if (user) {
            setIsLoading(true);
            refreshData().finally(() => setIsLoading(false));
        } else {
            // If no user, maybe clear data or keep loading false
            setIsLoading(false);
        }
    }, [user, refreshData]);

    const value: DataContextType = {
        crops,
        rooms,
        tasks,
        stickies,
        isLoading,
        refreshData,
        updateTasks: fetchTasks,
        updateCrops: fetchCrops,
        updateRooms: fetchRooms,
        updateStickies: fetchStickies
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

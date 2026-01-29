import { supabase } from './supabaseClient';
import { Task } from '../types';
import { notificationService } from './notificationService';

export interface CreateTaskInput {
    title: string;
    description?: string;
    type: 'info' | 'warning' | 'danger' | 'fertilizante' | 'defoliacion' | 'poda_apical' | 'hst' | 'lst' | 'enmienda' | 'te_compost' | 'agua';
    due_date?: string;
    crop_id?: string;
}

export const tasksService = {
    async getPendingTasks(): Promise<Task[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_tasks')
            .select('*')
            .neq('status', 'dismissed')
            .neq('status', 'done')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }

        return data as Task[];
    },

    async createTask(task: CreateTaskInput): Promise<Task | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('chakra_tasks')
            .insert([{
                title: task.title,
                description: task.description,
                type: task.type,
                due_date: task.due_date,
                crop_id: task.crop_id,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return null;
        }

        if (data) {
            // Notification logic removed as per user request (Only completion notifications active)
        }

        return data as Task;
    },

    async updateStatus(id: string, status: 'pending' | 'done' | 'dismissed'): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_tasks')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Error updating task status:', error);
            return false;
        }

        // Send Notification if marked as DONE
        if (status === 'done') {
            // Fetch task details for notification
            const { data: taskData } = await supabase
                .from('chakra_tasks')
                .select('title')
                .eq('id', id)
                .single();

            if (taskData) {
                // Get Current User
                const { data: { user } } = await supabase.auth.getUser();
                const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

                notificationService.sendSelfNotification(
                    `Tarea Completada (${userName})`,
                    `✅ ${taskData.title}`
                );
            }
        }

        return true;
    },

    async updateTask(id: string, updates: Partial<CreateTaskInput>): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_tasks')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error);
            return false;
        }
        return true;
    },

    async deleteTask(id: string): Promise<boolean> {
        if (!supabase) return false;

        const { error } = await supabase
            .from('chakra_tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
            return false;
        }
        return true;
    },

    async getTasksByCropId(cropId: string): Promise<Task[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_tasks')
            .select('*')
            .eq('crop_id', cropId);

        if (error) {
            console.error('Error fetching tasks for crop:', error);
            return [];
        }

        return data as Task[];
    }
};

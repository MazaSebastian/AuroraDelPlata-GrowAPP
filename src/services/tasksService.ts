import { supabase } from './supabaseClient';
import { Task, CreateTaskInput } from '../types';
import { notificationService } from './notificationService';
import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns';

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
                room_id: task.room_id,
                assigned_to: task.assigned_to,
                status: 'pending',
                observations: task.observations,
                photos: task.photos,
                recurrence: task.recurrence
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return null;
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
            // Fetch task details for notification and recurrence
            const { data: taskData } = await supabase
                .from('chakra_tasks')
                .select('title, recurrence, due_date, description, type, crop_id, room_id')
                .eq('id', id)
                .single();

            if (taskData) {
                // Determine User for Notification
                const { data: { user } } = await supabase.auth.getUser();
                const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Alguien';

                notificationService.sendSelfNotification(
                    `Tarea Completada (${userName})`,
                    `✅ ${taskData.title}`
                );

                // Handle Recurrence
                if (taskData.recurrence) {
                    const rec = taskData.recurrence as any;
                    let nextDate: Date | null = null;
                    const currentDate = taskData.due_date ? parseISO(taskData.due_date) : new Date();

                    if (rec.type === 'custom' || rec.type === 'daily' || rec.type === 'weekly') {
                        const interval = rec.interval || 1;
                        if (rec.unit === 'day' || rec.type === 'daily') {
                            nextDate = addDays(currentDate, interval);
                        } else if (rec.unit === 'week' || rec.type === 'weekly') {
                            nextDate = addWeeks(currentDate, interval);
                        } else if (rec.unit === 'month') {
                            nextDate = addMonths(currentDate, interval);
                        }
                    }

                    if (nextDate) {
                        await this.createTask({
                            title: taskData.title,
                            description: taskData.description,
                            type: taskData.type,
                            due_date: format(nextDate, 'yyyy-MM-dd'),
                            crop_id: taskData.crop_id,
                            room_id: taskData.room_id,
                            recurrence: rec // Pass recurrence to next task to continue chain
                        });
                    }
                }
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
    },

    async getTasksByRoomId(roomId: string): Promise<Task[]> {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('chakra_tasks')
            .select('*')
            .eq('room_id', roomId)
            .neq('status', 'dismissed');

        if (error) {
            console.error('Error fetching tasks for room:', error);
            return [];
        }

        return data as Task[];
    }
};

-- Add recurrence column to chakra_tasks
-- Schema: { type: 'daily'|'weekly'|'custom', interval: number, days?: number[], end?: { type: 'never'|'date'|'count', value?: string|number }, count?: number }
ALTER TABLE chakra_tasks
ADD COLUMN recurrence JSONB;

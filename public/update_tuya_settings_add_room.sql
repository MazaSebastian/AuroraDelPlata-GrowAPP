-- Add room_id to tuya_device_settings to link devices to rooms
ALTER TABLE tuya_device_settings 
ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL;

-- Comment
COMMENT ON COLUMN tuya_device_settings.room_id IS 'Link to the internal Room ID where this device is installed';

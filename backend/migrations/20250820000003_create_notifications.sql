-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- Add some sample notification types as comments for reference
-- Notification types:
-- 'task_due_soon' - Task is due within configured time
-- 'task_assigned' - New task has been assigned
-- 'task_completed' - Task has been completed
-- 'task_overdue' - Task is overdue
-- 'task_priority_changed' - Task priority has been updated

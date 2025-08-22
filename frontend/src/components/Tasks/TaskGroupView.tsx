import React from 'react';
import type { Task } from '../../types/index';
import { TaskCard } from './TaskCard';

interface TaskGroupViewProps {
  groupedTasks: { [key: string]: Task[] };
  onEditTask: (task: Task) => void;
}

export const TaskGroupView: React.FC<TaskGroupViewProps> = ({
  groupedTasks,
  onEditTask,
}) => {
  const groupKeys = Object.keys(groupedTasks);

  if (groupKeys.length === 1 && groupKeys[0] === 'All tasks') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {groupedTasks['All tasks'].map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {groupKeys.map((groupKey) => {
        const tasks = groupedTasks[groupKey];
        if (tasks.length === 0) return null;

        return (
          <div key={groupKey} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {groupKey}
                <span style={{ fontSize: '0.875rem', fontWeight: '400', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Group status indicator */}
                {groupKey.includes('Overdue') && (
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    ⚠️ Attention required
                  </span>
                )}
                {groupKey.includes('Hoy') && (
                  <span style={{ fontSize: '0.75rem', color: '#d97706', backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    🕐 Due today
                  </span>
                )}
                {groupKey.includes('Completado') && (
                  <span style={{ fontSize: '0.75rem', color: '#059669', backgroundColor: '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                    ✅ Completed
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
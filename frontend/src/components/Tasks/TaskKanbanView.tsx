import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../../types/index';

interface TaskKanbanViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  emoji: string;
}

const columns: KanbanColumn[] = [
  { id: 'todo', title: 'Por Hacer', color: '#ef4444', emoji: '📋' },
  { id: 'doing', title: 'En Progreso', color: '#f59e0b', emoji: '⚡' },
  { id: 'done', title: 'Completado', color: '#10b981', emoji: '✅' }
];

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onStatusChange 
}) => {
  const [showHelp, setShowHelp] = React.useState(false);
  const [optimisticTasks, setOptimisticTasks] = React.useState<Task[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [justDropped, setJustDropped] = React.useState(false);

  // Sync optimistic state with props immediately
  React.useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  // Debug: Monitor isUpdating state changes
  React.useEffect(() => {
    console.log('🔍 isUpdating changed to:', isUpdating);
    if (isUpdating) {
      console.log('⚡ SPINNER ACTIVATED - verify it\'s from drop and not scroll');
      console.log('⚡ Task being processed:', draggedTaskId);
      console.log('⚡ Just dropped:', justDropped);
    } else {
      console.log('⚡ SPINNER DEACTIVATED');
    }
  }, [isUpdating, draggedTaskId, justDropped]);

  // Control scroll during drag
  React.useEffect(() => {
    console.log('📜 Scroll control effect triggered - isDragging:', isDragging);
    if (isDragging) {
      document.body.classList.add('dragging-active');
      document.documentElement.style.overflow = 'hidden';
      console.log('📜 Scroll disabled due to drag');
    } else {
      document.body.classList.remove('dragging-active');
      document.documentElement.style.overflow = '';
      console.log('📜 Scroll re-enabled');
    }
    
    return () => {
      document.body.classList.remove('dragging-active');
      document.documentElement.style.overflow = '';
      console.log('📜 Scroll cleanup executed');
    };
  }, [isDragging]);

  const handleDragStart = (start: any) => {
    setIsDragging(true);
    setDraggedTaskId(start.draggableId);
    console.log('🎯 Drag started - sin activar overlay todavía, task:', start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDraggedTaskId(null);
    console.log('🎯 Drag ended - scroll enabled');
    
    const { destination, source, draggableId } = result;

    if (!destination) {
      console.log('🚫 Drag cancelled - no destination');
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('🚫 Drag cancelled - same position');
      return;
    }

    console.log('✅ VALID DROP DETECTED - activating spinner now');
    setJustDropped(true);
    setIsUpdating(true);
    console.log('🔒 Card dropped - activating overlay immediately');
    console.log('📍 Stack trace for spinner activation:', new Error().stack);

    // Safety timeout - force reset after 10 seconds if something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout triggered - forcing spinner reset');
      setIsUpdating(false);
      setJustDropped(false);
    }, 10000);

    const newStatus = destination.droppableId as TaskStatus;
    
    console.log('🔄 Processing Drag and Drop:', {
      taskId: draggableId,
      from: source.droppableId,
      to: destination.droppableId,
      newStatus,
      fromIndex: source.index,
      toIndex: destination.index
    });

    // Immediate optimistic update - update UI instantly
    setOptimisticTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => 
        task.id === draggableId 
          ? { ...task, status: newStatus, updated_at: new Date().toISOString() }
          : task
      );
      console.log('✅ Optimistic update applied immediately');
      return updatedTasks;
    });

    // Overlay ya está activo desde que se soltó la tarjeta
    console.log('🔒 Continuando con sincronización - overlay activo desde drop');
    
    // Call the parent handler for server update (async)
    const updatePromise = onStatusChange(draggableId, newStatus);
    
    // Ensure minimum display time of 1.5 seconds for better UX
    const minimumDelay = new Promise(resolve => setTimeout(resolve, 1500));
    
    // Wait for both the update to complete AND minimum time to pass
    Promise.allSettled([
      updatePromise,
      minimumDelay
    ]).then((results) => {
      // Clear safety timeout
      clearTimeout(safetyTimeout);
      
      const [updateResult] = results;
      
      if (updateResult.status === 'fulfilled') {
        console.log('✅ Sincronización completada exitosamente');
      } else {
        console.error('❌ Error en sincronización:', updateResult.reason);
      }
      
      // Always hide the overlay after both conditions are met
      setIsUpdating(false);
      setJustDropped(false);
      console.log('🔓 Vista desbloqueada');
    });
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return optimisticTasks.filter(task => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'med': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Full view blocking overlay - Only show if actually just dropped */}
      {isUpdating && justDropped && (
        <div 
          className="kanban-view-blocking-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            borderRadius: '0.75rem',
            pointerEvents: 'all',
            cursor: 'wait'
          }}
        >
          <div 
            className="kanban-view-blocking-content"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(255, 255, 255, 0.7)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '1px solid rgba(226, 232, 240, 0.6)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              userSelect: 'none',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{
              width: '3rem',
              height: '3rem',
              border: '4px solid rgba(59, 130, 246, 0.2)',
              borderTop: '4px solid rgba(59, 130, 246, 0.8)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}></div>
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text)'
            }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.125rem', 
                fontWeight: '600',
                color: 'var(--color-primary-700)' 
              }}>
                🔄 Actualizando Tarea
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: 'var(--color-text-muted)' 
              }}>
                Sincronizando cambios con el servidor...
              </p>
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                opacity: 0.8
              }}>
                Por favor espere...
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '0.5rem',
        background: 'var(--color-surface)',
        borderRadius: '0.5rem',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📋</span>
          <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Kanban Board</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Drag tasks between columns to change their status
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
              border: '1px solid var(--color-primary-200)',
              borderRadius: '0.375rem',
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {showHelp ? '❌ Ocultar ayuda' : '❓ ¿Cómo usar?'}
          </button>
        </div>
      </div>

      {showHelp && (
        <div style={{
          background: 'var(--color-primary-50)',
          border: '1px solid var(--color-primary-200)',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: 'var(--color-text)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary-700)' }}>
            🎯 Instrucciones de Drag & Drop
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>📱 <strong>Arrastra</strong> cualquier tarjeta de tarea con el mouse</li>
            <li>🎯 <strong>Suelta</strong> la tarjeta en una columna diferente</li>
            <li>✅ El estado de la tarea se actualizará automáticamente</li>
            <li>🔄 Los cambios se sincronizan con el servidor en tiempo real</li>
          </ul>
        </div>
      )}

      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem',
          height: 'calc(100vh - 400px)',
          minHeight: '500px'
        }}>
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <div
                key={column.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderTop: `3px solid ${column.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 4px var(--shadow-color)'
                }}
              >
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '0.75rem 0.75rem 0 0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>{column.emoji}</span>
                      {column.title}
                    </h3>
                    <span style={{
                      backgroundColor: `${column.color}20`,
                      color: column.color,
                      padding: '0.25rem 0.5rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        padding: '1rem',
                        backgroundColor: snapshot.isDraggingOver ? 'var(--color-primary-50)' : 'transparent',
                        border: snapshot.isDraggingOver ? '2px dashed var(--color-primary-300)' : '2px dashed transparent',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease',
                        minHeight: '200px',
                        position: 'relative'
                      }}
                    >
                      {snapshot.isDraggingOver && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'var(--color-primary-600)',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          opacity: 0.7,
                          pointerEvents: 'none',
                          zIndex: 1
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📥</div>
                            Drop here to change to "{column.title}"
                          </div>
                        </div>
                      )}

                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                marginBottom: '0.75rem',
                                backgroundColor: snapshot.isDragging ? 'var(--color-primary-50)' : 'var(--color-surface)',
                                borderRadius: '0.5rem',
                                border: snapshot.isDragging ? '2px solid var(--color-primary-400)' : '1px solid var(--color-border)',
                                padding: '1rem',
                                cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} rotate(5deg) scale(1.02)` 
                                  : provided.draggableProps.style?.transform || 'none',
                                boxShadow: snapshot.isDragging 
                                  ? '0 10px 25px var(--shadow-color), 0 0 0 1px var(--color-primary-200)' 
                                  : '0 2px 4px var(--shadow-color)',
                                transition: snapshot.isDragging ? 'none' : 'transform 0.2s ease, all 0.2s ease',
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                zIndex: snapshot.isDragging ? 9999 : 'auto',
                                position: snapshot.isDragging ? 'relative' : 'static'
                              }}
                            >
                              {snapshot.isDragging && (
                                <div style={{
                                  position: 'absolute',
                                  top: '0.5rem',
                                  right: '0.5rem',
                                  color: 'var(--color-primary-500)',
                                  fontSize: '1rem'
                                }}>
                                  🎯
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h4 style={{
                                  margin: 0,
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  color: 'var(--color-text)',
                                  lineHeight: '1.25',
                                  flex: 1
                                }}>
                                  {task.title}
                                </h4>
                                
                                <div style={{
                                  width: '0.5rem',
                                  height: '0.5rem',
                                  borderRadius: '50%',
                                  backgroundColor: getPriorityColor(task.priority),
                                  marginLeft: '0.5rem',
                                  flexShrink: 0
                                }} />
                              </div>

                              {task.description && (
                                <p style={{
                                  margin: '0 0 0.75rem 0',
                                  fontSize: '0.75rem',
                                  color: 'var(--color-text-muted)',
                                  lineHeight: '1.4',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  lineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {task.description}
                                </p>
                              )}

                              {task.tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                                  {task.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      style={{
                                        padding: '0.125rem 0.375rem',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.625rem',
                                        backgroundColor: 'var(--color-primary-100)',
                                        color: 'var(--color-primary-700)',
                                        fontWeight: '500'
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {task.tags.length > 3 && (
                                    <span style={{
                                      fontSize: '0.625rem',
                                      color: 'var(--color-text-muted)',
                                      fontWeight: '500'
                                    }}>
                                      +{task.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  {task.due_date && (
                                    <span style={{
                                      fontSize: '0.625rem',
                                      color: isOverdue(task.due_date) ? '#dc2626' : 'var(--color-text-muted)',
                                      fontWeight: isOverdue(task.due_date) ? '600' : '400',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      <span>{isOverdue(task.due_date) ? '⚠️' : '📅'}</span>
                                      {formatDate(task.due_date)}
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditTask(task);
                                    }}
                                    style={{
                                      padding: '0.25rem',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      backgroundColor: 'var(--color-surface-hover)',
                                      color: 'var(--color-text)',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Editar tarea"
                                  >
                                    <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTask(task.id);
                                    }}
                                    style={{
                                      padding: '0.25rem',
                                      border: 'none',
                                      borderRadius: '0.25rem',
                                      backgroundColor: '#fef2f2',
                                      color: '#dc2626',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Eliminar tarea"
                                  >
                                    <svg style={{ width: '0.75rem', height: '0.75rem' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {columnTasks.length === 0 && (
                        <div style={{
                          textAlign: 'center',
                          padding: '2rem 1rem',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{column.emoji}</div>
                          Arrastra tareas aquí
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Task {
  id: string;
  status: TaskStatus;
  progress: number;
  duration: number;
  created_at: Date;
  updated_at: Date;
}

export interface TaskNotification {
  taskId: string;
  status: TaskStatus;
  progress: number;
}

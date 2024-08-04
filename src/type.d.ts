interface KanbanType {
  id?: string;
  partNumber?: string;
  partName?: string;
  componentName?: string;
  quantity?: number;
  planStart?: string | null;
  status?: 'queue' | 'progress' | 'done';
  type?: 'production' | 'withdrawal';
}

export interface KanbanFilterType {
  queue: KanbanType[];
  progress: KanbanType[];
  done: KanbanType[];
}
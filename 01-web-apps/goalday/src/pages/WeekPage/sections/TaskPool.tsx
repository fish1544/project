import { useState } from 'react';
import { Plus, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { ITask } from '@/data/types';
import TaskRow from './TaskRow';

interface TaskPoolProps {
  tasks: ITask[];
  onQuickAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveToday: (id: string) => void;
}

export default function TaskPool({ tasks, onQuickAdd, onToggle, onDelete, onMoveToday }: TaskPoolProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  function commitQuickAdd() {
    const trimmed = draft.trim();
    if (trimmed) {
      onQuickAdd(trimmed);
      setDraft('');
      setAdding(false);
    }
  }

  return (
    <div className="flex h-fit flex-col rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Inbox className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">待办池</h2>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <p className="mb-2 px-1 text-xs text-muted-foreground">未安排的任务，拖到左侧格子安排到某一天</p>
      {tasks.length === 0 && !adding ? (
        <div className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          待办池是空的
          <br />
          输入文字直接添加
        </div>
      ) : (
        <div className="space-y-0.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onMoveToday={onMoveToday}
            />
          ))}
        </div>
      )}
      {adding ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitQuickAdd();
            } else if (e.key === 'Escape') {
              setAdding(false);
              setDraft('');
            }
          }}
          onBlur={() => {
            setAdding(false);
            setDraft('');
          }}
          placeholder="输入任务，回车添加"
          className="mt-2 h-8 text-xs"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1 self-start rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          添加任务
        </button>
      )}
    </div>
  );
}

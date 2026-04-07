"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import type { Alliance } from "../types";

export type RankingTeam = { teamNumber: number; teamName: string };

interface SortableRankingListProps {
  teams: RankingTeam[];
  alliance: Alliance;
  onReorder: (teams: RankingTeam[]) => void;
}

export function SortableRankingList({ teams, onReorder }: SortableRankingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = teams.map((t) => t.teamNumber);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    onReorder(arrayMove(teams, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col divide-y divide-border rounded-lg overflow-hidden border">
          {teams.map((t) => (
            <SortableTeamRow key={t.teamNumber} teamNumber={t.teamNumber} teamName={t.teamName} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableTeamRow({ teamNumber, teamName }: { teamNumber: number; teamName: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: teamNumber,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-4 px-4 py-3 bg-card select-none cursor-grab active:cursor-grabbing
        first:rounded-t-lg last:rounded-b-lg
        ${isDragging ? "opacity-80 shadow-lg z-10 ring-1 ring-primary/20" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-5 text-muted-foreground/40 shrink-0" />
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums leading-tight">{teamNumber}</p>
        <p className="text-sm text-muted-foreground truncate">{teamName}</p>
      </div>
    </div>
  );
}

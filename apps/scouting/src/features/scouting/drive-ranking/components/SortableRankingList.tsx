"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
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
import { Card } from "@repo/ui/components/card";
import { GripVerticalIcon } from "lucide-react";

interface SortableRankingListProps {
  teamNumbers: number[];
  onReorder: (teamNumbers: number[]) => void;
}

export function SortableRankingList({ teamNumbers, onReorder }: SortableRankingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = teamNumbers.indexOf(Number(active.id));
    const newIndex = teamNumbers.indexOf(Number(over.id));
    onReorder(arrayMove(teamNumbers, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={teamNumbers} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {teamNumbers.map((teamNumber, index) => (
            <SortableTeamCard key={teamNumber} teamNumber={teamNumber} rank={index + 1} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableTeamCard({ teamNumber, rank }: { teamNumber: number; rank: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: teamNumber,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rankLabel = rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 select-none ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-5" />
      </button>
      <span className="text-sm font-mono text-muted-foreground w-8">{rankLabel}</span>
      <span className="font-semibold tabular-nums">Team {teamNumber}</span>
    </Card>
  );
}

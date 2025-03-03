"use client";

import { useState } from "react";
import { formatTime } from "../utils/formatTime";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Segment {
  id: string;
  start: number;
  end: number;
}

interface SplitComponentProps {
  segments: Segment[];
  setSegments: React.Dispatch<React.SetStateAction<Segment[]>>;
  videoDuration: number;
  thumbnails: string[];
  isSplitBarVisible: boolean;
  setIsSplitBarVisible: (visible: boolean) => void;
  splitBarPosition: number | null;
  setSplitBarPosition: (position: number | null) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  getActiveDuration: () => number;
}

// Draggable Segment Component
function SortableSegment({
  id,
  start,
  end,
  thumbnail,
  videoDuration,
}: {
  id: string;
  start: number;
  end: number;
  thumbnail: string;
  videoDuration: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "pointer", // Add pointer cursor
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: `${((end - start) / videoDuration) * 100}%`,
        marginRight: "10px", // Add 10px gap between segments
        backgroundImage: `url(${thumbnail})`,
      }}
      {...attributes}
      {...listeners}
      className="flex-shrink-0 h-20 bg-cover bg-center relative"
    >
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center text-sm p-1">
        {formatTime(start)} - {formatTime(end)}
      </div>
    </div>
  );
}

export default function SplitComponent({
  segments,
  setSegments,
  videoDuration,
  thumbnails,
  isSplitBarVisible,
  setIsSplitBarVisible,
  splitBarPosition,
  setSplitBarPosition,
  timelineRef,
  getActiveDuration,
}: SplitComponentProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSegments((prevSegments: Segment[]) => {
        const oldIndex = prevSegments.findIndex(
          (segment) => segment.id === active.id
        );
        const newIndex = prevSegments.findIndex(
          (segment) => segment.id === over.id
        );
        return arrayMove(prevSegments, oldIndex, newIndex);
      });
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || !isSplitBarVisible) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const duration = getActiveDuration();
    const splitTime = (x / rect.width) * duration;

    setSplitBarPosition(splitTime);
  };

  const handleSplit = () => {
    if (splitBarPosition === null) return;

    const newSegmentId = `segment-${segments.length + 1}`;
    const newSegment: Segment = {
      id: newSegmentId,
      start: splitBarPosition,
      end: videoDuration,
    };

    const updatedSegments = segments.map((segment) => {
      if (segment.end > splitBarPosition) {
        return { ...segment, end: splitBarPosition };
      }
      return segment;
    });

    setSegments([...updatedSegments, newSegment]);
    setIsSplitBarVisible(false); // Hide the split bar after splitting
    setSplitBarPosition(null); // Reset the split bar position
  };

  return (
    <>
      {/* Split Bar Activation Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => setIsSplitBarVisible(!isSplitBarVisible)}
          className="p-2 bg-blue-500 text-white rounded-full"
        >
          {isSplitBarVisible ? "Hide Split Bar" : "Show Split Bar"}
        </button>
      </div>

      {/* Split Button */}
      {isSplitBarVisible && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSplit}
            className="p-2 bg-green-500 text-white rounded-full"
          >
            Split at{" "}
            {splitBarPosition !== null
              ? formatTime(splitBarPosition)
              : "Selected Position"}
          </button>
        </div>
      )}

      {/* Video Thumbnails */}
      <div
        className="relative w-full mt-4"
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={segments}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex w-full h-20 overflow-x-auto rounded-lg shadow-lg">
              {segments.map((segment) => (
                <SortableSegment
                  key={segment.id}
                  id={segment.id}
                  start={segment.start}
                  end={segment.end}
                  thumbnail={
                    thumbnails[
                      Math.floor(
                        (segment.start / videoDuration) * thumbnails.length
                      )
                    ]
                  }
                  videoDuration={videoDuration}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Split Bar */}
        {isSplitBarVisible && splitBarPosition !== null && (
          <div
            className="absolute top-0 h-full w-1 bg-red-500 cursor-pointer"
            style={{
              left: `${(splitBarPosition / getActiveDuration()) * 100}%`,
            }}
          ></div>
        )}
      </div>
    </>
  );
}

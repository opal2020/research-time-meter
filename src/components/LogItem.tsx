import { useState, useEffect, useRef } from "react";

export type Log = {
  id: string;
  timestamp: Date;
  duration: number;
  description: string;
  notes?: string;
};

type LogItemProps = {
  log: Log;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onSave: (id: string, description: string, notes: string) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  swipedId: string | null;
  onSwipeToggle: (id: string, show: boolean) => void;
};

export default function LogItem({
  log,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  swipedId,
  onSwipeToggle,
}: LogItemProps) {
  const [localDesc, setLocalDesc] = useState(log.description);
  const [localNotes, setLocalNotes] = useState(log.notes || "");
  const [localEdit, setLocalEdit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const moved = useRef(false);

  const handleSave = () => {
    onSave(log.id, localDesc, localNotes);
    setLocalEdit(false);
  };

  const handleCancel = () => {
    setLocalDesc(log.description);
    setLocalNotes(log.notes || "");
    setLocalEdit(false);
    onCancel();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    moved.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      moved.current = true;
      e.preventDefault();
      setDragOffset(Math.max(-160, Math.min(0, dx)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!moved.current || !isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    const endDx = e.changedTouches[0].clientX - startX.current;
    const threshold = 80;
    if (endDx < -threshold) onSwipeToggle(log.id, true);
    else if (endDx > threshold) onSwipeToggle(log.id, false);
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    moved.current = false;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      moved.current = true;
      setDragOffset(Math.max(-160, Math.min(0, dx)));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!moved.current || !isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    const endDx = e.clientX - startX.current;
    const threshold = 80;
    if (endDx < -threshold) onSwipeToggle(log.id, true);
    else onSwipeToggle(log.id, false);
    setIsDragging(false);
    setDragOffset(0);
  };

  useEffect(() => {
    if (isEditing) {
      setLocalDesc(log.description);
      setLocalNotes(log.notes || "");
      setLocalEdit(true);
    } else {
      setLocalEdit(false);
    }
  }, [isEditing, log.description, log.notes]);

  if (localEdit) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "0.75rem",
          borderRadius: "6px",
          marginBottom: "0.5rem",
          border: "2px solid #4299e1",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <input
          type="text"
          value={localDesc}
          onChange={(e) => setLocalDesc(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e0",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
            fontFamily: "inherit",
          }}
          placeholder="Enter description"
        />
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e0",
            fontSize: "0.9rem",
            minHeight: "3rem",
            resize: "vertical",
            marginBottom: "0.5rem",
            fontFamily: "inherit",
          }}
          placeholder="Add notes..."
        />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleSave}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#48bb78",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#a0aec0",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "relative",
        marginBottom: "0.5rem",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {/* 배경 영역들 - Edit(회색), Delete(빨간색) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: "80px",
          width: "80px",
          bottom: 0,
          backgroundColor: "#718096", // 회색 - Edit 영역
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "80px",
          bottom: 0,
          backgroundColor: "#f56565", // 빨간색 - Delete 영역
        }}
      />

      {/* 버튼들 - 각각의 영역 가운데에 배치 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: "80px",
          width: "80px",
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => onEdit(log.id)}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Edit
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "80px",
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => onDelete(log.id)}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Delete
        </button>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "0.75rem",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "6px",
          position: "relative",
          zIndex: 2,
          userSelect: "none",
          cursor: isDragging ? "grabbing" : "grab",
          transform: `translateX(${swipedId === log.id ? -160 : dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            marginBottom: "0.25rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        >
          <span style={{ color: "#4a5568" }}>
            {(() => {
              const endTime = log.timestamp;
              const startTime = new Date(
                endTime.getTime() - log.duration * 1000,
              );
              const formatTime = (date: Date) =>
                date.toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
              return `${formatTime(startTime)} - ${formatTime(endTime)}`;
            })()}{" "}
            •{" "}
          </span>
          <span
            style={{
              color: "#2563eb",
              fontWeight: "600",
            }}
          >
            Duration: {formatTime(log.duration)}
          </span>
        </div>

        <div
          style={{
            fontWeight: "500",
            marginBottom: "0.25rem",
            color: "#2d3748",
            fontFamily: "inherit",
          }}
        >
          {log.description}
        </div>

        {log.notes && (
          <div
            style={{
              fontSize: "0.85rem",
              color: "#718096",
              fontFamily: "inherit",
            }}
          >
            {log.notes}
          </div>
        )}
      </div>
    </div>
  );
}

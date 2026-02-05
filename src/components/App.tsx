import { useState, useEffect, useRef } from "react";
import LogItem, { Log } from "./LogItem";

export default function App() {
  // 파일 핸들러 ref
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  // 파일에서 기록 불러오기
  const handleOpenFile = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });
      fileHandleRef.current = handle;
      const file = await handle.getFile();
      setCurrentFileName(file.name);
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        // timestamp를 Date 객체로 변환
        const parsedLogs = data.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
        setLogs(parsedLogs);
      } else {
        alert("파일 형식이 올바르지 않습니다.");
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        alert("파일을 여는 중 오류가 발생했습니다.");
      }
    }
  };

  // 기록을 파일에 저장
  const handleSaveFile = async () => {
    try {
      let handle = fileHandleRef.current;
      if (!handle) {
        // @ts-ignore
        handle = await window.showSaveFilePicker({
          suggestedName: "research_time_logs.json",
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        fileHandleRef.current = handle;
      }
      if (!currentFileName && handle) {
        const file = await handle.getFile();
        setCurrentFileName(file.name);
      }
      const writable = await handle!.createWritable();
      await writable.write(JSON.stringify(logs, null, 2));
      await writable.close();
      alert("저장되었습니다!");
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        alert("저장 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => setTime((time) => time + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    if (time > 0) {
      const newLog: Log = {
        id: Date.now().toString(),
        timestamp: new Date(),
        duration: time,
        description: description || "Research session",
        notes: notes,
      };
      setLogs((prevLogs) => [newLog, ...prevLogs]);
      setDescription("");
      setNotes("");
    }
    setTime(0);
    setIsRunning(false);
  };

  useEffect(() => {
    const savedLogs = localStorage.getItem("researchTimeLogs");
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      // timestamp를 Date 객체로 변환
      const logsWithDates = parsedLogs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      setLogs(logsWithDates);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("researchTimeLogs", JSON.stringify(logs));
  }, [logs]);

  const updateLog = (id: string, description: string, notes: string) => {
    setLogs((prevLogs) =>
      prevLogs.map((log) =>
        log.id === id ? { ...log, description, notes } : log,
      ),
    );
    setEditingId(null);
  };

  const deleteLog = (id: string) => {
    setLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));
  };

  const handleSwipeToggle = (id: string, show: boolean) => {
    if (show) {
      setSwipedId(id);
    } else {
      setSwipedId(null);
    }
  };

  // 전역 클릭으로 스와이프 상태 해제
  const handleGlobalClick = () => {
    if (swipedId) {
      setSwipedId(null);
    }
  };

  return (
    <div
      onClick={handleGlobalClick}
      style={{
        fontFamily: "Segoe UI, sans-serif",
        padding: "1rem",
        maxWidth: "400px",
        margin: "0 auto",
        backgroundColor: "#f7fafc",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          textAlign: "center",
          marginBottom: "1rem",
          color: "#2d3748",
          fontFamily: "inherit",
        }}
      >
        Research Time Meter
      </h1>

      <div
        style={{
          backgroundColor: "#2d3748",
          color: "#ffffff",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: "1rem",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            letterSpacing: "0.05em",
          }}
        >
          {formatTime(time)}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={handleStart}
            disabled={isRunning}
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: isRunning ? "#4a5568" : "#48bb78",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            Start
          </button>
          <button
            onClick={handlePause}
            disabled={!isRunning}
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: !isRunning ? "#4a5568" : "#ed8936",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: !isRunning ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            Pause
          </button>
          <button
            onClick={handleStop}
            disabled={time === 0}
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: time === 0 ? "#4a5568" : "#e53e3e",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: time === 0 ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "500",
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            Stop & Log
          </button>
        </div>

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What are you researching?"
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e0",
            fontSize: "0.9rem",
            color: "#2d3748",
            marginBottom: "0.5rem",
            fontFamily: "inherit",
          }}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about your research..."
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #cbd5e0",
            fontSize: "0.9rem",
            color: "#2d3748",
            minHeight: "3rem",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#718096",
            minHeight: "1.5rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {currentFileName || ""}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleOpenFile}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e0",
              background: "#fff",
              color: "#4a5568",
              cursor: "pointer",
            }}
          >
            불러오기
          </button>
          <button
            onClick={handleSaveFile}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              borderRadius: "4px",
              border: "1px solid #cbd5e0",
              background: "#fff",
              color: "#4a5568",
              cursor: "pointer",
            }}
          >
            저장
          </button>
        </div>
      </div>

      <div>
        {logs.map((log) => (
          <LogItem
            key={log.id}
            log={log}
            isEditing={editingId === log.id}
            onEdit={(id) => setEditingId(id)}
            onSave={updateLog}
            onDelete={deleteLog}
            onCancel={() => setEditingId(null)}
            swipedId={swipedId}
            onSwipeToggle={handleSwipeToggle}
          />
        ))}
      </div>
    </div>
  );
}

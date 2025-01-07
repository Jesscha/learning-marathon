import { useState, useEffect } from "react";
import "./App.css";

interface Participant {
  name: string;
  streak: number;
  lastCheckIn: Date | null;
  hasCheckedToday: boolean;
}

function App() {
  const [participants, setParticipants] = useState<Participant[]>(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem("habitMarathonState");
    return saved
      ? JSON.parse(saved, (key, value) => {
          // Convert stored date strings back to Date objects
          if (key === "lastCheckIn" && value) {
            return new Date(value);
          }
          return value;
        })
      : [
          {
            name: "범근",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
          {
            name: "이새",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
          {
            name: "건영",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
          {
            name: "영택",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
          {
            name: "정원",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
          {
            name: "경호",
            streak: 0,
            lastCheckIn: null,
            hasCheckedToday: false,
          },
        ];
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("habitMarathonState", JSON.stringify(participants));
  }, [participants]);

  const getCurrentParticipant = () => {
    return participants.find((p) => !p.hasCheckedToday);
  };

  const handleCheckIn = () => {
    const currentParticipant = getCurrentParticipant();
    if (!currentParticipant) return;

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.name === currentParticipant.name) {
          const today = new Date();
          const lastCheckIn = p.lastCheckIn;

          // Calculate if the streak continues
          let newStreak = 1;
          if (lastCheckIn) {
            const timeDiff = today.getTime() - lastCheckIn.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

            // Streak continues if checked within last 24-48 hours
            if (daysDiff <= 1) {
              newStreak = p.streak + 1;
            }
          }

          return {
            ...p,
            streak: newStreak,
            lastCheckIn: today,
            hasCheckedToday: true,
          };
        }
        return p;
      })
    );
  };

  // Reset hasCheckedToday at midnight but preserve streaks
  useEffect(() => {
    const resetDaily = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            hasCheckedToday: false,
          }))
        );
      }
    };

    const interval = setInterval(resetDaily, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sort participants to show next runner at the top
  const sortedParticipants = [...participants].sort((a, b) => {
    if (!a.hasCheckedToday && !b.hasCheckedToday) {
      return participants.indexOf(a) - participants.indexOf(b);
    }
    if (!a.hasCheckedToday) return -1;
    if (!b.hasCheckedToday) return 1;
    return participants.indexOf(a) - participants.indexOf(b);
  });

  return (
    <div className="app">
      <h1 className="title">🏃‍♂️ Habit Marathon 🏃‍♀️</h1>

      {/* Next Runner Section */}
      <div className="next-runner-section">
        {getCurrentParticipant() ? (
          <div className="next-runner">
            <div className="next-runner-label">Next Runner</div>
            <div className="next-runner-name">
              {getCurrentParticipant()?.name}
            </div>
            <button className="check-in-button" onClick={handleCheckIn}>
              ✓ Check In
            </button>
          </div>
        ) : (
          <div className="all-done">
            <h2>🎉 Today's Marathon Completed! 🎉</h2>
            <p>Next round starts at midnight</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${
              (participants.filter((p) => p.hasCheckedToday).length /
                participants.length) *
              100
            }%`,
          }}
        />
      </div>

      {/* Participants Grid */}
      <div className="participants-list">
        {sortedParticipants.map((participant, index) => (
          <div
            key={participant.name}
            className={`participant-card ${
              participant.hasCheckedToday ? "checked" : ""
            } 
              ${
                getCurrentParticipant()?.name === participant.name
                  ? "current"
                  : ""
              }`}
          >
            <div className="participant-order">{index + 1}</div>
            <h3>{participant.name}</h3>
            <div className="streak-counter">
              <span className="streak-label">Current Streak</span>
              <span className="streak-number">{participant.streak}</span>
              <span className="streak-days">days</span>
            </div>
            <div
              className={`status ${
                participant.hasCheckedToday ? "done" : "waiting"
              }`}
            >
              {participant.hasCheckedToday
                ? "✅ Completed"
                : getCurrentParticipant()?.name === participant.name
                ? "👉 Your Turn!"
                : "⏳ Waiting"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

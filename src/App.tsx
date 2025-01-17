import { useState, useEffect, useMemo } from "react";
import "./App.css";

interface Participant {
  name: string;
  streak: number;
  lastCheckIn: Date | null;
}

const DEFAULT_PARTICIPANTS = [
  {
    name: "범근",
    streak: 0,
    lastCheckIn: null,
  },
  {
    name: "이새",
    streak: 0,
    lastCheckIn: null,
  },
  {
    name: "건영",
    streak: 0,
    lastCheckIn: null,
  },
  {
    name: "영택",
    streak: 0,
    lastCheckIn: null,
  },
  {
    name: "정원",
    streak: 0,
    lastCheckIn: null,
  },
  {
    name: "경호",
    streak: 0,
    lastCheckIn: null,
  },
];

function App() {
  const [participants, setParticipants] =
    useState<Participant[]>(DEFAULT_PARTICIPANTS);

  const [lastCheckIn, setLastCheckIn] = useState<Date | null>();
  const [lastStreak, setLastStreak] = useState<number>(0);

  const [isFail, setIsFail] = useState(false);

  const totalStreak = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.streak, 0);
  }, [participants]);

  const isLastCheckIn2daysBefore = useMemo(() => {
    if (!lastCheckIn) return false;
    // might fail on international marathon
    const checkInDate = new Date(lastCheckIn).getDate();
    const today = new Date().getDate();

    return today - checkInDate > 2;
  }, [lastCheckIn]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("habitMarathonState", JSON.stringify(participants));
  }, [participants]);

  useEffect(() => {
    if (isLastCheckIn2daysBefore) {
      setIsFail(true);
      // add dump data
      setParticipants(DEFAULT_PARTICIPANTS);
      setLastStreak(totalStreak);
    }
  }, [isLastCheckIn2daysBefore, totalStreak]);

  const currentParticipant = useMemo(() => {
    return participants.reduce(
      (minParticipant: Participant | null, currentParticipant) => {
        if (
          !minParticipant ||
          currentParticipant.streak < minParticipant.streak
        ) {
          return currentParticipant;
        }
        return minParticipant;
      },
      null
    );
  }, [participants]);

  const handleCheckIn = () => {
    if (!currentParticipant) return;
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.name === currentParticipant.name) {
          const today = new Date();
          let newStreak = 1;
          if (p.lastCheckIn) {
            newStreak = p.streak + 1;
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
    setLastCheckIn(new Date());
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.name === currentParticipant?.name) return -1;
    if (b.name === currentParticipant?.name) return 1;
    return 0;
  });

  if (isFail) {
    return (
      <div className="fail-container">
        <h1 className="fail-title">🚫 Marathon Failed</h1>
        <p className="fail-message">
          Someone missed their check-in for more than 2 days. The marathon has
          been reset.
        </p>
        <div className="fail-stats">
          <div className="total-streaks">
            Total Streaks Achieved: {lastStreak}
          </div>
        </div>
        <button className="restart-button" onClick={() => setIsFail(false)}>
          Start New Marathon
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1 className="title">🏃‍♂️ Habit Marathon 🏃‍♀️</h1>

      {/* Next Runner Section */}
      <div className="next-runner-section">
        {currentParticipant ? (
          <div className="next-runner">
            <div className="next-runner-label">Next Runner</div>
            <div className="next-runner-name">{currentParticipant?.name}</div>
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

      <div className="total-streak-section">
        <div className="total-streak-label">Total Team Streak</div>
        <div className="total-streak-value">{totalStreak}</div>
        <div className="total-streak-unit">days</div>
      </div>

      <div className="participants-list">
        {sortedParticipants.map((participant, index) => (
          <div
            key={participant.name}
            className={`participant-card ${
              currentParticipant?.name === participant.name ? "current" : ""
            } 
              ${
                currentParticipant?.name === participant.name ? "current" : ""
              }`}
          >
            <div className="participant-order">{index + 1}</div>
            <h3>{participant.name}</h3>
            <div className="streak-counter">
              <span className="streak-label">Current Streak</span>
              <span className="streak-number">{participant.streak}</span>
              <span className="streak-days">days</span>
            </div>
            <div className={`status`}>
              {currentParticipant?.name === participant.name
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

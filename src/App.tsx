import { useState, useEffect, useMemo } from "react";
import "./App.css";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";

interface Participant {
  name: string;
  streak: number;
}

const DEFAULT_PARTICIPANTS = [
  {
    name: "범근",
    streak: 0,
  },
  {
    name: "이새",
    streak: 0,
  },
  {
    name: "건영",
    streak: 0,
  },
  {
    name: "영택",
    streak: 0,
  },
  {
    name: "정원",
    streak: 0,
  },
  {
    name: "경호",
    streak: 0,
  },
];

// Add this array of authorized email addresses
const AUTHORIZED_EMAILS = import.meta.env.VITE_AUTHORIZED_EMAILS.split(",").map(
  (email: string) => email.trim()
);

function App() {
  const [participants, setParticipants] =
    useState<Participant[]>(DEFAULT_PARTICIPANTS);

  const [lastCheckIn, setLastCheckIn] = useState<Date | null>();
  const [lastStreak, setLastStreak] = useState<number>(0);

  const [isFail, setIsFail] = useState(false);

  // Add auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

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

  const sameDayOnLastCheckIn = useMemo(() => {
    if (!lastCheckIn) return false;
    const checkInDate = new Date(lastCheckIn).getDate();
    const today = new Date().getDate();

    return checkInDate === today;
  }, [lastCheckIn]);

  // Load data from Firestore on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch participants
        const querySnapshot = await getDocs(collection(db, "participants"));
        const participantsData = querySnapshot.docs.map(
          (doc) => doc.data() as Participant
        );

        // Fetch last check-in time
        const lastCheckInDoc = await getDocs(collection(db, "metadata"));
        const lastCheckInData = lastCheckInDoc.docs[0]?.data();

        if (lastCheckInData?.lastCheckIn) {
          setLastCheckIn(new Date(lastCheckInData.lastCheckIn));
        }

        // If there's data in Firestore, use it. Otherwise, use defaults
        if (participantsData.length > 0) {
          setParticipants(participantsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

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

  // Add authentication check
  useEffect(() => {
    const auth = getAuth();
    auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user && user.email) {
        setIsAuthorized(AUTHORIZED_EMAILS.includes(user.email));
      }
    });
  }, []);

  const handleCheckIn = () => {
    if (!currentParticipant || !isAuthorized) return;
    const saveToFirestore = async (participants: Participant[]) => {
      try {
        // Save each participant as a separate document
        for (const participant of participants) {
          await setDoc(doc(db, "participants", participant.name), participant);
        }

        // Save last check-in time
        await setDoc(doc(db, "metadata", "lastCheckIn"), {
          lastCheckIn: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error saving to Firestore:", error);
      }
    };
    const newParticipants = participants.map((p) => {
      if (p.name === currentParticipant.name) {
        return {
          ...p,
          streak: p.streak + 1,
        };
      }
      return p;
    });

    setParticipants(newParticipants);
    saveToFirestore(newParticipants);
    setLastCheckIn(new Date());
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.name === currentParticipant?.name) return -1;
    if (b.name === currentParticipant?.name) return 1;
    return 0;
  });

  // Add login function
  const handleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

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

  if (!user) {
    return (
      <div className="app">
        <h1 className="title">🏃‍♂️ Habit Marathon 🏃‍♀️</h1>
        <button onClick={handleLogin}>Sign in with Google</button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="app">
        <h1 className="title">🏃‍♂️ Habit Marathon 🏃‍♀️</h1>
        <p>Sorry, you are not authorized to participate.</p>
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
            <button
              className="check-in-button"
              onClick={handleCheckIn}
              disabled={sameDayOnLastCheckIn}
            >
              {sameDayOnLastCheckIn ? "Already Checked In Today" : "✓ Check In"}
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

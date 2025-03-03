Firestore schema:

/days/{YYYY-MM-DD}/
  - id: "YYYY-MM-DD"
  - timestamp: Timestamp
  - createdAt: Timestamp
  
  /checkins/{auto-id}/
    - userId: number
    - chatId: number
    - content: string
    - timestamp: Timestamp
    - type: "photo" | "text"
    - photoUrl?: string (사진이 있는 경우에만)

Metadata
  - lastAllCheckIn
    - timestamp
    - dayId
  - streak (map)
    - current
    - longest

Users
  - userId 
  - telegramId
  - telegramUsername
  - name
  - email

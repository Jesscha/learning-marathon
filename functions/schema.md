Firestore schema:

Days (represents a day)
  - timestamp
  - id: (YYYY-MM-DD formatted string)

Days
  - checkins (subcollection)
    - userId
    - timestamp
    - photoUrl (of firebase storage)

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

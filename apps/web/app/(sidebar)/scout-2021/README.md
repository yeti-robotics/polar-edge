# 2021 Infinite Recharge - 2025 Cadathon Stand Form Documentation.

## Basic Overview of what I have created!

This was specifically made for the 2025 YETI 3506 Cadathon!
Game: Infinite Recharge
Teaem: First Order

## To access the form

## Navigate to: `http://localhost:PORT/scout-2021`

The port can be whatever is currently running, so 3000, 3001, 3002, etc.

## The stand form contains the following elements!

### Auto

- Starting position selection
- Power Cells scored in three different goals:
    - **Inner Port** (top, high value)
    - **Outer Port** (wider top hole)
    - **Lower Port** (bottom)
- Whether or not the bot crossed initiation line bonus
- Auto functionality check (good, bad, etc)

### Teleop

- Power Cell scoring
- Intake capability
- Shooting locations tracking
- Cycle speed assessment
- Defense rating

### The Control Panel!

- Rotation Control (3-5 spins)
- Position Control (specific color)

### Endgame

- Climbing attempts and whether or not it was succesful
- Generator switch balance

## The theme!

The 2021 form uses a distinct color palette that we thought matched the game the best:

- **Primary:** Red (#dc2626) (Could have been a better red though...)
- **Secondary:** Metallic Gray (#6b7280)
- **Accent:** Yellow (#fbbf24)

- The colors were meant to match the power port

## Mock DATA

Since this is for educational/demo purposes, the system includes:

### The teams are real teams but they are AI generated games.

- 20 qualification matches (Created by AI)
- 6 teams per match (3v3 alliances) (Basic Rules)
- Teams include: 1678, 254, 1323, 118, 2056, 1114, 971, 2910, 3256, 5940, 3663 (These are real teams!)

### Mock Submissions

- Pre-generated scouting data for analysis
- Realistic scoring patterns
- Multiple scouts per team

### The Data Access functionality

```typescript
// In order to get the teams IN a match
getMockTeamsInMatch(matchNumber: number)

// In order to get the submissions for a full team
getMockSubmissionsForTeam(teamNumber: number)

// In order to get the teams FOR a match
getMockSubmissionsForMatch(matchNumber: number)
```

## This is the folder structure (Diagram made by AI)

```
scout-2021/
├── page.tsx                        # Entry point
├── actions/
│   ├── submitForm.ts              # Form submission handler
│   └── teamsInMatch.ts            # Team fetching
├── data/
│   ├── schema.ts                  # Zod validation schemas
│   └── mockData.ts                # Mock data generation
└── form/
    ├── FormLayout.tsx             # Main layout
    ├── FormProvider.tsx           # State management
    ├── StandForm.tsx              # Step router
    ├── FormHeader.tsx             # Header component
    ├── FormNavigation.tsx         # Navigation buttons
    ├── FormProgress.tsx           # Progress bar
    ├── steps/
    │   ├── MatchDetail.tsx        # Match/team selection
    │   ├── AutoPeriod.tsx         # Autonomous scoring
    │   ├── TeleopPeriod.tsx       # Teleop scoring
    │   ├── ControlPanel.tsx       # Control panel
    │   ├── Endgame.tsx            # Endgame climbing
    │   └── Miscellaneous.tsx      # Final comments
    └── ui/
        ├── CounterInput.tsx       # +/- ticker
        ├── PowerCellInput.tsx     # Power cell dialog
        └── InfiniteRechargeDiagram.tsx  # Field SVG
```

## Validating the Form

All fields are validated using Zod schemas (For the most part I used what we had before in the past stand form):

- Required fields must be filled
- Numbers must be non-negative
- Team/match numbers validated
- Minimum comment length (32 characters)
- Step-by-step validation prevents skipping

## Data Storing

Form submissions are:

1. Logged to the console just to debug
2. Stored inside of a local storage for persistence (key: `scout2021_submissions`)
3. Validated on the serverside before acceptance

To view stored submissions:

```javascript
// In the browser console type in
JSON.parse(localStorage.getItem("scout2021_submissions"));
```

### ZOD:

- for some of the ZOD related stuff I had to use AI so that it can explain to me what was being done by ZOD and I had it teach me what it was doing since I do not have much experience with ZOD.

### THIS BOTTOM SECTION WAS MADE BY AI

## 🔧 Future Enhancements

If you want to add real database integration later:

1. **Create database table:**

```typescript
// In apps/web/lib/database/schema.ts
export const standForm2021 = pgTable("stand_form_2021", {
	id: uuid("id").primaryKey().defaultRandom(),
	// ... add all fields from schema.ts
});
```

2. **Update submitForm.ts:**

```typescript
// Replace localStorage with:
await db.insert(standForm2021).values({
	// ... map form fields to database columns
});
```

3. **Add analysis pages:**

- Copy analysis structure from `/apps/web/app/(sidebar)/analysis/`
- Adapt queries to use `standForm2021` table
- Use same chart/table components

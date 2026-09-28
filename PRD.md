# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Project: Juilliard Academy Interhouse Sports Day Application
**Platform Identifier:** `ja-mega-26`  
**Application Title:** Juilliard Academy Interhouse Sports Day Web Platform  
**Target Release:** 2026 Academic Session  
**Document Status:** Production Baseline  
**Document Version:** 1.0.0  
**Last Updated:** September 2026  

---

## 1. Executive Summary & Product Vision

### 1.1 Overview
The **Juilliard Academy Interhouse Sports Day Application** is a real-time tournament broadcasting and official scoring platform purpose-built for Juilliard Academy’s premier athletic competitions. Inspired by world-class professional sports platforms such as **FotMob**, **Sofascore**, and **ESPN**, the application bridges high-octane stadium excitement with precision sports administrative governance.

The platform provides an end-to-end digital experience:
- **For Spectators, Students, and Parents:** Sub-second live scoreboards, match fixtures, interactive 3D podiums, athlete bios, high-resolution multimedia gallery, video highlights, and social engagement (likes, comments, and hashtag streams).
- **For Officials, Scrutineers, and Judges:** A secure, role-gated administrative console for live timing entry, race placings, match statistics, football and basketball knockout brackets, student roster assignment, and immutable audit logging.

### 1.2 Mission Statement
> *"To deliver an immersive, lightning-fast, and transparent digital stadium atmosphere that elevates student athletic achievements, unites the school community behind their houses, and guarantees absolute integrity in competition scoring."*

### 1.3 Key Value Propositions
1. **FotMob-Caliber Match & Event Experience:** Professional match cards, live status pulses, event countdowns, tactical head-to-head records, and play-by-play timelines.
2. **Dual-Competition Architecture:** Seamless real-time switching between the flagship **Interhouse Sports Championship** (4 Houses) and the **Prefectship Cup** (4 Prefectorial Teams).
3. **Olympic-Standard Medal Tallying & Multi-Format Scoring:** Strict Olympic medal hierarchy (Gold > Silver > Bronze) for track and field, coupled with football group/knockout points tables and basketball knockout brackets.
4. **Master Student Roster & Athlete Profiles:** Full integration with a 1,000+ student directory featuring grades (JSS 1 through SSS 3), house rosters, personal bests, and career medal counts.
5. **Realtime Collaborative Official Console:** High-precision scoring interface with datalist auto-completion, tie-break handlers, penalty shootouts, and an automated audit trail for dispute prevention.
6. **Zero-Latency Client-Side Performance:** Built with lightweight Vanilla ES Modules, CSS variables, and Web Audio API procedural sound synthesis (0KB audio asset payload) backed by Google Cloud Firestore real-time websockets.

---

## 2. Stakeholders & User Personas

| Persona | Primary Needs & Motivations | Typical Journey | Permissions |
| :--- | :--- | :--- | :--- |
| **Student Athlete** | Check scheduled heat times, monitor house standings, view personal profile, verify race times and medal records. | Arrives via mobile -> selects house -> navigates to **Matches** or **Table** -> views individual profile via athlete search. | Public Read |
| **Spectator / Parent** | Follow live matches in real-time from the stands or remotely, watch video highlights, read match reports, cheer and comment. | Opens link -> selects house affiliation -> tracks live ticker -> likes/comments on news stories. | Public Read + Comment / Like |
| **House Master / Mistress** | Track house performance across categories, inspect athlete rosters, cheer team members, strategize event participation. | Inspects **Houses** hub -> reviews house roster and medal breakdown -> monitors live leaderboard. | Public Read |
| **Judge / Scrutineer / Official** | Input track sprint times, field jump distances, head-to-head ball scores, award podium finishes, manage official notices. | Logs in via PIN / Google Auth -> opens **Judge Console** -> enters score modal -> publishes official results live. | Admin Write (`admin`) |
| **Super Administrator / Head Patron** | Maintain system governance, audit all scoring changes, manage official accounts, conduct batch student transfers, emergency resets. | Accesses **Admin Console** -> audits real-time logs -> creates/manages official credentials -> oversees full championship data. | Super Admin (`super_admin`) |

---

## 3. Domain Model & Tournament Architecture

The platform supports a **Dual-Tournament Architecture** allowing users to switch between tournaments on the fly while maintaining independent data caches, state isolation, and visual branding.

```
                              ┌──────────────────────────────────────────────┐
                              │       JUILLIARD ACADEMY SPORTS PLATFORM      │
                              │                  (ja-mega-26)                │
                              └──────────────────────┬───────────────────────┘
                                                     │
                         ┌───────────────────────────┴───────────────────────────┐
                         ▼                                                       ▼
            ┌──────────────────────────┐                            ┌──────────────────────────┐
            │ INTERHOUSE CHAMPIONSHIP  │                            │     PREFECTSHIP CUP      │
            │   (Flagship Tournament)  │                            │  (Leadership Tournament) │
            └────────────┬─────────────┘                            └────────────┬─────────────┘
                         │                                                       │
         ┌───────────────┼───────────────┐                       ┌───────────────┼───────────────┐
         ▼               ▼               ▼                       ▼               ▼               ▼
      PHOENIX          EAGLE           MERLIN               TEAM IHECHUKWU  TEAM FORTUNE    TEAM OSARUYI
    (Solid Red)    (Solid Orange)   (Solid Blue)              (Solid Red)    (Solid Blue)   (Emerald Green)
         │                                                       │
         ▼                                                       ▼
       SWIFT                                                TEAM TITEMI
   (Solid Yellow)                                         (Royal Purple)
```

### 3.1 Interhouse Championship
The flagship inter-house sporting competition comprising the four historic houses of Juilliard Academy:

| House ID | House Name | Brand Color | Mascot | House Motto | Leadership & Patrons |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `phoenix` | **Phoenix** | `#EF4444` (Solid Red) | Phoenix Bird | *"From the Ashes, We Rise to Glory"* | **Captain:** Chinedu Ihejiahi (SS 3)<br>**Patrons:** Mrs. Angela Davies, Mr. Peter O'Connor, Ms. Fatima Bello |
| `eagle` | **Eagle** | `#F97316` (Solid Orange) | Eagle Bird | *"Soar High with Honor and Courage"* | **Captain:** Donald Ariyo (SS 3)<br>**Patrons:** Mr. Harrison, Ms. Chen, Coach Adams |
| `merlin` | **Merlin** | `#2563EB` (Solid Blue) | Merlin Falcon | *"Wisdom, Power & Unyielding Focus"* | **Captain:** Michelle Olurotimi (SS 3)<br>**Patrons:** Dr. Evelyn Wright, Mr. Kenneth Cole, Mrs. Sarah Jenkins |
| `swift` | **Swift** | `#FACC15` (Solid Yellow) | Swift Bird | *"Swift as Lightning, United as One"* | **Captain:** Adefilewa Adebimpe (SS 3)<br>**Patrons:** Ms. Rebecca Taylor, Coach Ibrahim Bello, Mr. David Alabi |

### 3.2 Prefectship Cup (Prefectorial Tournament)
A special championship contested by the senior student leadership council teams:

| Team ID | Team Name | Brand Color | Mascot | Motto | Team Captain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `team-ihechukwu` | **Team Ihechukwu** | `#EF4444` (Solid Red) | Crown & Lion | *"Leadership, Valor & Victory"* | Ihechukwu (Senior Prefect) |
| `team-fortune` | **Team Fortune** | `#2563EB` (Solid Blue) | Falcon of Victory | *"Fortune Favors the Bold & Relentless"* | Fortune (Sports Prefect) |
| `team-osaruyi` | **Team Osaruyi** | `#10B981` (Emerald Green) | Emerald Stallion | *"Relentless Drive, Speed & Discipline"* | Osaruyi (Senior Prefect) |
| `team-titemi` | **Team Titemi** | `#8B5CF6` (Royal Purple) | Purple Lightning | *"Strength in Unity, Focus & Power"* | Titemi (Senior Prefect) |

### 3.3 Dynamic Competition Switcher
- Accessible via global desktop header dropdown, dedicated route (`#/competitions`, `#/select-cup`), or mobile bottom navigation.
- Instantly toggles `localStorage["juilliard_active_competition"]` between `interhouse` and `prefectship`.
- Dynamically shifts UI color accents, crest assets, navigation branding, and switches Firestore subscription contexts without requiring a browser page reload.

---

## 4. Competition Rules & Athletic Scoring Engine

The scoring engine implements strict athletic federation standards adapted for Juilliard Academy.

### 4.1 Olympic-Style Medal Standings Hierarchy
Overall championship rank is determined by medal superiority, not arbitrary point tallies:
1. **Gold Medal Count** (Highest priority)
2. **Silver Medal Count** (Tie-breaker 1)
3. **Bronze Medal Count** (Tie-breaker 2)
4. **Total Medals Count** (Tie-breaker 3)
5. **Team Points** (Tie-breaker 4: Football & Basketball league points)
6. **Fourth-Place Finishes** (Tie-breaker 5)

```
Ranking Criteria: Gold ➔ Silver ➔ Bronze ➔ Total Medals ➔ Team Points ➔ 4th Finishes
```

### 4.2 Multi-House Events (Track, Field & Novelty)
- Formats: `format: "multi"`
- Positions & Medals:
  - **1st Place:** Gold Medal
  - **2nd Place:** Silver Medal
  - **3rd Place:** Bronze Medal
  - **4th Place:** 4th place finish recorded for tie-breaking
- Validation: Times (e.g. `10.42s`), distances (e.g. `14.85m`), and athlete names selected from the student registry.
- Points: General track and field events award zero arbitrary league points; rankings reflect pure Olympic medal tallies.

### 4.3 Head-to-Head Ball Sports (Football & Basketball)
- Formats: `format: "h2h"`

#### Football (Soccer)
- **Tournament Structure:** 3 Matchday Group Stage (each house plays 3 matches) + Knockout Final & 3rd Place Match.
- **Standings Matrix:** Matches Played (P), Won (W), Drawn (D), Lost (L), Goals For (GF), Goals Against (GA), Goal Difference (GD), Points (PTS).
- **Points Awarded:** Win = 3 points, Draw = 1 point, Loss = 0 points.
- **Medal Distribution:**
  - Group Stage Matches: Award league points only; **zero medals**.
  - Drawn Matches: Award 1 point each; **zero medals**.
  - Gold Medal Final: Winner = Gold Medal, Runner-Up = Silver Medal.
  - 3rd Place Playoff: Winner = Bronze Medal.

#### Basketball
- **Tournament Structure:** Pure Knockout Bracket.
  - Semi-Final 1 & Semi-Final 2.
  - 3rd Place Playoff (Bronze Medal).
  - Grand Championship Final (Gold & Silver Medals).
- **Match Tracking:** Quarter scores, halftime scores, buzzer-beaters, total team points.

---

## 5. Functional Requirements & Feature Specifications

### 5.1 Module Matrix & Navigation Map

```
                              ┌──────────────────────────────────┐
                              │          GLOBAL ROUTER           │
                              │          (router.js)             │
                              └────────────────┬─────────────────┘
                                               │
         ┌──────────────────┬──────────────────┼──────────────────┬──────────────────┐
         ▼                  ▼                  ▼                  ▼                  ▼
    #/events             #/table             #/news            #/houses           #/admin
  Matches & Heats       Standings        Media Gallery        House Hubs       Judge Console
         │                  │                  │                  │                  │
         ├─► #/event/:id    ├─► Football       ├─► Hashtags       └─► #/house/:id    ├─► #/admin/score/:id
         │                  ├─► Basketball     ├─► Likes                             ├─► #/admin/students
         └─► Filters        └─► 3D Podium      └─► Comments                          ├─► #/admin/rosters
                                                                                     ├─► #/admin/new-event
                                                                                     ├─► #/admin/logs
                                                                                     └─► #/admin/admins
```

---

### 5.2 Feature Specifications

#### FR-01: Onboarding & House Supporter Affiliation
- **Routes:** `#/onboarding`, `#/welcome`
- **Functional Requirements:**
  - First-time visitors are presented with interactive house crest cards with glow animations.
  - Selecting a house or team saves the choice to `localStorage.juilliard_supported_house` and `localStorage.juilliard_supported_pref_team`.
  - Automatically customizes the user experience (highlighting supported house fixtures, showing personalized cheer banners).
  - Provides quick access to Official Portal login for scrutineers.

#### FR-02: Matches & Fixtures Schedule
- **Route:** `#/events`
- **Functional Requirements:**
  - FotMob-style fixtures layout organized chronologically or grouped by category.
  - **Category Tabs:** All, Track, Field, Football, Basketball, Novelty.
  - **Gender Filtering:** All, Boys, Girls, Mixed.
  - **Status Filtering:** All, Live, Upcoming, Completed.
  - **Match Cards:** Display contending houses, scheduled start time, live game clock or final score badge, venue lane, and status pills (`LIVE` pulsating red, `UPCOMING` amber, `COMPLETED` green).
  - Clicking any card transitions to the dedicated Event Detail screen (`#/event/:id`).

#### FR-03: Event & Match Detail View
- **Route:** `#/event/:id`
- **Functional Requirements:**
  - Dynamic high-impact scoreboard header featuring house crests, background gradients, and live status indicator.
  - **Head-to-Head Ball Matches:**
    - Live score, match status (e.g. "FT", "HT", "Penalties").
    - Tabbed view: **Match Facts** (scorers, cards, stadium), **Live Commentary / Timeline**, **Lineups & Squads**, **Head-to-Head History**.
  - **Track & Field Events:**
    - Visual 1st, 2nd, 3rd podium finisher cards.
    - Athlete details, verified timing/distance, and official judge commentary notes.

#### FR-04: Standings & Leaderboard
- **Route:** `#/table`
- **Functional Requirements:**
  - **Interactive 3D Podium:** Animated top-3 pedestals with glowing crests, smooth number tick animations, and total medal count.
  - **Overall Medal Table:** Full breakdown of Gold, Silver, Bronze, Total Medals, Points, and 4th finishes.
  - **Category-Specific Standings View:**
    - **Football Table:** Group stage table with P, W, D, L, GF, GA, GD, PTS.
    - **Basketball Bracket:** Visual tree rendering Semi-Finals, 3rd Place Match, and Championship Final with winner paths.
  - Form guides displaying last 5 match results (W/D/L badges).

#### FR-05: House & Team Profiles Hub
- **Routes:** `#/houses`, `#/house/:id`
- **Functional Requirements:**
  - Showcase directory of all 4 Houses (or 4 Prefectorial Teams).
  - **House Profile Page:**
    - Hero banner featuring mascot, official crest, house colors, and motto.
    - Leadership roster: House Master/Mistress, Teacher Patrons, Student House Captain.
    - Trophy showcase and historical Sports Day records.
    - Full house athlete roster with search and grade filtering.
    - Complete match history and upcoming schedule for that specific house.

#### FR-06: Student & Athlete Profiles
- **Routes:** `#/athlete/:id`, `#/student/:id`
- **Functional Requirements:**
  - Dedicated dossier for any registered student athlete.
  - Displays: Full Name, Class / Grade (e.g., JSS 2, SSS 3), Gender, Assigned House.
  - Athletic achievements: Gold, Silver, Bronze medal count, events entered, personal best times/distances.

#### FR-07: News, Media Gallery & Social Interactions
- **Routes:** `#/news`, `#/gallery`
- **Functional Requirements:**
  - **Story Types:**
    - `video`: HTML5 player with MP4 support, video duration, and custom thumbnail poster.
    - `photo`: High-res image gallery with multi-image lightbox support.
    - `article`: Editorial journalism, match analysis, and ceremonial reports.
  - **Single-Toggle Like System:**
    - Real-time like counter persisted in Firestore (`news.likes` and `news.likedBy`).
    - Device/user key tracking in `localStorage` prevents duplicate likes; clicking again unlikes cleanly.
  - **Hashtags & Filtering:**
    - Stories tagged with athletic hashtags (e.g. `#FootballFinal`, `#100mSprint`, `#GoldMedal`).
    - Clicking any hashtag filters the active news stream; filter reset chip allows instant clearing.
  - **Live Commenting Stream:**
    - Spectators can submit real-time comments on stories.
    - Admins have permission to delete inappropriate comments.
  - **Admin Story Publisher & Editor:**
    - Verified judges can create new stories or edit existing stories (modify title, subtitle, media URL, tags with suggestion chips).

#### FR-08: Scrutineer & Judge Scoring Console
- **Route:** `#/admin` (gated via `requireAdmin`)
- **Functional Requirements:**
  - **Quick Event Action Table:** Live search and filter across all tournament events.
  - **Tactile Placing Form:**
    - Selection of 1st, 2nd, 3rd, and 4th place houses.
    - Dynamic athlete search input hooked to HTML5 `<datalist>` populated by 1,000+ student directory.
    - Input fields for Time (seconds), Distance (meters), or Ball Scores.
    - Official scrutineer notes field for recording record-breaking performances.
    - Instant live publishing to Cloud Firestore.
  - **Real-Time Sound Synthesizer:** Triggers procedural whistle sound on submission and celebration fanfare on gold medal allocation.

#### FR-09: Student Database & Roster Management
- **Routes:** `#/admin/students`, `#/admin/rosters`
- **Functional Requirements:**
  - Full CRUD management over student athlete directory.
  - **Search & Filter:** Instant search by student name, filter by house, filter by grade.
  - **Individual Student Operations:** Add student, edit class/gender, remove student.
  - **Bulk Import:** Paste or import multi-student datasets.
  - **Batch House Transfer Modal:** Multi-select students and transfer them en masse from one house to another.
  - **House Staff Roster Management:** Update house captain, house motto, and patron teacher lists.

#### FR-10: Event Creator & Schedule Configuration
- **Routes:** `#/admin/new-event`, `#/admin/edit-event/:id`
- **Functional Requirements:**
  - Create new custom track, field, ball, or novelty events.
  - Configure event title, category, gender division, scheduled time, format (`multi` vs `h2h`), and contenders.
  - Adjust custom points matrix when applicable.
  - Edit or delete existing scheduled events.

#### FR-11: Governance, Officials Council & Scrutineer Audit Log
- **Routes:** `#/admin/admins`, `#/admin/logs`
- **Functional Requirements:**
  - **Multi-Tier Role-Based Access Control (RBAC):**
    - `super_admin`: Full administrative control, user provisioning, emergency resets.
    - `admin`: Scoring console, story publishing, event management.
    - `teacher`: Roster editing and student review.
  - **Permanent Super Admin Safeguards:**
    - Hardcoded super administrators (`ADM-001` David Festus, `ADM-003` Osaruyi Aideyan, Ihechukwu) cannot be locked out or deleted.
  - **Official PIN & Password Authentication:**
    - Direct credential validation with encrypted fallback.
  - **Immutable Scrutineer Audit Trail (`admin_audit_logs`):**
    - Every score entry, event reset, or administrative modification records: Admin ID, Admin Name, Timestamp, Action Type, Event ID, Previous Value, New Value.
  - **Emergency Sports Day Reset:**
    - Master reset action to purge scores or reload official baseline seed data, protected by a two-step confirmation dialog.

---

## 6. Technical Architecture & Implementation Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │   Presentation Layer  │  │   Application Logic   │  │ Procedural Synt.│  │
│  │   • Vanilla CSS3      │  │   • app.js / router.js│  │ • audio.js      │  │
│  │   • Google Fonts      │  │   • pages.js          │  │ • Web Audio API │  │
│  │   • SVG Icons         │  │   • admin.js / ui.js  │  │ • 0KB Audio Pack│  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └─────────────────┘  │
│              │                          │                                   │
│              ▼                          ▼                                   │
│  ┌──────────────────────────────────────────────────┐                       │
│  │           State & Local Persistence              │                       │
│  │   • window.*Cache     • localStorage (Theme/Cup) │                       │
│  └──────────────────────────┬───────────────────────┘                       │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │ Real-Time WebSocket / SDK
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FIREBASE CLOUD INFRASTRUCTURE                         │
│                               (ja-mega-26)                                  │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │    Cloud Firestore    │  │     Firebase Auth     │  │Firebase Hosting │  │
│  │ • Real-time snapshots │  │ • Google Sign-In      │  │ • CDN Fast Edge │  │
│  │ • 8 Core Collections  │  │ • Email / Password    │  │ • SPA Rewrites  │  │
│  │ • Security Rules v2   │  │ • Admin PIN Validation│  │ • Video Headers │  │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Technology Stack Details

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Vanilla ES Modules (No Framework)** | Zero build-step latency, ultra-lightweight bundle size, instant startup time on mobile devices. |
| **Routing** | Custom Client-Side Hash Router (`router.js`) | Instant screen transitions, parameter parsing (`:id`), history API integration, zero server hops. |
| **Styling & Theming** | Vanilla CSS3 + Custom Properties (`styles.css`, `app-shell.css`) | 60 FPS hardware-accelerated animations, FotMob dark mode, high-contrast light mode, responsive CSS Grid. |
| **Sound Synthesis** | Web Audio API Procedural Synthesizer (`audio.js`) | Generates whistle, stadium celebration fanfare, and UI click sounds algorithmically with **0 KB external audio download**. |
| **Realtime Database** | Google Cloud Firestore (Compat SDK 10.12.0) | Multi-client real-time synchronization via `onSnapshot` listeners (< 400ms broadcast latency across stadium). |
| **Authentication** | Firebase Auth + Custom Credential Store | Google OAuth 2.0, email/password, and administrative PIN session state management. |
| **Hosting & CDN** | Firebase Hosting | Global CDN, HTTP/2 multiplexing, CORS headers for MP4 video streaming, automatic SPA wildcard rewrites. |

---

## 7. Data Models & Database Schema

Firestore database instance: `(default)` in project `ja-mega-26`.

### 7.1 Entity Relationship Diagram

```
      ┌────────────────┐               ┌────────────────┐
      │     HOUSES     │ 1           * │    STUDENTS    │
      │ ────────────── │───────────────┤ ────────────── │
      │ id (PK)        │               │ id (PK)        │
      │ name           │               │ name           │
      │ color          │               │ grade          │
      │ goldCount      │               │ houseId (FK)   │
      │ silverCount    │               │ gender         │
      │ bronzeCount    │               └────────────────┘
      │ teamPoints     │
      └───────┬────────┘
              │ 1
              │
              │ * (contenders)
      ┌───────┴────────┐               ┌────────────────┐
      │     EVENTS     │ 1           * │   AUDIT_LOGS   │
      │ ────────────── │───────────────┤ ────────────── │
      │ id (PK)        │               │ id (PK)        │
      │ name           │               │ eventId (FK)   │
      │ category       │               │ adminId (FK)   │
      │ format         │               │ timestamp      │
      │ status         │               │ action         │
      │ results        │               │ previousValue  │
      └────────────────┘               │ newValue       │
                                       └────────────────┘
```

### 7.2 Detailed Collection Schemas

#### 1. `houses` Collection
```typescript
interface HouseDocument {
  id: string;                 // "phoenix" | "eagle" | "merlin" | "swift" | "team-*"
  name: string;               // e.g. "Phoenix"
  motto: string;              // e.g. "From the Ashes, We Rise to Glory"
  mascot: string;             // e.g. "Phoenix Bird"
  color: string;              // Hex code, e.g. "#EF4444"
  colorSecondary: string;     // Hex code, e.g. "#DC2626"
  captain: string;            // e.g. "Chinedu Ihejiahi (SS 3)"
  teachers: string[];         // Array of patron names
  goldCount: number;          // Gold medals won
  silverCount: number;        // Silver medals won
  bronzeCount: number;        // Bronze medals won
  fourthCount: number;        // 4th finishes
  totalMedals: number;        // gold + silver + bronze
  teamPoints: number;         // Football + Basketball league points
  teamWins: number;           // Head-to-head match wins
  teamDraws: number;          // Head-to-head match draws
  teamLosses: number;         // Head-to-head match losses
  teamGoalsFor: number;       // Total goals / baskets scored
  teamGoalsAgainst: number;   // Total goals / baskets conceded
}
```

#### 2. `events` Collection
```typescript
interface EventDocument {
  id: string;                 // e.g. "track-100m-boys", "pref-football-semi-1"
  name: string;               // e.g. "100m Race (Boys)"
  category: "Track" | "Field" | "Football" | "Basketball" | "Novelty" | "Ceremony";
  gender: "Boys" | "Girls" | "Mixed";
  order: number;              // Display sorting sequence
  status: "upcoming" | "in_progress" | "live" | "completed";
  format: "multi" | "h2h";    // Multi-house placement vs Head-to-Head
  scheduledTime?: string;     // e.g. "09:30"
  contenders?: string[];      // Array of House IDs, e.g. ["phoenix", "eagle"]
  knockoutRound?: "semi" | "final" | "third_place" | "group";
  results: {
    first?: { houseId: string; athlete: string; score: string; points?: number };
    second?: { houseId: string; athlete: string; score: string; points?: number };
    third?: { houseId: string; athlete: string; score: string; points?: number };
    fourth?: { houseId: string; athlete: string; score: string; points?: number };
  } | null;
  notes?: string;             // e.g. "Championship Record broken in Lane 4!"
  updatedAt?: string;         // ISO timestamp
  updatedBy?: string;         // Admin ID
}
```

#### 3. `students` Collection
```typescript
interface StudentDocument {
  id: string;                 // e.g. "STU-1049"
  name: string;               // e.g. "Chinedu Ihejiahi"
  grade: string;              // "JSS 1" - "SSS 3"
  gender: "Boys" | "Girls";
  houseId: string;            // "phoenix" | "eagle" | "merlin" | "swift" | "general"
  sports?: string[];          // e.g. ["100m", "4x100m", "Football"]
  goldCount?: number;
  silverCount?: number;
  bronzeCount?: number;
  personalBests?: Record<string, string>; // e.g. { "100m": "10.42s" }
}
```

#### 4. `news` Collection
```typescript
interface NewsDocument {
  id: string;                 // e.g. "news-fb-final"
  title: string;              // Headline
  subtitle?: string;          // Summary deck
  type: "video" | "photo" | "article";
  category: string;           // "Football", "Track", etc.
  mediaUrl: string;           // Asset path or external URL
  videoThumbnail?: string;    // Poster image
  videoDuration?: string;     // e.g. "1:15"
  galleryImages?: string[];   // Multi-image list for photo stories
  content: string;            // Story body
  tags: string[];             // e.g. ["FootballFinal", "GoldMedal"]
  likes: number;              // Total likes
  likedBy: string[];          // Array of voter hashes / client IDs
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: string;
    isAdmin?: boolean;
  }>;
  author: string;             // e.g. "Osaruyi Aideyan (Super Admin)"
  timestamp: string;          // ISO date string
  formattedDate?: string;     // e.g. "27 Sep, 10:00"
}
```

#### 5. `admins` & `admin_credentials` Collections
```typescript
interface AdminDocument {
  id: string;                 // e.g. "ADM-001"
  adminId: string;
  name: string;               // e.g. "David Festus"
  email: string;              // e.g. "davidfestusugwu@gmail.com"
  title: string;              // e.g. "Chief Scrutineer"
  role: "super_admin" | "admin" | "teacher" | "official";
  createdAt: string;
}

interface AdminCredentialDocument {
  id: string;                 // email or adminId
  passwordHash: string;       // SHA-256 / PBKDF2 hash or PIN
  lastLogin: string;
}
```

#### 6. `admin_audit_logs` Collection
```typescript
interface AuditLogDocument {
  id: string;
  timestamp: string;          // ISO timestamp
  adminId: string;            // Admin ID performing action
  adminName: string;
  action: "submit_score" | "edit_score" | "reset_scores" | "add_student" | "transfer_house";
  targetId: string;           // Event ID or Student ID
  details: string;            // Human-readable summary
  previousState?: any;
  newState?: any;
}
```

---

## 8. UI/UX Design System & Layout Specifications

### 8.1 Visual Aesthetic Guidelines
- **Core Inspiration:** Modern professional sports broadcast interfaces (FotMob, Sofascore, Premier League App).
- **Dark Theme (Default):**
  - App Canvas: `#0A0A0C`
  - Card Surfaces: `#121216`
  - Elevated Popups / Modals: `#181820`
  - Borders & Dividers: `#22222C`
  - Primary Text: `#FFFFFF`
  - Secondary / Muted Text: `#94A3B8`
- **Light Theme (Optional):**
  - App Canvas: `#F4F5F7`
  - Card Surfaces: `#FFFFFF`
  - Borders & Dividers: `#E2E8F0`
  - Primary Text: `#0F172A`
- **Brand Accents:**
  - Gold Trophy Accent: `#F59E0B`
  - Live Pulsing Badge: `#EF4444`
  - Completed Status: `#10B981`

### 8.2 Typography
- **Headings & Brand Titles:** `Outfit` (Weights: 600, 700, 800, 900) via Google Fonts. High-energy, athletic, modern.
- **Data Tables & Body Text:** `Inter` (Weights: 400, 500, 600, 700). Ultra-crisp numerical tabular alignment and readability.

### 8.3 Responsive Layout Strategy

#### Desktop (Screen Width >= 1024px)
- **Global Sticky Header:** Brand crest, tournament cup switcher badge, quick global search bar, desktop text navigation links, theme toggle, official login portal button.
- **3-Column Grid Shell:**
  - **Left Sidebar (280px):** Live House standings ranking widget with miniature crests and points, plus category quick filters.
  - **Center Viewport (Flex 1):** Main active page screen (Matches, Standings Table, Event Details, Admin Console).
  - **Right Sidebar (340px):** Real-time News, video highlight reel player, and latest track results feed.

#### Mobile & Tablet (Screen Width < 1024px)
- **Single-Column App Shell:** Compact header with current tournament badge and theme toggle.
- **Sticky Bottom Navigation Bar (5 Tabs):**
  1. `Matches` (`#/events`) — Icon: Calendar
  2. `Table` (`#/table`) — Icon: Trophy
  3. `News` (`#/news`) — Icon: Newspaper
  4. `Houses` (`#/houses`) — Icon: Shield / House
  5. `Judge` (`#/admin`) — Icon: Whistle / Gavel *(Conditionally rendered for authenticated officials only)*

---

## 9. Security, Governance & Audit Architecture

### 9.1 Firestore Security Rules (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    // Public live read access for tournament transparency
    match /houses/{houseId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }

    match /events/{eventId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }

    match /students/{studentId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }

    match /news/{newsId} {
      allow read: if true;
      allow write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }

    match /admin_audit_logs/{logId} {
      allow read, write: if isAuthenticated() || request.time < timestamp.date(2026, 10, 22);
    }

    match /admins/{adminId} {
      allow read, write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }

    match /admin_credentials/{credId} {
      allow read, write: if request.time < timestamp.date(2026, 10, 22) || isAuthenticated();
    }
  }
}
```

### 9.2 Immutable Audit Trail & Dispute Resolution
- Every mutation to an event score generates an audit log entry in `/admin_audit_logs`.
- Logs record the authenticated official's ID, name, precise timestamp, before/after score payload, and reason.
- Guarantees transparency and eliminates scoring disputes between house masters.

---

## 10. Quality Assurance & Verification Matrix

The application codebase contains an extensive automated and end-to-end verification suite in the `scratch/` directory:

| Test Script | Verification Focus | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| `verify_all_requirements.js` | End-to-end verification of News like/unlike, tag filtering, story editor, football group table, and basketball bracket. | All 6 test suites pass; generates screenshot artifacts. | **Verified** |
| `verify_cup_switch_e2e.js` | Real-time tournament switcher between Interhouse and Prefectship Cup. | State isolation confirmed; correct house rosters rendered. | **Verified** |
| `verify_points_removal.js` | Ensures track/field events strictly award Olympic medals without legacy points. | Medal ranking mathematically verified. | **Verified** |
| `simulate_full_championship.mjs` | Full simulation of 35 championship events with realistic race times and football scores. | Firestore batch updates succeed; standings recalculate accurately. | **Verified** |
| `verify_h2h_scores.js` | Football head-to-head score parsing, drawn match handling, and league points award. | Win (3 pts), Draw (1 pt), Loss (0 pts) confirmed. | **Verified** |
| `test_athlete_stat_matching.js` | Links student registry with placing results and verifies athlete profile stats. | Medals correctly aggregated per student. | **Verified** |
| `verify_production_osaruyi.js` | Super admin session validation and permissions check. | Full super admin capabilities confirmed. | **Verified** |

---

## 11. Deployment, Hosting & Operations Runbook

### 11.1 Firebase Hosting Configuration (`firebase.json`)
```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**/*.@(mp4|webm)",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" },
          { "key": "Cache-Control", "value": "public, max-age=604800" }
        ]
      }
    ],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

### 11.2 Deployment Commands
- **Deploy Full Stack:**
  ```bash
  firebase deploy --project ja-mega-26
  ```
- **Deploy Hosting Only:**
  ```bash
  firebase deploy --only hosting --project ja-mega-26
  ```
- **Deploy Firestore Security Rules & Indexes:**
  ```bash
  firebase deploy --only firestore --project ja-mega-26
  ```

### 11.3 Local Development Server
- To run locally without build dependencies:
  ```powershell
  python scratch/dev_server.py 5055
  # or
  npx -y serve public -l 5055
  ```
- Access in browser: `http://localhost:5055`
- Super Admin autologin test query: `http://localhost:5055/?admin=osaruyi` or `http://localhost:5055/?autologin=admin`

---

## 12. Future Roadmap & Enhancements

1. **Push Notifications:** Web Push API integration for instant goal, race start, and gold medal alert notifications to spectators.
2. **Live Video Streaming (HLS/WebRTC):** Embedding low-latency stadium camera feeds directly into the Event Detail and News header.
3. **Parent & Alumni March Past Voting:** Interactive spectator voting for the Best Dressed House and Most Creative March Past Salute.
4. **Automated Certificate & Official Results Export:** One-click PDF generation of official event result sheets signed by the Chief Scrutineer and Head of School.
5. **Wearable / Smart Stopwatch BLE Integration:** Direct Bluetooth Low Energy link with digital stopwatches to feed sprint times directly into the scoring console.

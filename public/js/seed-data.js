/**
 * Initial Seed Data for Juilliard Interhouse Sports Day
 * Houses: Eagle (Orange), Merlin (Blue), Swift (Yellow), Phoenix (Red)
 * Minimalist bird silhouettes with plain solid colors
 */

export const INITIAL_HOUSES = [
  {
    id: "phoenix",
    name: "Phoenix",
    motto: "From the Ashes, We Rise to Glory",
    mascot: "Phoenix Bird",
    color: "#EF4444",          // Solid Red
    colorSecondary: "#DC2626",
    colorDark: "#7F1D1D",
    bgGradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    glowColor: "rgba(239, 68, 68, 0.4)",
    textColor: "#FFFFFF",
    captain: "Chinedu Ihejiahi (SS 3)",
    teachers: ["Mrs. Angela Davies (Head of House)", "Mr. Peter O'Connor", "Ms. Fatima Bello"],
    totalPoints: 9,
    teamPoints: 9,
    teamWins: 3,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 13,
    silverCount: 9,
    bronzeCount: 9,
    fourthCount: 1,
    totalMedals: 31
  },
  {
    id: "merlin",
    name: "Merlin",
    motto: "Wisdom, Power & Unyielding Focus",
    mascot: "Merlin Falcon Bird",
    color: "#2563EB",          // Solid Blue
    colorSecondary: "#1D4ED8",
    colorDark: "#1E3A8A",
    bgGradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    glowColor: "rgba(37, 99, 235, 0.4)",
    textColor: "#FFFFFF",
    captain: "Michelle Olurotimi (SS 3)",
    teachers: ["Dr. Evelyn Wright (Head of House)", "Mr. Kenneth Cole", "Mrs. Sarah Jenkins"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 2,
    goldCount: 8,
    silverCount: 10,
    bronzeCount: 7,
    fourthCount: 6,
    totalMedals: 25
  },
  {
    id: "swift",
    name: "Swift",
    motto: "Swift as Lightning, United as One",
    mascot: "Swift Bird",
    color: "#FACC15",          // Solid Yellow
    colorSecondary: "#EAB308",
    colorDark: "#713F12",
    bgGradient: "linear-gradient(135deg, #FACC15 0%, #EAB308 100%)",
    glowColor: "rgba(250, 204, 21, 0.4)",
    textColor: "#000000",
    captain: "Adefilewa Adebimpe (SS 3)",
    teachers: ["Ms. Rebecca Taylor (Head of House)", "Coach Ibrahim Bello", "Mr. David Alabi"],
    totalPoints: 6,
    teamPoints: 6,
    teamWins: 2,
    teamDraws: 0,
    teamLosses: 1,
    goldCount: 8,
    silverCount: 7,
    bronzeCount: 8,
    fourthCount: 9,
    totalMedals: 23
  },
  {
    id: "eagle",
    name: "Eagle",
    motto: "Soar High with Honor and Courage",
    mascot: "Eagle Bird",
    color: "#F97316",          // Solid Orange
    colorSecondary: "#EA580C",
    colorDark: "#7C2D12",
    bgGradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    glowColor: "rgba(249, 115, 22, 0.4)",
    textColor: "#FFFFFF",
    captain: "Donald Ariyo (SS 3)",
    teachers: ["Mr. Harrison (Head of House)", "Ms. Chen", "Coach Adams"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 2,
    goldCount: 6,
    silverCount: 9,
    bronzeCount: 4,
    fourthCount: 12,
    totalMedals: 19
  }
];

export const DEFAULT_POINTS = {
  first: 100,
  second: 60,
  third: 40,
  fourth: 20
};

export const INITIAL_EVENTS = [
  {
    "id": "track-100m-boys",
    "name": "100m Race (Boys)",
    "category": "Track",
    "gender": "Boys",
    "order": 1,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Chinedu Ihejiahi (SS 3)",
        "score": "10.42s"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Donald Ariyo (SS 3)",
        "score": "10.58s"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Tunde Bakare (SS 1)",
        "score": "10.74s"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "Kenechi Okonkwo (SS 2)",
        "score": "10.91s"
      }
    },
    "notes": "Championship Record broken in Lane 4! Sensational run.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-100m-girls",
    "name": "100m Race (Girls)",
    "category": "Track",
    "gender": "Girls",
    "order": 2,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Michelle Olurotimi (SS 3)",
        "score": "11.85s"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Amara Nnamdi (JSS 3)",
        "score": "12.04s"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Adefilewa Adebimpe (SS 3)",
        "score": "12.21s"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Blessing Eze (SS 2)",
        "score": "12.45s"
      }
    },
    "notes": "Merlin dominates Lane 2 with lightning start.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-200m-boys",
    "name": "200m Race (Boys)",
    "category": "Track",
    "gender": "Boys",
    "order": 3,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Donald Ariyo (SS 3)",
        "score": "21.30s"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Chinedu Ihejiahi (SS 3)",
        "score": "21.45s"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Emeka Obi (SS 2)",
        "score": "21.88s"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Farouk Alabi (SS 1)",
        "score": "22.15s"
      }
    },
    "notes": "Powerful bend curve acceleration by Eagle.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-200m-girls",
    "name": "200m Race (Girls)",
    "category": "Track",
    "gender": "Girls",
    "order": 4,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Adefilewa Adebimpe (SS 3)",
        "score": "24.12s"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Michelle Olurotimi (SS 3)",
        "score": "24.35s"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Amara Nnamdi (JSS 3)",
        "score": "24.80s"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Chioma Adeleke (SS 1)",
        "score": "25.10s"
      }
    },
    "notes": "Swift takes gold in dramatic photo finish.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-400m-boys",
    "name": "400m Race (Boys)",
    "category": "Track",
    "gender": "Boys",
    "order": 5,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Abel Munachimso (JSS 1)",
        "score": "48.90s"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Victor Oshodi (SS 2)",
        "score": "49.35s"
      },
      "third": {
        "houseId": "eagle",
        "athlete": "Samuel Olatunji (SS 2)",
        "score": "50.12s"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "David Kalu (SS 1)",
        "score": "51.40s"
      }
    },
    "notes": "Abel Munachimso runs sub-49 from Lane 6.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-400m-girls",
    "name": "400m Race (Girls)",
    "category": "Track",
    "gender": "Girls",
    "order": 6,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Fatima Dangote (SS 2)",
        "score": "56.40s"
      },
      "second": {
        "houseId": "swift",
        "athlete": "Zainab Lawal (SS 1)",
        "score": "57.10s"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Ngozi Okonjo (JSS 3)",
        "score": "58.25s"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Halima Bello (SS 2)",
        "score": "59.80s"
      }
    },
    "notes": "Fatima pacing masterclass.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-800m-boys",
    "name": "800m Race (Boys)",
    "category": "Track",
    "gender": "Boys",
    "order": 7,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Ibrahim Sadiq (SS 3)",
        "score": "1:58.40"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Chukwudi Nwosu (SS 2)",
        "score": "1:59.85"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Emmanuel Cole (SS 1)",
        "score": "2:01.30"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Babatunde Raji (SS 2)",
        "score": "2:03.15"
      }
    },
    "notes": "Sub 2-minute tactical battle on the bell lap.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-800m-girls",
    "name": "800m Race (Girls)",
    "category": "Track",
    "gender": "Girls",
    "order": 8,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Grace Oladipo (SS 3)",
        "score": "2:18.20"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Joy Danjuma (SS 2)",
        "score": "2:20.45"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Mercy Eke (SS 1)",
        "score": "2:22.90"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Kehinde Davies (JSS 3)",
        "score": "2:25.10"
      }
    },
    "notes": "Grace Oladipo kicks at the 600m mark.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-relay-boys",
    "name": "4x100m Relay (Boys)",
    "category": "Track",
    "gender": "Boys",
    "order": 9,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Phoenix Relay Squad",
        "score": "41.80s"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Eagle Relay Squad",
        "score": "42.15s"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Swift Relay Squad",
        "score": "42.90s"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "Merlin Relay Squad",
        "score": "43.40s"
      }
    },
    "notes": "Flawless baton changeovers by Phoenix Relay team!",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "track-relay-girls",
    "name": "4x100m Relay (Girls)",
    "category": "Track",
    "gender": "Girls",
    "order": 10,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Swift Relay Squad",
        "score": "46.50s"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Merlin Relay Squad",
        "score": "46.85s"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Phoenix Relay Squad",
        "score": "47.40s"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Eagle Relay Squad",
        "score": "48.10s"
      }
    },
    "notes": "Swift anchor Adebimpe powers across finish line.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-three-legged-boys",
    "name": "Three-Legged Race (Boys)",
    "category": "Novelty",
    "gender": "Boys",
    "order": 11,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Donald Ariyo & Samuel Olatunji",
        "score": "14.2s"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Chinedu Ihejiahi & Victor Oshodi",
        "score": "14.8s"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Emeka Obi & David Kalu",
        "score": "15.6s"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Abel Munachimso & Tunde Bakare",
        "score": "16.4s"
      }
    },
    "notes": "Eagle pair demonstrated perfect coordination.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-three-legged-girls",
    "name": "Three-Legged Race (Girls)",
    "category": "Novelty",
    "gender": "Girls",
    "order": 12,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Michelle Olurotimi & Grace Oladipo",
        "score": "15.1s"
      },
      "second": {
        "houseId": "swift",
        "athlete": "Adefilewa Adebimpe & Zainab Lawal",
        "score": "15.5s"
      },
      "third": {
        "houseId": "eagle",
        "athlete": "Blessing Eze & Chioma Adeleke",
        "score": "16.2s"
      },
      "fourth": {
        "houseId": "phoenix",
        "athlete": "Amara Nnamdi & Fatima Dangote",
        "score": "17.0s"
      }
    },
    "notes": "Merlin girls unbroken rhythm.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-lemon-race-girls",
    "name": "Lemon & Spoon Race (Girls)",
    "category": "Novelty",
    "gender": "Girls",
    "order": 13,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Amara Nnamdi (JSS 3)",
        "score": "9.8s"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Ngozi Okonjo (JSS 3)",
        "score": "10.3s"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Kehinde Davies (JSS 3)",
        "score": "10.9s"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Halima Bello (SS 2)",
        "score": "11.5s"
      }
    },
    "notes": "Steady hands and sprint balance.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-up-down-boys",
    "name": "Up and Down Relay (Boys)",
    "category": "Novelty",
    "gender": "Boys",
    "order": 14,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Swift Junior Boys",
        "score": "1:12.4"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Eagle Junior Boys",
        "score": "1:14.2"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Phoenix Junior Boys",
        "score": "1:15.8"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "Merlin Junior Boys",
        "score": "1:17.5"
      }
    },
    "notes": "Swift junior squad rapid execution.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-up-down-girls",
    "name": "Up and Down Relay (Girls)",
    "category": "Novelty",
    "gender": "Girls",
    "order": 15,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Phoenix Junior Girls",
        "score": "1:14.0"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Merlin Junior Girls",
        "score": "1:15.3"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Swift Junior Girls",
        "score": "1:16.8"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Eagle Junior Girls",
        "score": "1:18.2"
      }
    },
    "notes": "Phoenix junior girls sprint clear.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-ball-belly-boys",
    "name": "Ball Belly / Sack Race (Boys)",
    "category": "Novelty",
    "gender": "Boys",
    "order": 16,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Merlin Senior Boys",
        "score": "18.2s"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Phoenix Senior Boys",
        "score": "18.9s"
      },
      "third": {
        "houseId": "eagle",
        "athlete": "Eagle Senior Boys",
        "score": "19.5s"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Swift Senior Boys",
        "score": "20.3s"
      }
    },
    "notes": "Merlin leaps to victory in packed field.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-tug-of-war-boys",
    "name": "Tug of War Pull 1 (Boys)",
    "category": "Novelty",
    "gender": "Boys",
    "format": "h2h",
    "contenders": [
      "phoenix",
      "eagle"
    ],
    "scheduledTime": "14:45",
    "order": 17,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "2 - 0"
      },
      "second": {
        "houseId": "eagle",
        "score": "0 - 2"
      }
    },
    "notes": "Massive heave by Phoenix anchor line wins 2 straight pulls.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "novelty-tug-of-war-girls",
    "name": "Tug of War Pull 2 (Girls)",
    "category": "Novelty",
    "gender": "Girls",
    "format": "h2h",
    "contenders": [
      "swift",
      "merlin"
    ],
    "scheduledTime": "15:15",
    "order": 18,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "score": "2 - 1"
      },
      "second": {
        "houseId": "swift",
        "score": "1 - 2"
      }
    },
    "notes": "Merlin recovers from 1 down to take deciding pull.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-shotput-boys",
    "name": "Shot Put (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 19,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Kenneth Briggs (SS 3)",
        "score": "13.45m"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Osasere Igbinosa (SS 3)",
        "score": "12.90m"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Babajide Cole (SS 2)",
        "score": "12.15m"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Uchechukwu Eze (SS 2)",
        "score": "11.60m"
      }
    },
    "notes": "Kenneth Briggs sets standard with final throw.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-shotput-girls",
    "name": "Shot Put (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 20,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Boma Jumbo (SS 3)",
        "score": "11.20m"
      },
      "second": {
        "houseId": "swift",
        "athlete": "Ronke Adebayo (SS 2)",
        "score": "10.65m"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Chioma Okoro (SS 3)",
        "score": "10.10m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Aisha Mohammed (SS 2)",
        "score": "9.50m"
      }
    },
    "notes": "Boma Jumbo claims gold.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-javelin-boys",
    "name": "Javelin (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 21,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Joshua Akpan (SS 3)",
        "score": "48.60m"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Osasere Igbinosa (SS 3)",
        "score": "46.20m"
      },
      "third": {
        "houseId": "eagle",
        "athlete": "Kenneth Briggs (SS 3)",
        "score": "44.80m"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "Babajide Cole (SS 2)",
        "score": "41.50m"
      }
    },
    "notes": "Superb arc throw exceeding 48 meters.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-javelin-girls",
    "name": "Javelin (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 22,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Chioma Okoro (SS 3)",
        "score": "36.40m"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Aisha Mohammed (SS 2)",
        "score": "34.15m"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Boma Jumbo (SS 3)",
        "score": "32.80m"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Ronke Adebayo (SS 2)",
        "score": "30.50m"
      }
    },
    "notes": "Chioma Okoro clean release wins gold.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-discus-boys",
    "name": "Discus (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 23,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Kenneth Briggs (SS 3)",
        "score": "39.80m"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Babajide Cole (SS 2)",
        "score": "37.50m"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Osasere Igbinosa (SS 3)",
        "score": "36.20m"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Joshua Akpan (SS 3)",
        "score": "34.10m"
      }
    },
    "notes": "Briggs double gold in throws.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-discus-girls",
    "name": "Discus (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 24,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Boma Jumbo (SS 3)",
        "score": "31.40m"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Chioma Okoro (SS 3)",
        "score": "29.80m"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Ronke Adebayo (SS 2)",
        "score": "28.20m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Aisha Mohammed (SS 2)",
        "score": "26.50m"
      }
    },
    "notes": "Boma Jumbo secures second throwing gold.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-triplejump-boys",
    "name": "Triple Jump / Hop, Step & Jump (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 25,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Victor Oshodi (SS 2)",
        "score": "13.90m"
      },
      "second": {
        "houseId": "swift",
        "athlete": "Abel Munachimso (JSS 1)",
        "score": "13.45m"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "Emeka Obi (SS 2)",
        "score": "13.10m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Samuel Olatunji (SS 2)",
        "score": "12.75m"
      }
    },
    "notes": "Oshodi hits 13.90m on 2nd attempt.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-triplejump-girls",
    "name": "Triple Jump / Hop, Step & Jump (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 26,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Michelle Olurotimi (SS 3)",
        "score": "11.80m"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Fatima Dangote (SS 2)",
        "score": "11.35m"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Zainab Lawal (SS 1)",
        "score": "10.90m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Blessing Eze (SS 2)",
        "score": "10.45m"
      }
    },
    "notes": "Michelle Olurotimi hop-step-jump mastery.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-longjump-boys",
    "name": "Long Jump (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 27,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "eagle",
        "athlete": "Donald Ariyo (SS 3)",
        "score": "6.75m"
      },
      "second": {
        "houseId": "phoenix",
        "athlete": "Chinedu Ihejiahi (SS 3)",
        "score": "6.62m"
      },
      "third": {
        "houseId": "swift",
        "athlete": "Tunde Bakare (SS 1)",
        "score": "6.30m"
      },
      "fourth": {
        "houseId": "merlin",
        "athlete": "Kenechi Okonkwo (SS 2)",
        "score": "6.05m"
      }
    },
    "notes": "Donald Ariyo leaps 6.75m for Eagle gold.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-longjump-girls",
    "name": "Long Jump (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 28,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "athlete": "Adefilewa Adebimpe (SS 3)",
        "score": "5.45m"
      },
      "second": {
        "houseId": "merlin",
        "athlete": "Michelle Olurotimi (SS 3)",
        "score": "5.32m"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Amara Nnamdi (JSS 3)",
        "score": "5.15m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Chioma Adeleke (SS 1)",
        "score": "4.90m"
      }
    },
    "notes": "Adebimpe leaps past 5.40m mark.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-highjump-boys",
    "name": "High Jump (Boys)",
    "category": "Field",
    "gender": "Boys",
    "order": 29,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "athlete": "Chinedu Ihejiahi (SS 3)",
        "score": "1.88m"
      },
      "second": {
        "houseId": "eagle",
        "athlete": "Samuel Olatunji (SS 2)",
        "score": "1.82m"
      },
      "third": {
        "houseId": "merlin",
        "athlete": "David Kalu (SS 1)",
        "score": "1.76m"
      },
      "fourth": {
        "houseId": "swift",
        "athlete": "Farouk Alabi (SS 1)",
        "score": "1.70m"
      }
    },
    "notes": "Ihejiahi clears 1.88m on first attempt.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "field-highjump-girls",
    "name": "High Jump (Girls)",
    "category": "Field",
    "gender": "Girls",
    "order": 30,
    "status": "completed",
    "pointsMatrix": {
      "first": 0,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "athlete": "Grace Oladipo (SS 3)",
        "score": "1.62m"
      },
      "second": {
        "houseId": "swift",
        "athlete": "Adefilewa Adebimpe (SS 3)",
        "score": "1.58m"
      },
      "third": {
        "houseId": "phoenix",
        "athlete": "Fatima Dangote (SS 2)",
        "score": "1.52m"
      },
      "fourth": {
        "houseId": "eagle",
        "athlete": "Joy Danjuma (SS 2)",
        "score": "1.45m"
      }
    },
    "notes": "Grace Oladipo clears bar at 1.62m.",
    "format": "multi",
    "contenders": null,
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "bb-knockout-sf1",
    "name": "Basketball Semi-Final 1: Phoenix vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "semi_final",
    "contenders": [
      "phoenix",
      "eagle"
    ],
    "scheduledTime": "11:30",
    "order": 31,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "38 - 32",
        "points": 3
      },
      "second": {
        "houseId": "eagle",
        "score": "32 - 38",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Chinedu Ihejiahi",
          "houseId": "phoenix",
          "minute": "16 pts"
        },
        {
          "athlete": "Donald Ariyo",
          "houseId": "eagle",
          "minute": "14 pts"
        },
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "12 pts"
        }
      ]
    },
    "notes": "Phoenix stages 4th-quarter comeback to earn Championship Final ticket.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "bb-knockout-sf2",
    "name": "Basketball Semi-Final 2: Swift vs Merlin",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "semi_final",
    "contenders": [
      "swift",
      "merlin"
    ],
    "scheduledTime": "12:15",
    "order": 32,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "swift",
        "score": "42 - 39",
        "points": 3
      },
      "second": {
        "houseId": "merlin",
        "score": "39 - 42",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Adefilewa Adebimpe",
          "houseId": "swift",
          "minute": "18 pts"
        },
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "15 pts"
        },
        {
          "athlete": "Zainab Lawal",
          "houseId": "swift",
          "minute": "12 pts"
        }
      ]
    },
    "notes": "Clutch buzzer-beater 3-pointer propels Swift into the final.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "bb-knockout-third",
    "name": "Basketball 3rd Place Match (Bronze Medal): Merlin vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "third_place",
    "contenders": [
      "merlin",
      "eagle"
    ],
    "scheduledTime": "13:00",
    "order": 33,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "score": "34 - 30",
        "points": 60
      },
      "second": {
        "houseId": "eagle",
        "score": "30 - 34",
        "points": 30
      },
      "scorers": [
        {
          "athlete": "David Kalu",
          "houseId": "merlin",
          "minute": "14 pts"
        },
        {
          "athlete": "Chioma Adeleke",
          "houseId": "eagle",
          "minute": "11 pts"
        }
      ]
    },
    "notes": "Merlin holds on defensively to claim the Basketball Bronze Medal.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "bb-knockout-final",
    "name": "Basketball Championship Final (Gold & Silver): Phoenix vs Swift",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "final",
    "contenders": [
      "phoenix",
      "swift"
    ],
    "scheduledTime": "13:45",
    "order": 34,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "45 - 41",
        "points": 150
      },
      "second": {
        "houseId": "swift",
        "score": "41 - 45",
        "points": 90
      },
      "scorers": [
        {
          "athlete": "Chinedu Ihejiahi",
          "houseId": "phoenix",
          "minute": "22 pts"
        },
        {
          "athlete": "Adefilewa Adebimpe",
          "houseId": "swift",
          "minute": "19 pts"
        },
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "14 pts"
        }
      ]
    },
    "notes": "Phoenix captures Gold in an electrifying Basketball Championship clash!",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md1-m1",
    "name": "Football Group Stage — Matchday 1: Phoenix vs Merlin",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 1,
    "contenders": [
      "phoenix",
      "merlin"
    ],
    "scheduledTime": "10:00",
    "order": 35,
    "status": "completed",
    "pointsMatrix": {
      "first": 3,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "2 - 1",
        "points": 3
      },
      "second": {
        "houseId": "merlin",
        "score": "1 - 2",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Kenechi Okonkwo",
          "houseId": "phoenix",
          "minute": "18'"
        },
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "41'"
        },
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "72'"
        }
      ]
    },
    "notes": "Phoenix opens the group stage with a clinical 2-1 victory over Merlin.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md1-m2",
    "name": "Football Group Stage — Matchday 1: Swift vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 1,
    "contenders": [
      "swift",
      "eagle"
    ],
    "scheduledTime": "10:45",
    "order": 36,
    "status": "completed",
    "pointsMatrix": {
      "first": 3,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "swift",
        "score": "2 - 0",
        "points": 3
      },
      "second": {
        "houseId": "eagle",
        "score": "0 - 2",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Tunde Bakare",
          "houseId": "swift",
          "minute": "24'"
        },
        {
          "athlete": "Abel Munachimso",
          "houseId": "swift",
          "minute": "63'"
        }
      ]
    },
    "notes": "Swift collects 3 points with a disciplined clean-sheet win against Eagle.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md2-m1",
    "name": "Football Group Stage — Matchday 2: Phoenix vs Swift",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 2,
    "contenders": [
      "phoenix",
      "swift"
    ],
    "scheduledTime": "11:30",
    "order": 37,
    "status": "completed",
    "pointsMatrix": {
      "first": 1,
      "second": 1,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "1 - 1",
        "points": 1
      },
      "second": {
        "houseId": "swift",
        "score": "1 - 1",
        "points": 1
      },
      "scorers": [
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "35'"
        },
        {
          "athlete": "Farouk Alabi",
          "houseId": "swift",
          "minute": "58'"
        }
      ]
    },
    "notes": "High octane top-of-table clash ends in a thrilling 1-1 draw (1 point each).",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md2-m2",
    "name": "Football Group Stage — Matchday 2: Merlin vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 2,
    "contenders": [
      "merlin",
      "eagle"
    ],
    "scheduledTime": "12:15",
    "order": 38,
    "status": "completed",
    "pointsMatrix": {
      "first": 3,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "score": "3 - 1",
        "points": 3
      },
      "second": {
        "houseId": "eagle",
        "score": "1 - 3",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Babajide Cole",
          "houseId": "merlin",
          "minute": "19'"
        },
        {
          "athlete": "Donald Ariyo",
          "houseId": "eagle",
          "minute": "44'"
        },
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "62'"
        },
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "79'"
        }
      ]
    },
    "notes": "Emeka Obi brace powers Merlin to a crucial 3-1 victory in Matchday 2.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md3-m1",
    "name": "Football Group Stage — Matchday 3: Phoenix vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 3,
    "contenders": [
      "phoenix",
      "eagle"
    ],
    "scheduledTime": "13:00",
    "order": 39,
    "status": "completed",
    "pointsMatrix": {
      "first": 3,
      "second": 0,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "3 - 0",
        "points": 3
      },
      "second": {
        "houseId": "eagle",
        "score": "0 - 3",
        "points": 0
      },
      "scorers": [
        {
          "athlete": "Kenechi Okonkwo",
          "houseId": "phoenix",
          "minute": "14'"
        },
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "51'"
        },
        {
          "athlete": "Chinedu Ihejiahi",
          "houseId": "phoenix",
          "minute": "80'"
        }
      ]
    },
    "notes": "Phoenix tops the group with 7 points from 3 matches to book a final ticket.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-group-md3-m2",
    "name": "Football Group Stage — Matchday 3: Merlin vs Swift",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "group",
    "matchday": 3,
    "contenders": [
      "merlin",
      "swift"
    ],
    "scheduledTime": "13:45",
    "order": 40,
    "status": "completed",
    "pointsMatrix": {
      "first": 1,
      "second": 1,
      "third": 0,
      "fourth": 0
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "score": "2 - 2",
        "points": 1
      },
      "second": {
        "houseId": "swift",
        "score": "2 - 2",
        "points": 1
      },
      "scorers": [
        {
          "athlete": "Tunde Bakare",
          "houseId": "swift",
          "minute": "11'"
        },
        {
          "athlete": "Babajide Cole",
          "houseId": "merlin",
          "minute": "29'"
        },
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "68'"
        },
        {
          "athlete": "Farouk Alabi",
          "houseId": "swift",
          "minute": "84'"
        }
      ]
    },
    "notes": "Farouk Alabi's 84th minute equalizer seals 2nd place and a final ticket for Swift!",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-knockout-third",
    "name": "Football 3rd Place Match (Bronze Medal): Merlin vs Eagle",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "third_place",
    "contenders": [
      "merlin",
      "eagle"
    ],
    "scheduledTime": "14:30",
    "order": 41,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "merlin",
        "score": "2 - 1",
        "points": 60
      },
      "second": {
        "houseId": "eagle",
        "score": "1 - 2",
        "points": 30
      },
      "scorers": [
        {
          "athlete": "Emeka Obi",
          "houseId": "merlin",
          "minute": "22'"
        },
        {
          "athlete": "Donald Ariyo",
          "houseId": "eagle",
          "minute": "53'"
        },
        {
          "athlete": "Babajide Cole",
          "houseId": "merlin",
          "minute": "77'"
        }
      ]
    },
    "notes": "Babajide Cole winner seals the Football Bronze Medal for Merlin.",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  },
  {
    "id": "fb-knockout-final",
    "name": "Football Championship Final (Gold & Silver): Phoenix vs Swift",
    "category": "Team",
    "gender": "Open",
    "format": "h2h",
    "stage": "knockout",
    "knockoutRound": "final",
    "contenders": [
      "phoenix",
      "swift"
    ],
    "scheduledTime": "15:15",
    "order": 42,
    "status": "completed",
    "pointsMatrix": {
      "first": 150,
      "second": 90,
      "third": 60,
      "fourth": 30
    },
    "results": {
      "first": {
        "houseId": "phoenix",
        "score": "2 - 1",
        "points": 150
      },
      "second": {
        "houseId": "swift",
        "score": "1 - 2",
        "points": 90
      },
      "scorers": [
        {
          "athlete": "Victor Oshodi",
          "houseId": "phoenix",
          "minute": "31'"
        },
        {
          "athlete": "Tunde Bakare",
          "houseId": "swift",
          "minute": "59'"
        },
        {
          "athlete": "Kenechi Okonkwo",
          "houseId": "phoenix",
          "minute": "82'"
        }
      ]
    },
    "notes": "Kenechi Okonkwo's towering 82nd minute header crowns Phoenix the 2026 Football Champions!",
    "completedAt": "2026-09-25T16:00:00.000Z",
    "updatedAt": "2026-09-25T16:00:00.000Z",
    "lastEditedBy": {
      "adminId": "ADM-003",
      "name": "Ihechukwu",
      "email": "1h3chukwu@gmail.com",
      "role": "super_admin"
    },
    "lastEditedFormatted": "25 Sep, 16:00"
  }
];

export const DEMO_SAMPLE_SCORES = [];

export const INITIAL_STUDENTS = [
  {
    "id": "stu-001",
    "name": "Abebi Akinsanya",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-002",
    "name": "Abel Munachimso",
    "houseId": "swift",
    "gender": "Boys",
    "grade": "JSS 1"
  },
  {
    "id": "stu-003",
    "name": "Abieuwa Agbongiator",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-004",
    "name": "Adachukwu Ehiogu",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-005",
    "name": "Ade-Ojo Semilore",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-006",
    "name": "Adedipe Afolaoluwabi Adeife",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-007",
    "name": "Adefilewa Adebimpe",
    "houseId": "swift",
    "gender": "Girls",
    "grade": "SS 3"
  },
  {
    "id": "stu-008",
    "name": "Adekunle Sanni-Omotosho",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-009",
    "name": "Adeniye Feyisayo",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-010",
    "name": "Adeola Ogunlana",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-011",
    "name": "Adeoluwa Ojo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-012",
    "name": "Adeoye Fadekemi",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-013",
    "name": "Adeoye Funmilade",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-014",
    "name": "Adeoye Oluwadamilare",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-015",
    "name": "Adesuwa Oware",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-016",
    "name": "Afolabi Adejola",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-017",
    "name": "Aidelohi Iriah",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-018",
    "name": "Ajayi Oladunni",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-019",
    "name": "Ajiri Akpavie",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-020",
    "name": "Akanbi Ireolaoluwa",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-021",
    "name": "Akerele Joshua",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-022",
    "name": "Akinfolarin Akinloye",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-023",
    "name": "Akpavie Ibiso",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-024",
    "name": "Al'Anan Ogunfowoke",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-025",
    "name": "Alade Tise",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-026",
    "name": "Alonge Oluwatenianu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-027",
    "name": "Aluko Oluwatoye",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-028",
    "name": "Anifowose Mojolaoluwa",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-029",
    "name": "Arokoyo Tomiloba",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-030",
    "name": "Awobanjo Rowland",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-031",
    "name": "Ayomide Ajamolaya",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-032",
    "name": "Ayomikun Jeje",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-033",
    "name": "Ayomitide Adeniran",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-034",
    "name": "Bamidele Folakunmi",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-035",
    "name": "Boluwatife Keshinro",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-036",
    "name": "Caroline Oware",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-037",
    "name": "Chimamanda Okoh-Felix",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-038",
    "name": "Chinedu Ihejiahi",
    "houseId": "phoenix",
    "gender": "Boys",
    "grade": "SS 3"
  },
  {
    "id": "stu-039",
    "name": "Chisom Nzewi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-040",
    "name": "Chizara Nzewi",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-041",
    "name": "Chukwukadibia Kamdikora",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-042",
    "name": "Dagba Emmanuella",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-043",
    "name": "Damilare Akano",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-044",
    "name": "Daniel Adefisola Adebimpe",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-045",
    "name": "Daniel Diya",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-046",
    "name": "Daniel Omorodion",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-047",
    "name": "Daniella Ehizele Momoh",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-048",
    "name": "David Adefisoye Adebimpe",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-049",
    "name": "David Animashawun",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-050",
    "name": "David Sani",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-051",
    "name": "Deborah Festus-Ugwu",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-052",
    "name": "Demilade Ogunlana",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-053",
    "name": "Dinorah Acholonu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-054",
    "name": "Divine Samuel",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-055",
    "name": "Dolabomi Onipede",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-056",
    "name": "Donald Ariyo",
    "houseId": "eagle",
    "gender": "Boys",
    "grade": "SS 3"
  },
  {
    "id": "stu-057",
    "name": "Eden Hephzibah Araoluwa Kolawole",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-058",
    "name": "Egede Hadassah",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-059",
    "name": "Ehiogu Annabel",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-060",
    "name": "Eliana Umeh",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-061",
    "name": "Elijah Nwachukwu",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-062",
    "name": "Eliona Chuks-Adizue",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-063",
    "name": "Emmanuel Adedokun",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-064",
    "name": "Emmanuel Femi-Odulaja",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-065",
    "name": "Emmanuella Ayasi",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-066",
    "name": "Erioluwakanmi Ariyo",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-067",
    "name": "Esthella Ezino-Ogwah",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-068",
    "name": "Esther Laniyan",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-069",
    "name": "Esther Oghenerukvewe Ohre",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-070",
    "name": "Evan Kehinde",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-071",
    "name": "Fabusuyi Adeoluwa",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-072",
    "name": "Faiz Sulaimon",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-073",
    "name": "Fatimah Adeniye",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-074",
    "name": "Faustina Onuonyeariuzor",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-075",
    "name": "Feyisayo Arokoyo",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-076",
    "name": "Fiyinfoluwa Abioye",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-077",
    "name": "Folasikemi Oguntokun",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-078",
    "name": "Folorunsho Remilekun",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-079",
    "name": "Forehanmi Oyenuga",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-080",
    "name": "Fortune Enebeli",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-081",
    "name": "Gabriel Amienghemen",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-082",
    "name": "Hadassah Ojo",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-083",
    "name": "Ifebubechukwu Akparanta",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-084",
    "name": "Ihechukwu Nnanna",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-085",
    "name": "Inioluwa Anifowose",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-086",
    "name": "Ireoluwa Omotunde",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-087",
    "name": "Isaac Ogungbefun",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-088",
    "name": "Isam Momodu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-089",
    "name": "Iseoluwa Biyi Oyebande",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-090",
    "name": "Iteoluwakiishi Omolayo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-091",
    "name": "Jaden Longe",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-092",
    "name": "Jason Olaleye",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-093",
    "name": "Jeane Jeje",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-094",
    "name": "Jeremiah Attat",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-095",
    "name": "Jeremy Onyeagu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-096",
    "name": "Jessica Eke",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-097",
    "name": "Jomiloju Iwaloye",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-098",
    "name": "Joseph Omoduemuke",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-099",
    "name": "Joshua Achufusi",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-100",
    "name": "Juan Jeje",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-101",
    "name": "Juwon Israel",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-102",
    "name": "Kaima Nkem-Aribodor",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-103",
    "name": "Kamsi Chibuzo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-104",
    "name": "Kamsiyochukwu Ezeuko",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-105",
    "name": "Kareem Oluwaseyifunmi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-106",
    "name": "Kasiemobi Zurike",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-107",
    "name": "Kibenojo Sule",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-108",
    "name": "Kolawole Akano",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-109",
    "name": "Korede Asine",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-110",
    "name": "Kosisochi Iwueze",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-111",
    "name": "Kyra Ibuoka",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-112",
    "name": "Lekan-Adu Jomiloju",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-113",
    "name": "Levi Oladaniels",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-114",
    "name": "Mario Inioluwa",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-115",
    "name": "Michelle Olurotimi",
    "houseId": "merlin",
    "gender": "Girls",
    "grade": "SS 3"
  },
  {
    "id": "stu-116",
    "name": "Mirelle Ntuk",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-117",
    "name": "Mmachukwu Ehiogu",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-118",
    "name": "Mofiyinfoluwa Olasemo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-119",
    "name": "Momodu Amani",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-120",
    "name": "Moses Grant",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-121",
    "name": "Mosinmiloluwa Adegbuyi-George",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-122",
    "name": "Nathan Omorodion",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-123",
    "name": "Nathaniel Akerele",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-124",
    "name": "Nathaniel Olurotimi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-125",
    "name": "Neso-Nathan Igwe",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-126",
    "name": "Nicole Chukwuma",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-127",
    "name": "Nicole Osoikhia",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-128",
    "name": "Nnanna Akuchukwu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-129",
    "name": "Nonso Obihai",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-130",
    "name": "Nwawulu Oluchi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-131",
    "name": "Obanijesu Femi-Odulaja",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-132",
    "name": "Obanlaloluwa Oredola",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-133",
    "name": "Obichukwu Ehiogu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-134",
    "name": "Oche Agbongiator",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-135",
    "name": "Ogbu Emmanuella",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-136",
    "name": "Oghenefejiro Ohre",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-137",
    "name": "Ogwah Emmanuel",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-138",
    "name": "Ojiubabia Chuks-Adizue",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-139",
    "name": "Olamide Okubadejo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-140",
    "name": "Olamijulo Agboola",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-141",
    "name": "Olamiposi Banjo",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-142",
    "name": "Olivia Agada",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-143",
    "name": "Oluwadarapupo Segun-Jimoh",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-144",
    "name": "Oluwadarasimi Alade",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-145",
    "name": "Oluwafifunmi Adeyemi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-146",
    "name": "Oluwafiyisi Adeshoga",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-147",
    "name": "Oluwafoyinsola Rahman",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-148",
    "name": "Oluwamoriki Olarewaju",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-149",
    "name": "Oluwanifemi Alade",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-150",
    "name": "Oluwanifemi Attat",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-151",
    "name": "Oluwasemilore Adeniran",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-152",
    "name": "Oluwasinaayomi Oduoye",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-153",
    "name": "Oluwatamilore Ogundimu",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-154",
    "name": "Oluwatamilore Ojo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-155",
    "name": "Oluwatobi Tugbobo",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-156",
    "name": "Oluwatobiloba Segun-Jimoh",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-157",
    "name": "Oluwatoni Adegbite-Olarewaju",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-158",
    "name": "Oluwatoni Alaka",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-159",
    "name": "Oluyemi Williams Chidalu",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-160",
    "name": "Omoduemuke Michelle",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 3"
  },
  {
    "id": "stu-161",
    "name": "Omomofe Moyinoluwa",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  },
  {
    "id": "stu-162",
    "name": "Omorodion Alexander Osayukidolason",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 3"
  },
  {
    "id": "stu-163",
    "name": "Omoseona Eghes-Eyieyien",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-164",
    "name": "Onah Merad",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 1"
  },
  {
    "id": "stu-165",
    "name": "Onipede Olasubomi",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 2"
  },
  {
    "id": "stu-166",
    "name": "Onome Akpavie",
    "houseId": "general",
    "gender": "General",
    "grade": "SS 2"
  },
  {
    "id": "stu-167",
    "name": "Onyeagu Daisy",
    "houseId": "general",
    "gender": "General",
    "grade": "JSS 1"
  }
];

/**
 * Initial Seed Data for Juilliard Prefectship Cup
 * Teams: Team Ihechukwu (Red), Team Fortune (Blue), Team Osaruyi (Green), Team Titemi (Purple)
 */
export const INITIAL_PREFECTORIAL_TEAMS = [
  {
    id: "team-ihechukwu",
    name: "Team Ihechukwu",
    shortName: "Ihechukwu",
    motto: "Leadership, Valor & Victory",
    mascot: "Crown & Lion",
    color: "#EF4444",          // Solid Red
    colorSecondary: "#DC2626",
    colorDark: "#7F1D1D",
    bgGradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
    glowColor: "rgba(239, 68, 68, 0.4)",
    textColor: "#FFFFFF",
    captain: "Ihechukwu (Senior Prefect)",
    teachers: ["Mr. Harrison (Head Patron)", "Mrs. Angela Davies"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 0,
    silverCount: 0,
    bronzeCount: 0,
    fourthCount: 0,
    totalMedals: 0
  },
  {
    id: "team-fortune",
    name: "Team Fortune",
    shortName: "Fortune",
    motto: "Fortune Favors the Bold & Relentless",
    mascot: "Falcon of Victory",
    color: "#2563EB",          // Solid Blue
    colorSecondary: "#1D4ED8",
    colorDark: "#1E3A8A",
    bgGradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
    glowColor: "rgba(37, 99, 235, 0.4)",
    textColor: "#FFFFFF",
    captain: "Fortune (Sports Prefect)",
    teachers: ["Dr. Evelyn Wright (Head Patron)", "Coach Adams"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 0,
    silverCount: 0,
    bronzeCount: 0,
    fourthCount: 0,
    totalMedals: 0
  },
  {
    id: "team-osaruyi",
    name: "Team Osaruyi",
    shortName: "Osaruyi",
    motto: "Relentless Drive, Speed & Discipline",
    mascot: "Emerald Stallion",
    color: "#10B981",          // Emerald Green
    colorSecondary: "#059669",
    colorDark: "#064E3B",
    bgGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    glowColor: "rgba(16, 185, 129, 0.4)",
    textColor: "#FFFFFF",
    captain: "Osaruyi (Senior Prefect)",
    teachers: ["Coach Ibrahim Bello (Head Patron)", "Ms. Fatima Bello"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 0,
    silverCount: 0,
    bronzeCount: 0,
    fourthCount: 0,
    totalMedals: 0
  },
  {
    id: "team-titemi",
    name: "Team Titemi",
    shortName: "Titemi",
    motto: "Strength in Unity, Focus & Power",
    mascot: "Purple Lightning",
    color: "#8B5CF6",          // Royal Purple
    colorSecondary: "#7C3AED",
    colorDark: "#4C1D95",
    bgGradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    glowColor: "rgba(139, 92, 246, 0.4)",
    textColor: "#FFFFFF",
    captain: "Titemi (Senior Prefect)",
    teachers: ["Ms. Rebecca Taylor (Head Patron)", "Mr. David Alabi"],
    totalPoints: 0,
    teamPoints: 0,
    teamWins: 0,
    teamDraws: 0,
    teamLosses: 0,
    goldCount: 0,
    silverCount: 0,
    bronzeCount: 0,
    fourthCount: 0,
    totalMedals: 0
  }
];

export const INITIAL_PREFECTORIAL_EVENTS = [
  {
    id: "pref-football-semi-1",
    name: "Football Semi-Final: Team Ihechukwu vs Team Fortune",
    category: "Football",
    gender: "Boys",
    order: 1,
    format: "h2h",
    contenders: ["team-ihechukwu", "team-fortune"],
    status: "upcoming",
    scheduledTime: "09:00",
    results: null,
    notes: "Opening clash of the Prefectship Football tournament."
  },
  {
    id: "pref-football-semi-2",
    name: "Football Semi-Final: Team Osaruyi vs Team Titemi",
    category: "Football",
    gender: "Boys",
    order: 2,
    format: "h2h",
    contenders: ["team-osaruyi", "team-titemi"],
    status: "upcoming",
    scheduledTime: "10:15",
    results: null,
    notes: "High stakes football semifinal battle."
  },
  {
    id: "pref-sprint-100m-boys",
    name: "100m Prefects Sprint (Boys)",
    category: "Track",
    gender: "Boys",
    order: 3,
    format: "multi",
    status: "upcoming",
    scheduledTime: "11:30",
    pointsMatrix: { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes: "The fastest senior prefects race for track glory."
  },
  {
    id: "pref-sprint-100m-girls",
    name: "100m Prefects Sprint (Girls)",
    category: "Track",
    gender: "Girls",
    order: 4,
    format: "multi",
    status: "upcoming",
    scheduledTime: "12:00",
    pointsMatrix: { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes: "Girls 100m sprint championship."
  },
  {
    id: "pref-basketball-clash",
    name: "Basketball Clash: Team Fortune vs Team Osaruyi",
    category: "Basketball",
    gender: "Boys",
    order: 5,
    format: "h2h",
    contenders: ["team-fortune", "team-osaruyi"],
    status: "upcoming",
    scheduledTime: "12:30",
    results: null,
    notes: "Fast-paced offensive basketball shootout."
  },
  {
    id: "pref-relay-4x100m",
    name: "4x100m Prefectship Squad Relay",
    category: "Track",
    gender: "All",
    order: 6,
    format: "multi",
    status: "upcoming",
    scheduledTime: "13:30",
    pointsMatrix: { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes: "High adrenaline 4-squad baton relay race."
  },
  {
    id: "pref-table-tennis",
    name: "Table Tennis Singles Championship",
    category: "Field",
    gender: "Boys",
    order: 7,
    format: "multi",
    status: "upcoming",
    scheduledTime: "14:00",
    pointsMatrix: { first: 0, second: 0, third: 0, fourth: 0 },
    results: null,
    notes: "Precision and reflexes on the center table."
  },
  {
    id: "pref-volleyball-clash",
    name: "Volleyball Clash: Team Ihechukwu vs Team Titemi",
    category: "Team Sports",
    gender: "All",
    order: 8,
    format: "h2h",
    contenders: ["team-ihechukwu", "team-titemi"],
    status: "upcoming",
    scheduledTime: "14:30",
    results: null,
    notes: "Spikes and blocks at the main court."
  },
  {
    id: "pref-football-final",
    name: "Football Championship Final",
    category: "Football",
    gender: "Boys",
    order: 9,
    format: "h2h",
    contenders: ["team-ihechukwu", "team-osaruyi"],
    status: "upcoming",
    scheduledTime: "15:00",
    results: null,
    notes: "The Ultimate Gold Medal Football Match of the Prefectship Cup!"
  },
  {
    id: "pref-basketball-final",
    name: "Basketball Championship Final",
    category: "Basketball",
    gender: "Boys",
    order: 10,
    format: "h2h",
    contenders: ["team-fortune", "team-titemi"],
    status: "upcoming",
    scheduledTime: "15:45",
    results: null,
    notes: "Fast-break shootout for the Basketball Trophy."
  },
  {
    id: "pref-tug-of-war",
    name: "Tug-of-War: Supremacy Pull",
    category: "Novelty",
    gender: "All",
    order: 11,
    format: "multi",
    status: "upcoming",
    scheduledTime: "16:30",
    results: null,
    notes: "8-puller squad battle of pure strength."
  },
  {
    id: "pref-200m-dash",
    name: "200m Sprint Clash",
    category: "Track",
    gender: "Boys",
    order: 12,
    format: "multi",
    status: "upcoming",
    scheduledTime: "17:00",
    results: null,
    notes: "Curved track sprint showdown."
  }
];

export const INITIAL_PREFECTSHIP_TEAMS = INITIAL_PREFECTORIAL_TEAMS;
export const INITIAL_PREFECTSHIP_EVENTS = INITIAL_PREFECTORIAL_EVENTS;


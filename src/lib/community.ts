// Community types and utilities

export interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export interface Comment {
  id: string;
  anonymousId: string;
  content: string;
  timestamp: number;
  flagCount: number;
  flaggedByUser: boolean;
}

export interface Post {
  id: string;
  anonymousId: string;
  content: string;
  timestamp: number;
  milestone?: string;
  reactions: Reaction[];
  comments: Comment[];
  flagCount: number;
  flaggedByUser: boolean;
}

export const FLAG_THRESHOLD = 3;

// Generate anonymous ID using hash (simulating ZK-proof anonymization)
export const generateAnonymousId = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const adjectives = [
    "Brave",
    "Strong",
    "Calm",
    "Wise",
    "Kind",
    "Bold",
    "Free",
    "Pure",
    "True",
    "Hope",
  ];
  const nouns = [
    "Phoenix",
    "Eagle",
    "Lion",
    "Star",
    "Wave",
    "Light",
    "Path",
    "Soul",
    "Heart",
    "Mind",
  ];
  const adj = adjectives[Math.abs(hash) % adjectives.length];
  const noun = nouns[Math.abs(hash >> 8) % nouns.length];
  const num = Math.abs(hash % 100);
  return `${adj}${noun}${num}`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

export const getDefaultReactions = (): Reaction[] => [
  { emoji: "👍", count: 0, userReacted: false },
  { emoji: "❤️", count: 0, userReacted: false },
  { emoji: "👏", count: 0, userReacted: false },
  { emoji: "💪", count: 0, userReacted: false },
];

export const getSamplePosts = (): Post[] => [
  {
    id: "1",
    anonymousId: "SoberCC",
    content:
      "The idea of never drinking again still frightens me, at the same time I never want to drink again. Will just keep at it, one day after the next. I feel free right now! And like I'm on the right path.",
    timestamp: Date.now() - 86400000 * 2,
    reactions: [
      { emoji: "👍", count: 17, userReacted: false },
      { emoji: "😐", count: 1, userReacted: false },
      { emoji: "🎉", count: 8, userReacted: false },
      { emoji: "❤️", count: 22, userReacted: false },
    ],
    comments: [],
    flagCount: 0,
    flaggedByUser: false,
  },
  {
    id: "2",
    anonymousId: "JohnSmith_99",
    content:
      "I've officially made it to 6 months sober. It hasn't been easy, but every morning waking up without a hangover makes it worth it.",
    milestone: "🎉 Milestone Reached!",
    timestamp: Date.now() - 7200000,
    reactions: [
      { emoji: "👏", count: 45, userReacted: false },
      { emoji: "💪", count: 12, userReacted: false },
    ],
    comments: [],
    flagCount: 0,
    flaggedByUser: false,
  },
  {
    id: "3",
    anonymousId: "AliceW",
    content:
      "Just checking in. Had a rough craving today but went for a run instead. Feeling much better now. Stay strong everyone!",
    timestamp: Date.now() - 18000000,
    reactions: [{ emoji: "❤️", count: 8, userReacted: false }],
    comments: [],
    flagCount: 0,
    flaggedByUser: false,
  },
];

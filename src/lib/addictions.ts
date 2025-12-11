export interface AddictionCategory {
  name: string;
  items: string[];
}

export const addictionCategories: AddictionCategory[] = [
  {
    name: "Benzodiazepines",
    items: [
      "Alprazolam",
      "Barbiturates",
      "Buprenorphine",
      "Codeine",
      "Fentanyl",
      "Heroin",
      "Kratom",
      "Lean (Codeine Mixture)",
      "Methadone",
      "Opiates",
      "Suboxone",
      "Xanax",
    ],
  },
  {
    name: "Alcoholic Drinks",
    items: [
      "Alcohol",
      "Beer",
      "Binge Drinking",
      "Booze",
      "Bourbon",
      "Gin",
      "Rum",
      "Tequila",
      "Vodka",
      "Whiskey",
      "Wine",
    ],
  },
  {
    name: "Nicotine and Tobacco",
    items: [
      "Chewing Tobacco",
      "Cigarettes",
      "Nicotine",
      "Snus",
      "Tobacco",
      "Vaping",
      "Zyn",
    ],
  },
  {
    name: "Cannabis Products",
    items: [
      "Cannabis",
      "Cannabis (Synthetic)",
      "Marijuana",
      "Marijuana (Synthetic)",
      "Vaping (THC)",
    ],
  },
  {
    name: "Stimulants",
    items: [
      "3-MMC",
      "4-MMC",
      "Adderall",
      "Alpha-PVP (Flakka)",
      "Amphetamines",
      "Bath Salts",
      "Cocaine",
      "Crack Cocaine",
      "Crystal Meth",
      "Mephedrone",
      "Methamphetamine",
      "Methcathinone (CAT)",
      "Methylphenidate",
      "Mixed Amphetamine Salts",
      "Ritalin",
      "Synthetic Cathinones",
    ],
  },
  {
    name: "Other Drugs",
    items: [
      "Antidepressants",
      "Benadryl",
      "Dextromethorphan (DXM)",
      "Diphenhydramine",
      "Ecstasy",
      "Gamma-Hydroxybutyrate (GHB)",
      "Inhalants",
      "Ketamine",
      "Lisdexamfetamine",
      "LSD",
      "Lyrica",
      "Mescaline",
      "Muscle Relaxants",
      "Nasal Spray",
      "Nitrous Oxide",
      "Pregabalin",
      "Salvia",
      "Sleeping Aids",
      "Solvents",
      "Tramadol",
    ],
  },
  {
    name: "Food and Caffeine",
    items: [
      "Bread",
      "Caffeine",
      "Carbohydrates",
      "Cookies",
      "Dairy Products",
      "Energy Drinks",
      "Fast Food",
      "Gluten",
      "Junk Food",
      "Meat & Dairy",
      "Soft Drinks",
      "Sugar",
      "Sweets",
    ],
  },
  {
    name: "Eating Disorders",
    items: [
      "Binge Eating",
      "Binging and Purging",
      "Chewing and Spitting",
      "Eating Disorder",
      "Eating Disorder (Under Eating)",
      "Food Restricting",
      "Laxatives",
      "Purging",
    ],
  },
  {
    name: "Sexual Behaviours",
    items: ["Chemsex", "Masturbation", "Pornography", "Sex"],
  },
  {
    name: "Body Focused Behaviours",
    items: [
      "Cheek Biting",
      "Hair Pulling",
      "Knuckle Cracking",
      "Lip Biting",
      "Nail Biting",
      "Pica (Non-food Eating)",
      "Self-harm",
      "Skin Picking",
    ],
  },
  {
    name: "Impulsive Behaviours",
    items: [
      "Compulsive Spending",
      "Excessive Exercising",
      "Gambling",
      "Online Shopping",
      "Shoplifting",
      "Stealing",
    ],
  },
  {
    name: "Social Behaviours",
    items: [
      "Anger",
      "Attention Seeking",
      "Bad Language (Swearing)",
      "Codependency",
      "Gossiping",
      "Lying",
      "Stalking",
      "Toxic Relationships",
    ],
  },
  {
    name: "Technology",
    items: [
      "Chatbots (AI)",
      "Dating Apps",
      "Doomscrolling",
      "Instagram",
      "Internet",
      "Online Videos",
      "Short Form Videos",
      "Social Media",
      "TikTok",
      "Video Games",
      "Virtual Reality",
    ],
  },
];

// Get all addictions as a flat list
export function getAllAddictions(): string[] {
  return addictionCategories.flatMap((category) => category.items);
}

// Search addictions by query
export function searchAddictions(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return getAllAddictions().filter((addiction) =>
    addiction.toLowerCase().includes(lowerQuery)
  );
}

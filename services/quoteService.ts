export interface SleepQuote {
  text: string;
  author: string;
}

const SLEEP_QUOTES: SleepQuote[] = [
  {
    text: "Sleep is the best meditation.",
    author: "Dalai Lama",
  },
  {
    text: "A good laugh and a long sleep are the best cures in the doctor's book.",
    author: "Irish Proverb",
  },
  {
    text: "Sleep is the golden chain that ties health and our bodies together.",
    author: "Thomas Dekker",
  },
  {
    text: "Early to bed and early to rise makes a man healthy, wealthy, and wise.",
    author: "Benjamin Franklin",
  },
  {
    text: "Your future depends on your dreams, so go to sleep.",
    author: "Mesut Barazany",
  },
  {
    text: "Sleep is the best time to repair, but it's also the best time to dream.",
    author: "Matthew Walker",
  },
  {
    text: "The best bridge between despair and hope is a good night's sleep.",
    author: "E. Joseph Cossman",
  },
  {
    text: "Sleep is the most underrated health habit.",
    author: "Dr. Michael Breus",
  },
  {
    text: "A well-spent day brings happy sleep.",
    author: "Leonardo da Vinci",
  },
  {
    text: "Sleep is an investment in the energy you need to be effective tomorrow.",
    author: "Tom Roth",
  },
  {
    text: "Happiness consists of getting enough sleep. Just that, nothing more.",
    author: "Robert A. Heinlein",
  },
  {
    text: "Sleep is the Swiss Army knife of health.",
    author: "Dr. Matthew Walker",
  },
  {
    text: "It is a common experience that a problem difficult at night is resolved in the morning after the committee of sleep has worked on it.",
    author: "John Steinbeck",
  },
  {
    text: "Sleep is not a luxury, it's a necessity.",
    author: "Dr. James Maas",
  },
  {
    text: "Your body is designed to sleep. Trust it.",
    author: "Dr. Nerina Ramlakhan",
  },
];

export function getTodayQuote(): SleepQuote {
  const dayIndex = new Date().getDate() % SLEEP_QUOTES.length;
  return SLEEP_QUOTES[dayIndex];
}

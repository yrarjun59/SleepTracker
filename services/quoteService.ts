const OFFLINE_QUOTES: { text: string; author: string }[] = [
  {
    text: "It is a common experience that a problem difficult at night is resolved in the morning after the committee of sleep has worked on it.",
    author: "John Steinbeck",
  },
  {
    text: "Sleep is the best meditation.",
    author: "Dalai Lama",
  },
  {
    text: "There is a time for many words, and there is also a time for sleep.",
    author: "Homer, The Odyssey",
  },
  {
    text: "The sleeping man is not sleeping. He is waking up.",
    author: "Attributed to Heraclitus (paraphrase)",
  },
  {
    text: "Let her sleep, for when she wakes, she will move mountains.",
    author: "Napoleon Bonaparte (attributed)",
  },
  {
    text: "Sleep is the single most effective thing we can do to reset our brain and body health each day.",
    author: "Matthew Walker, Why We Sleep (2017)",
  },
  {
    text: "The best bridge between despair and hope is a good night's sleep.",
    author: "E. Joseph Cossman",
  },
  {
    text: "Each night, when I go to sleep, I die. And the next morning, when I wake up, I am reborn.",
    author: "Mahatma Gandhi",
  },
  {
    text: "No day is so bad it can't be fixed with a nap.",
    author: "Carrie Snow",
  },
  {
    text: "Sleep is that golden chain that ties health and our bodies together.",
    author: "Thomas Dekker",
  },
  {
    text: "Sleep is the interest we have to pay on the capital which is called in at death; and the higher the rate of interest and the more regularly it is paid, the further the date of redemption is postponed.",
    author: "Arthur Schopenhauer",
  },
  {
    text: "O sleep, O gentle sleep, Nature's soft nurse, how have I frightened thee?",
    author: "William Shakespeare, Henry IV, Part 2",
  },
  {
    text: "Sleep is the best cure for waking troubles.",
    author: "Miguel de Cervantes, Don Quixote",
  },
  {
    text: "Come, Sleep! O Sleep, the certain knot of peace.",
    author: "Philip Sidney",
  },
  {
    text: "I love sleep. My life has a tendency to fall apart when I'm awake, you know?",
    author: "Ernest Hemingway",
  },
  {
    text: "Sleep is the most moronic fraternity in the world, with the heaviest dues and the crudest penalties.",
    author: "Vladimir Nabokov",
  },
  {
    text: "A good laugh and a long sleep are the two best cures in the doctor's book.",
    author: "Irish Proverb",
  },
  {
    text: "Rest is not idleness, and to lie sometimes on the grass under the trees on a summer's day, listening to the murmur of water, or watching the clouds float across the sky, is by no means a waste of time.",
    author: "John Lubbock",
  },
  {
    text: "Your future depends on your dreams, so go to sleep.",
    author: "Mesut Barazany",
  },
  {
    text: "Man should forget his anger before he lies down to sleep.",
    author: "Mahatma Gandhi",
  },
  {
    text: "We are such stuff as dreams are made on, and our little life is rounded with a sleep.",
    author: "William Shakespeare, The Tempest",
  },
  {
    text: "Dreams are today's answers to tomorrow's questions.",
    author: "Edgar Cayce",
  },
  {
    text: "In dreams, we enter a world that's entirely our own.",
    author: "J.K. Rowling (via Albus Dumbledore)",
  },
  {
    text: "Even a soul submerged in sleep is hard at work and helps make something of the world.",
    author: "Heraclitus",
  },
  {
    text: "The shorter your sleep, the shorter your life.",
    author: "Matthew Walker",
  },
  {
    text: "Sleep deprivation is the most common brain impairment.",
    author: "Matthew Walker",
  },
  {
    text: "A ruffled mind makes a restless pillow.",
    author: "Charlotte Brontë",
  },
  {
    text: "Not being able to sleep is terrible. You have the misery of having partied all night... without the satisfaction.",
    author: "Lynn Johnston",
  },
  {
    text: "I think the most important thing I can do in my life is sleep eight hours a night.",
    author: "Jeff Bezos",
  },
];

export interface Quote {
  text: string;
  author: string;
}

export function getTodayQuote(): Quote {
  if (OFFLINE_QUOTES.length === 0) {
    return { text: "Sleep is the best meditation.", author: "Dalai Lama" };
  }
  const index = Math.floor(Math.random() * OFFLINE_QUOTES.length);
  return OFFLINE_QUOTES[index];
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startQuoteRefresher() {
  // Initial refresh is not needed – we already have the quotes
  if (refreshInterval) clearInterval(refreshInterval);
  // The interval doesn't need to do anything – `getTodayQuote` uses random each time
  refreshInterval = setInterval(() => {}, 8 * 60 * 60 * 1000); // every 8 hours
}

export function stopQuoteRefresher() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

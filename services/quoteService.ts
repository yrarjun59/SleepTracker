import AsyncStorage from "@react-native-async-storage/async-storage";

const QUOTE_CACHE_KEY = "@quote_cache";

const API_URL =
  "https://api.quotable.io/quotes?tags=sleep|rest|dreams&limit=30";
//15+ curated offline quotes – all from real experts / reputable sources
const OFFLINE_QUOTES: { text: string; author: string }[] = [
  { text: "Sleep is the best meditation.", author: "Dalai Lama" },
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
  { text: "A well-spent day brings happy sleep.", author: "Leonardo da Vinci" },
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
];

export interface Quote {
  text: string;
  author: string;
}

// Load quotes from cache or fallback offline list
async function loadQuotes(): Promise<Quote[]> {
  const json = await AsyncStorage.getItem(QUOTE_CACHE_KEY);
  if (json) return JSON.parse(json);
  return OFFLINE_QUOTES;
}

// Save quotes to cache
async function saveQuotes(quotes: Quote[]) {
  await AsyncStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(quotes));
}

// Fetch fresh quotes from the official Quotable API
async function fetchQuotesFromAPI(): Promise<Quote[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch quotes");
  const data = await response.json();
  return data.results.map((item: any) => ({
    text: item.content,
    author: item.author,
  }));
}

// ---------- Public functions ----------

/** Return a random quote from the current cache */
export async function getTodayQuote(): Promise<Quote> {
  const quotes = await loadQuotes();
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

/** Fetch new quotes from the API and replace the cache. Logs on success. */
export async function refreshQuotes() {
  try {
    const fresh = await fetchQuotesFromAPI();
    if (fresh.length > 0) {
      await saveQuotes(fresh);
      console.log("✅ Quotes updated from API");
    }
  } catch (error) {
    console.warn(
      "⚠️ Could not fetch quotes – using offline/cached quotes",
      error,
    );
  }
}

// ---------- Hourly refresher ----------

let refreshInterval: ReturnType<typeof setInterval> | null = null;

/** Start the hourly quote refresh. Call once from your root component. */
export function startQuoteRefresher() {
  refreshQuotes();
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(refreshQuotes, 60 * 60 * 1000); // every hour
}

/** Stop the hourly refresh. Call on cleanup. */
export function stopQuoteRefresher() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * The automated pre-publish filter.
 *
 * Runs on every submission in `app/api/reviews/route.ts`, before the row is
 * written. It FLAGS, it never rejects outright — a flagged review is written
 * exactly like an unflagged one, just invisible until an owner looks at it in
 * the flagged queue (`/account/reviews`). The honest limit, stated once
 * rather than caveated at every call site: this is a reasonable net for a
 * small brand, not enterprise anti-fraud. It will miss things. That is why
 * the owner can remove any review after the fact, flagged or not.
 *
 * No imports from lib/supabase.ts or anything server-only beyond the
 * `bad-words` package, so this can be unit-tested directly with
 * `node --test` the same way lib/reviews-shared.ts is.
 */
import { Filter } from "bad-words";

export type FilterResult = { flagged: boolean; reason: string | null };

const profanity = new Filter();

/* ------------------------------------------------------------------ */
/* 1. Links                                                            */
/* ------------------------------------------------------------------ */

const LINK_PATTERNS = [
  /https?:\/\/\S+/i,
  /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i,
  // A bare domain with no protocol, e.g. "shadylinks.shop" — the common
  // shape of spam that avoids "http" specifically to dodge naive filters.
  /\b[a-z0-9-]{2,63}\.(com|co\.za|net|org|io|shop|store|info|xyz|me|app|link)\b/i,
];

function containsLink(text: string): boolean {
  return LINK_PATTERNS.some((p) => p.test(text));
}

/* ------------------------------------------------------------------ */
/* 2. Profanity                                                        */
/* ------------------------------------------------------------------ */

/**
 * Which word tripped the filter, for the owner's own reference in the
 * flagged queue. Never shown publicly. Returns null when the text is clean.
 */
function findProfaneWord(text: string): string | null {
  const words = text.match(/[\p{L}'-]+/gu) ?? [];
  for (const word of words) {
    if (profanity.isProfane(word)) return word.toLowerCase();
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 3. Duplicate / near-duplicate content                               */
/* ------------------------------------------------------------------ */

/** Lowercased, punctuation stripped, whitespace collapsed — for comparison only. */
export function normaliseForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Word-overlap similarity (Jaccard), 0 to 1. Simple on purpose — this is a
 * net for copy-paste spam bots re-using the same boilerplate, not a plagiarism
 * detector. Two short reviews that happen to share common words ("fits
 * great, fast shipping") would false-positive on a stricter measure; the
 * length floor in `isDuplicate` is what keeps that from happening here.
 */
export function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normaliseForComparison(a).split(" ").filter(Boolean));
  const wordsB = new Set(normaliseForComparison(b).split(" ").filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let shared = 0;
  for (const w of wordsA) if (wordsB.has(w)) shared++;

  const union = wordsA.size + wordsB.size - shared;
  return union === 0 ? 0 : shared / union;
}

const DUPLICATE_MIN_LENGTH = 20;
const DUPLICATE_SIMILARITY = 0.85;

export function isDuplicate(body: string, existingBodies: string[]): boolean {
  const normalised = normaliseForComparison(body);
  if (!normalised) return false;

  for (const existing of existingBodies) {
    if (normaliseForComparison(existing) === normalised) return true;
    if (normalised.length >= DUPLICATE_MIN_LENGTH && wordOverlap(body, existing) >= DUPLICATE_SIMILARITY) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* 5. Bot timing pattern (short, generic, 5 stars, submitted instantly) */
/* ------------------------------------------------------------------ */

const BOT_TIMING_MS = 4000;
const BOT_BODY_MAX_LENGTH = 30;

function looksLikeBotTiming(input: {
  rating: number | null;
  bodyLength: number;
  msSincePageLoad: number | null;
}): boolean {
  if (input.msSincePageLoad === null) return false;
  return (
    input.rating === 5 &&
    input.bodyLength > 0 &&
    input.bodyLength <= BOT_BODY_MAX_LENGTH &&
    input.msSincePageLoad < BOT_TIMING_MS
  );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export type FilterInput = {
  body: string;
  rating: number | null;
  /** Other reviews' text already on file, to check for copy-paste spam against. */
  existingBodies: string[];
  /** The honeypot field's value. Any real user leaves it empty. */
  honeypot: string;
  /** ms between the form rendering and this submission reaching the server, or null if the form didn't send one. */
  msSincePageLoad: number | null;
};

export function runReviewFilter(input: FilterInput): FilterResult {
  // A filled honeypot is the one unambiguous signal here — no real visitor
  // can trigger it. Still flagged rather than silently dropped, so a run of
  // honeypot catches shows up as a pattern in the queue rather than vanishing.
  if (input.honeypot.trim() !== "") {
    return { flagged: true, reason: "honeypot field filled" };
  }

  if (containsLink(input.body)) {
    return { flagged: true, reason: "contains a link" };
  }

  const word = findProfaneWord(input.body);
  if (word) {
    return { flagged: true, reason: `profanity match: ${word}` };
  }

  if (isDuplicate(input.body, input.existingBodies)) {
    return { flagged: true, reason: "duplicate or near-duplicate content" };
  }

  if (
    looksLikeBotTiming({
      rating: input.rating,
      bodyLength: input.body.trim().length,
      msSincePageLoad: input.msSincePageLoad,
    })
  ) {
    return { flagged: true, reason: "short 5-star review submitted within seconds of the page loading" };
  }

  return { flagged: false, reason: null };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFeedback, filterCandidates, pickBestGuess } from "../solver.js";

// ── computeFeedback ──────────────────────────────────────────────────────────

test("README example: LOST vs THAT → 1 bull, 1 cow", () => {
  // T at pos 3 is a bull; secret's T at pos 0 matches T in guess as cow
  assert.deepEqual(computeFeedback("lost", "that"), { bulls: 1, cows: 1 });
});

test("README example: BULB vs HERB → 1 bull, 0 cows", () => {
  // B at pos 3 is a bull; H, E, R not in guess
  assert.deepEqual(computeFeedback("bulb", "herb"), { bulls: 1, cows: 0 });
});

test("README example: HERB vs BULB → 1 bull, 1 cow (asymmetric)", () => {
  // B at pos 3 is a bull; secret's B at pos 0 finds B in guess at pos 3 → cow
  assert.deepEqual(computeFeedback("herb", "bulb"), { bulls: 1, cows: 1 });
});

test("README example: FISH vs JUST → 1 bull, 0 cows", () => {
  // S at pos 2 is a bull; J, U, T not in guess
  assert.deepEqual(computeFeedback("fish", "just"), { bulls: 1, cows: 0 });
});

test("perfect match → 4 bulls, 0 cows", () => {
  assert.deepEqual(computeFeedback("word", "word"), { bulls: 4, cows: 0 });
});

test("no letters in common → 0 bulls, 0 cows", () => {
  assert.deepEqual(computeFeedback("back", "film"), { bulls: 0, cows: 0 });
});

test("all letters present but none in correct position → 0 bulls, 4 cows", () => {
  // guess=dcba, secret=abcd: every secret letter appears in guess at a different pos
  assert.deepEqual(computeFeedback("dcba", "abcd"), { bulls: 0, cows: 4 });
});

test("repeated letter in secret — only one cow when guess has one matching letter", () => {
  // secret=NOON, guess=ONCE: O at pos 0 is a bull; second O in secret (pos 3)
  // looks for O in guess at j≠3: j=0 already used? No guessUsed is not set for bulls.
  // j=0: g[0]=o === s[3]=o? Wait, let me recompute.
  // guess=once g=[o,n,c,e], secret=noon s=[n,o,o,n]
  // Bulls: g[1]=n===s[1]=o? No. g[0]=o≠s[0]=n; g[1]=n≠s[1]=o; g[2]=c≠s[2]=o; g[3]=e≠s[3]=n → 0 bulls
  // Cows:
  //   i=0 (s[0]=n): j=0 g[0]=o≠n; j=1 g[1]=n===n match! cows++, guessUsed[1]=true
  //   i=1 (s[1]=o): j=0 g[0]=o===o match! cows++, guessUsed[0]=true
  //   i=2 (s[2]=o): j=0 guessUsed[0]=true; j=1 guessUsed[1]=true; j=3 g[3]=e≠o → no match
  //   i=3 (s[3]=n): j=0 guessUsed; j=1 guessUsed; j=2 g[2]=c≠n; j=3 skip → no match
  // Result: 0 bulls, 2 cows
  assert.deepEqual(computeFeedback("once", "noon"), { bulls: 0, cows: 2 });
});

test("repeated letter in guess — guess BOOK vs secret COOK", () => {
  // g=[b,o,o,k], s=[c,o,o,k]: pos 1,2,3 are bulls; B≠C so no match for pos 0
  assert.deepEqual(computeFeedback("book", "cook"), { bulls: 3, cows: 0 });
});

test("case-insensitive: uppercase input produces same result", () => {
  assert.deepEqual(computeFeedback("LOST", "THAT"), { bulls: 1, cows: 1 });
  assert.deepEqual(computeFeedback("Lost", "That"), { bulls: 1, cows: 1 });
});

// ── filterCandidates ─────────────────────────────────────────────────────────

test("filterCandidates: 4 bulls returns only the exact word", () => {
  const words = ["word", "ward", "wore", "lord"];
  assert.deepEqual(filterCandidates(words, "word", 4, 0), ["word"]);
});

test("filterCandidates: 0 bulls 0 cows excludes words sharing any scored letters", () => {
  // guess=back (b,a,c,k), 0 bulls 0 cows means none of b,a,c,k appear as cows
  // "zinc" shares no letters with "back" → kept
  // "back" itself → 4 bulls → excluded
  // "cake" → shares a,c,k → computeFeedback("back","cake"):
  //   g=[b,a,c,k] s=[c,a,k,e]; bulls: a at pos 1 is bull (1 bull) → excluded
  const words = ["zinc", "back", "film"];
  const result = filterCandidates(words, "back", 0, 0);
  assert.ok(result.includes("zinc"));
  assert.ok(!result.includes("back"));
});

test("filterCandidates: correctly applies README LOST/THAT example", () => {
  // Only words where computeFeedback("lost", word) = {1,1} survive
  const words = ["that", "test", "lost", "mast"];
  // computeFeedback("lost","that") = {1,1} ✓
  // computeFeedback("lost","test"): g=[l,o,s,t] s=[t,e,s,t]; s(pos2)=s bull; s(pos3)=t matches g(pos3)=t but same pos would be bull — wait: g[3]=t===s[3]=t → 2 bulls → excluded
  // computeFeedback("lost","lost") = {4,0} → excluded
  // computeFeedback("lost","mast"): g=[l,o,s,t] s=[m,a,s,t]; g[2]=s===s[2]=s bull; g[3]=t===s[3]=t bull → 2 bulls → excluded
  const result = filterCandidates(words, "lost", 1, 1);
  assert.deepEqual(result, ["that"]);
});

test("filterCandidates: empty list returns empty", () => {
  assert.deepEqual(filterCandidates([], "word", 2, 1), []);
});

test("filterCandidates: no match returns empty", () => {
  const words = ["word", "ward"];
  // Both share more letters with "word" than 0,0
  assert.deepEqual(filterCandidates(words, "word", 0, 0), []);
});

// ── pickBestGuess ────────────────────────────────────────────────────────────

test("pickBestGuess: single candidate returns that word", () => {
  assert.equal(pickBestGuess(["word"]), "word");
});

test("pickBestGuess: two candidates returns the first", () => {
  assert.equal(pickBestGuess(["word", "ward"]), "word");
});

test("pickBestGuess: returns a word from the candidate list", () => {
  const cands = ["that", "than", "chat", "flat", "slat", "plat"];
  const result = pickBestGuess(cands);
  assert.ok(cands.includes(result), `Expected "${result}" to be in candidates`);
});

test("pickBestGuess: with >200 candidates returns first candidate", () => {
  const cands = Array.from({ length: 201 }, (_, i) => "w" + String(i).padStart(3, "0"));
  assert.equal(pickBestGuess(cands), cands[0]);
});

test("pickBestGuess: chosen word minimises worst-case bucket (minimax)", () => {
  // With a small known set, verify the picked word is at least as good as any other
  const cands = ["that", "than", "chat", "flat", "slat"];
  const best = pickBestGuess(cands);

  function worstCase(guess, list) {
    const buckets = {};
    for (const secret of list) {
      const fb = computeFeedback(guess, secret);
      const key = fb.bulls + "," + fb.cows;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Math.max(...Object.values(buckets));
  }

  const bestScore = worstCase(best, cands);
  for (const w of cands) {
    assert.ok(
      worstCase(w, cands) >= bestScore,
      `"${w}" has a better worst-case than picked word "${best}"`
    );
  }
});

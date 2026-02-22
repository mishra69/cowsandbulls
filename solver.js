export function computeFeedback(guess, secret) {
  const g = guess.toLowerCase().split("");
  const s = secret.toLowerCase().split("");
  let bulls = 0, cows = 0;
  const isBull = [false, false, false, false];

  for (let i = 0; i < 4; i++) {
    if (g[i] === s[i]) { bulls++; isBull[i] = true; }
  }

  const guessUsed = [false, false, false, false];
  for (let i = 0; i < 4; i++) {
    if (isBull[i]) continue;
    for (let j = 0; j < 4; j++) {
      if (i === j) continue;
      if (guessUsed[j]) continue;
      if (s[i] === g[j]) { cows++; guessUsed[j] = true; break; }
    }
  }
  return { bulls, cows };
}

export function filterCandidates(cands, guess, bulls, cows) {
  return cands.filter(w => {
    const fb = computeFeedback(guess, w);
    return fb.bulls === bulls && fb.cows === cows;
  });
}

export function pickBestGuess(cands) {
  if (cands.length <= 2) return cands[0];
  if (cands.length > 200) return cands[0];
  let bestWord = cands[0], bestWorst = Infinity;
  const sample = cands.slice(0, Math.min(cands.length, 60));
  for (const guess of sample) {
    const buckets = {};
    for (const secret of cands) {
      const fb = computeFeedback(guess, secret);
      const key = fb.bulls + "," + fb.cows;
      buckets[key] = (buckets[key] || 0) + 1;
    }
    const worst = Math.max(...Object.values(buckets));
    if (worst < bestWorst) { bestWorst = worst; bestWord = guess; }
  }
  return bestWord;
}

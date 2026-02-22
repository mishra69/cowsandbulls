# Cows & Bulls Solver

A web-based solver for the classic **Cows and Bulls** word-guessing game. You play the guesser — this tool narrows down the possibilities and suggests optimal next guesses.

## Rules

Cows and Bulls is a code-breaking game played with 4-letter English words:

- One player (the **code-maker**) thinks of a secret 4-letter word
- The other player (the **guesser**) makes guesses and receives feedback:
  - 🐂 **Bull** — a letter that is correct and in the correct position
  - 🐄 **Cow** — a letter that exists in the secret word but at a different position
- The guesser uses this feedback to deduce the secret word

### Scoring nuances

This implementation uses a specific cow-counting rule:

- Bulls are counted first (exact position matches)
- Cows are then counted from the **secret word's perspective**: each non-bull letter in the secret checks the **entire guess** (including positions already matched as bulls) for a match at a different position
- This makes scoring **asymmetric** — guessing HERB when the secret is BULB yields different results than guessing BULB when the secret is HERB
- Repeated letters are allowed (e.g. BOOK, THAT, BULB)

### Examples

| Secret | Guess | Bulls | Cows | Explanation |
|--------|-------|-------|------|-------------|
| THAT   | LOST  | 1     | 1    | T at pos 3 is a bull; T at pos 0 in secret matches T in guess as cow |
| HERB   | BULB  | 1     | 0    | B at pos 3 is a bull; H, E, R not in guess |
| BULB   | HERB  | 1     | 1    | B at pos 3 is a bull; B at pos 0 in secret matches B in guess as cow |
| JUST   | FISH  | 1     | 0    | S at pos 2 is a bull; J, U, T not in guess |

## Usage

Enter your guess and the bulls/cows feedback you received, then hit Submit. The solver filters the word list, shows remaining possibilities, and suggests the next guess that will eliminate the most candidates. Click any word to use it as your next guess.

## Developer Notes

### Stack

Single-file static site — no build step, no dependencies, no framework. Just HTML, CSS, and vanilla JavaScript. Uses [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts.

### Project structure

```
index.html    # The entire application
README.md     # This file
```

### Word list

Contains 1,583 common 4-letter English words. The list is embedded directly in the HTML file as a JavaScript array.

### Algorithm

The solver uses a **minimax strategy** to suggest the next guess:

1. For each candidate word, simulate guessing it against every remaining possible secret
2. Group results by feedback (bulls/cows) into buckets
3. The **worst case** for a guess is the size of its largest bucket
4. Pick the guess that **minimizes this worst case**

This guarantees the best worst-case elimination regardless of what the secret is. For performance, the evaluation is limited to 60 candidates when the list is large, and falls back to the first candidate when over 200 words remain.

### Deployment

Static HTML — deploy anywhere. For Cloudflare Pages:

1. Push to a GitHub repo
2. In Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**
3. Build command: *(leave blank)*
4. Output directory: `/`

Every push to `main` auto-deploys.

### Future improvements

- Minimax pruning (alpha-beta style early termination, theoretical optimum detection)
- Expand word list or allow custom word lists
- Multiplayer/shared room mode
- Letter tracking overlay (eliminated / alive / fixed keyboard view)

# CycleVault Education Generator

This defines how the `/education` section is built from the source text files in `/education/txt`.

## How to run
Requires Node.js.

```bash
cd education/tools
node build.js
```

## What it does
1. Reads text files from `../txt/*.txt`.
2. Parses them (markdown-lite format).
3. Generates HTML articles in `../articles/`.
4. Generates data for `../index.html` (Education landing page).

## Adding new articles
1. Add `.txt` file to `../txt/`.
2. Format:
   - First line: `**Title**`
   - Headers: `### Heading` or `Heading:`
   - Links: `[text](url)`
3. Add filename to `ARTICLE_ORDER` array in `build.js` if ordering matters.
4. Run `node build.js`.

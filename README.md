# Spot the Differences Challenge

Run locally with `npm run dev`.

## Adding a question

1. Put the two local image files in `public/images/`.
2. Add one object to `src/data/questions.json`:

```json
{ "id": 11, "left": "/images/q11_left.svg", "right": "/images/q11_right.svg", "answer": 4 }
```

The game automatically uses every entry in the JSON file for its question count, progress bar, and final score.


# Spot the Differences Challenge — Multi-Device Sync


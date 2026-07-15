# VYRON REACH — SAFE COMMANDS

## Start normally

```text
npm run dev
```

## Full clean restart

```text
taskkill /IM node.exe /F
Remove-Item .next -Recurse -Force
npm run dev
```

## Correct URL

```text
http://localhost:3002
```

## Important

Do not run:

```text
npm run dev -- -p 3002
```

Your package already includes port 3002.

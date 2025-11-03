#!/bin/bash
if [ -z "$XAI_API_KEY" ]; then
  echo "XAI_API_KEY not set"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Usage: ./grok.sh 'prompt'"
  exit 1
fi

PROMPT="$1"
MODEL="grok-4"

# Stream response and save to temp file
TEMP_FILE=$(mktemp)
curl -s -X POST https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}],
    \"temperature\": 0.7,
    \"max_tokens\": 8192
  }" > "$TEMP_FILE"

# Check HTTP code
HTTP_CODE=$(tail -n1 "$TEMP_FILE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2 || echo "500")
if [ "$HTTP_CODE" != "200" ]; then
  echo "API Error $HTTP_CODE:"
  cat "$TEMP_FILE"
  rm "$TEMP_FILE"
  exit 1
fi

# Extract content safely
CONTENT
./grok.sh "Oysterette: React Native Expo app in ~/projects/claude-project/mobile-app. Add full dark mode support matching existing style (TypeScript, React Navigation 7, React Native StyleSheet). Do this:
1. Create theme context in src/theme/ (light/dark themes with colors from current palette).
2. Wrap App.tsx in ThemeProvider.
3. Update all screens/components to use theme colors (text, background, cards, buttons).
4. Add theme toggle in Settings screen (persistent via AsyncStorage).
5. Support system preference (useColorScheme).
6. Update app.json for EAS splash screen dark mode.
Plan files to edit/create first. Then full code blocks (```tsx src/theme/index.tsx ... ```). I'll paste, test on emulator, commit."

chmod +x grok.sh

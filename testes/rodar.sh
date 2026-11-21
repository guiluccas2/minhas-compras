#!/bin/bash
# Roda todos os testes: bash testes/rodar.sh
cd "$(dirname "$0")/.."
PORTA=8765
python3 -m http.server $PORTA >/dev/null 2>&1 &
SRV=$!
trap "kill $SRV" EXIT
sleep 1
for f in js/*.js sw.js; do node --check "$f" || exit 1; done
node testes/teste-app.js "http://localhost:$PORTA/"

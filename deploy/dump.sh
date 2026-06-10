#!/usr/bin/env bash
# marktFUX — MongoDB Backup / Re-Export Helper
# Erstellt einen frischen Dump der aktuellen DB.
# Usage: ./dump.sh [source-db-name]
#   defaults to "marktfux"

set -e

SRC_DB="${1:-marktfux}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUT_DIR="$SCRIPT_DIR/mongodb-dump"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "▶ Dumpe Datenbank '$SRC_DB' → $OUT_DIR"
mongodump \
  --uri="${MONGO_URL:-mongodb://localhost:27017}" \
  --db="$SRC_DB" \
  --out="$OUT_DIR"

# Optional: tar.gz Archiv erstellen
tar -czf "$SCRIPT_DIR/marktfux-mongo-dump.tar.gz" -C "$SCRIPT_DIR" mongodb-dump/

echo "✅ Dump fertig:"
echo "   - Ordner:  $OUT_DIR"
echo "   - Archiv:  $SCRIPT_DIR/marktfux-mongo-dump.tar.gz"

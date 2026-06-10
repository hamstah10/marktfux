#!/usr/bin/env bash
# marktFUX — MongoDB Restore Helper
# Usage: ./restore.sh [target-db-name]
#   defaults to "marktfux" if no arg given

set -e

TARGET_DB="${1:-marktfux}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DUMP_DIR="$SCRIPT_DIR/mongodb-dump"
ARCHIVE="$SCRIPT_DIR/marktfux-mongo-dump.tar.gz"

if [ ! -d "$DUMP_DIR" ] && [ -f "$ARCHIVE" ]; then
  echo "▶ Entpacke $ARCHIVE …"
  tar -xzf "$ARCHIVE" -C "$SCRIPT_DIR"
fi

if [ ! -d "$DUMP_DIR" ]; then
  echo "❌ Kein Dump gefunden. Erwartet: $DUMP_DIR oder $ARCHIVE"
  exit 1
fi

echo "▶ Restore von Dump → Datenbank '$TARGET_DB' (replace mode)"
mongorestore \
  --uri="${MONGO_URL:-mongodb://localhost:27017}" \
  --nsFrom='test_database.*' \
  --nsTo="${TARGET_DB}.*" \
  --drop \
  "$DUMP_DIR"

echo "✅ Restore abgeschlossen."
echo "   Validieren:"
echo "   mongosh $TARGET_DB --eval 'db.users.countDocuments(); db.vehicles.countDocuments();'"

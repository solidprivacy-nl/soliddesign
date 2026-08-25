#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR="$ROOT/.vendor"
mkdir -p "$VENDOR"

PITCH_REPO="https://github.com/NezbiT/pitch-doctor.git"
PITCH_SHA="ab5858c5ba620fccde1fa2fd35e2c2ca86d37a42"
OPENPAGE_REPO="https://github.com/buildingopen/openpage.git"
OPENPAGE_SHA="9818eb43a88e01b23cb55752e19902d8285a853b"

if [ ! -d "$VENDOR/pitch-doctor/.git" ]; then git clone "$PITCH_REPO" "$VENDOR/pitch-doctor"; fi
git -C "$VENDOR/pitch-doctor" fetch --all --tags
git -C "$VENDOR/pitch-doctor" checkout "$PITCH_SHA"
python -m venv "$VENDOR/pitch-doctor/.venv"
"$VENDOR/pitch-doctor/.venv/bin/python" -m pip install --upgrade pip
"$VENDOR/pitch-doctor/.venv/bin/pip" install -e "$VENDOR/pitch-doctor"
"$VENDOR/pitch-doctor/.venv/bin/playwright" install chromium

if [ ! -d "$VENDOR/openpage/.git" ]; then git clone "$OPENPAGE_REPO" "$VENDOR/openpage"; fi
git -C "$VENDOR/openpage" fetch --all --tags
git -C "$VENDOR/openpage" checkout "$OPENPAGE_SHA"

echo "Pitch Doctor pinned: $PITCH_SHA"
echo "OpenPage pinned:     $OPENPAGE_SHA"
echo "Set PITCH_DOCTOR_COMMAND=$VENDOR/pitch-doctor/.venv/bin/pitch-doctor"

#!/usr/bin/env bash
#
# Build and run a LOCAL OSRM routing engine so the planner gets true road
# distances for the whole national route (the public demo server can't handle
# 650-stop routes reliably).
#
# Prereqs: Docker Desktop installed AND running.
#   brew install --cask docker     # then launch Docker Desktop once & accept its terms
#
# Usage:
#   bash scripts/osrm-setup.sh            # full US (default) — large download + build
#   REGION=us/california bash scripts/osrm-setup.sh   # a single state (much lighter, good for a test)
#
# After it's serving, point the app at it:
#   echo 'OSRM_BASE_URL=http://localhost:5001' >> .env
#   # then restart the API (npm run dev / your tsx server)
#
set -euo pipefail

# --- config --------------------------------------------------------------
# REGION is a Geofabrik path under https://download.geofabrik.de/<REGION>-latest.osm.pbf
# Examples: "north-america/us" (full US, ~9 GB), "north-america/us/california" (~1 GB).
REGION="${REGION:-north-america/us}"
PORT="${OSRM_PORT:-5001}"            # host port (container always serves 5000); 5000 clashes with macOS AirPlay
IMAGE="${OSRM_IMAGE:-ghcr.io/project-osrm/osrm-backend}"
DATA_DIR="${OSRM_DATA_DIR:-$(cd "$(dirname "$0")/.." && pwd)/osrm-data}"

NAME="$(basename "$REGION")-latest"
PBF="$NAME.osm.pbf"
OSRM="$NAME.osrm"
URL="https://download.geofabrik.de/${REGION}-latest.osm.pbf"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }

# --- preflight -----------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Run:  brew install --cask docker"
  echo "Then open Docker Desktop once (accept its terms) and re-run this script."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but the daemon isn't running. Launch Docker Desktop, then re-run."
  exit 1
fi

mkdir -p "$DATA_DIR"
bold "OSRM data dir: $DATA_DIR"
bold "Region: $REGION   Host port: $PORT"

# --- download ------------------------------------------------------------
if [ ! -f "$DATA_DIR/$PBF" ]; then
  bold "Downloading $URL (this is the big one — several GB for the full US)…"
  curl -fL --retry 3 -o "$DATA_DIR/$PBF" "$URL"
else
  bold "Map extract already present: $PBF (skipping download)"
fi

run_osrm() { docker run --rm -t -v "$DATA_DIR:/data" "$IMAGE" "$@"; }

# --- build graph (MLD pipeline) -----------------------------------------
if [ ! -f "$DATA_DIR/$OSRM.mldgr" ]; then
  bold "osrm-extract (car profile)…  [needs a fair bit of RAM for the full US]"
  run_osrm osrm-extract -p /opt/car.lua "/data/$PBF"
  bold "osrm-partition…"
  run_osrm osrm-partition "/data/$OSRM"
  bold "osrm-customize…"
  run_osrm osrm-customize "/data/$OSRM"
else
  bold "OSRM graph already built (skipping extract/partition/customize)"
fi

# --- serve ---------------------------------------------------------------
bold "Starting osrm-routed on http://localhost:$PORT  (Ctrl-C to stop)"
bold "Leave this running, then in another shell:"
echo "    echo 'OSRM_BASE_URL=http://localhost:$PORT' >> .env   # if not already set"
echo "    # restart the API server so it picks up OSRM_BASE_URL"
docker run --rm -t -i -p "$PORT:5000" -v "$DATA_DIR:/data" "$IMAGE" \
  osrm-routed --algorithm mld --max-table-size 10000 "/data/$OSRM"

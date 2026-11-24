#!/usr/bin/env bash
# The kit from source to bundles, in the open editor: compile, PortKit/Kit/Build Prefabs, the script, the bundles,
# PortKit/Kit/Check. Prints each step's report tail; stops at the first failure.
#   altspace/tools/rebuild_kit.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
P="$(dirname "$HERE")"
R="$P/../../portkit/tools/remote.sh"
step() { echo "== $1"; }
# remote.sh compile asks the compiler itself (portkit d8f370d) and fails on compile errors
step compile; out="$(bash "$R" "$P" compile 600)" || { echo "$out" | tail -20; exit 1; }; echo "$out" | tail -1
step "build prefabs"; bash "$R" "$P" menu "PortKit/Kit/Build Prefabs" 600 >/dev/null; tail -4 "$P/Logs/portkit_kits.txt"
tail -1 "$P/Logs/portkit_kits.txt" | grep -q DONE || exit 1
step script; (cd "$P/ts" && npm run build 2>&1 | tail -1)
step bundles; bash "$R" "$P" menu "PortKit/Kit/Build Bundles" 1100 >/dev/null; tail -3 "$P/Logs/portkit_bundles.txt" | cut -c1-200
tail -1 "$P/Logs/portkit_bundles.txt" | grep -q DONE || exit 1
touch "$P/Assets/Kit/Editor/BrickChecks.cs"; bash "$R" "$P" compile 600 | tail -1
step check; bash "$R" "$P" menu "PortKit/Kit/Check" 600 >/dev/null; cut -c1-160 "$P/Logs/portkit_check.txt"
tail -1 "$P/Logs/portkit_check.txt" | grep -q DONE || exit 1

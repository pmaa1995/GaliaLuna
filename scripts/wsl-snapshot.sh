#!/usr/bin/env bash
# Create or refresh an isolated Linux source snapshot; never deploys.
set -Eeuo pipefail
mode=${1:-create}
source_root=$(realpath "${2:-$(dirname "$0")/..}")
build_root="$HOME/codex-builds/galia-luna"
node_version=22.20.0
if [[ ! -f "$source_root/package.json" || ! -f "$source_root/package-lock.json" ]]; then
  printf 'Source must contain package.json and package-lock.json.\n' >&2
  exit 1
fi
for tool in rsync curl tar sha256sum realpath; do
  command -v "$tool" >/dev/null || { printf 'Missing tool: %s\n' "$tool" >&2; exit 1; }
done
mkdir -p "$build_root"
build_root=$(realpath "$build_root")
case "$build_root" in /mnt/*) printf 'Snapshot must live on the Linux filesystem.\n' >&2; exit 1;; esac
if [[ "$mode" == create ]]; then
  snapshot=$(mktemp -d "$build_root/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
  mkdir -p "$snapshot/source" "$snapshot/runtime" "$snapshot/logs"
  printf '%s\n' "$source_root" > "$snapshot/.galialuna-source"
  case $(uname -m) in
    x86_64) node_arch=x64;;
    aarch64) node_arch=arm64;;
    *) printf 'Unsupported Node architecture.\n' >&2; exit 1;;
  esac
  archive="node-v${node_version}-linux-${node_arch}.tar.xz"
  download_dir=$(mktemp -d "$snapshot/runtime/download-XXXXXX")
  curl --fail --location --silent --show-error "https://nodejs.org/dist/v${node_version}/$archive" -o "$download_dir/$archive"
  curl --fail --location --silent --show-error "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" -o "$download_dir/SHASUMS256.txt"
  (
    cd "$download_dir"
    awk -v filename="$archive" '$2 == filename { print }' SHASUMS256.txt > archive.sha256
    test -s archive.sha256
    sha256sum --check archive.sha256
  )
  tar -xJf "$download_dir/$archive" --strip-components=1 -C "$snapshot/runtime"
  "$snapshot/runtime/bin/node" -p 'process.version + " " + process.platform'
elif [[ "$mode" == sync ]]; then
  snapshot=$(realpath "${3:?Pass the existing snapshot directory as the third argument.}")
  case "$snapshot" in "$build_root"/*) ;; *) printf 'Snapshot is outside the managed Linux build directory.\n' >&2; exit 1;; esac
  [[ -f "$snapshot/.galialuna-source" && -d "$snapshot/source" && ! -L "$snapshot/source" ]] || { printf 'Snapshot marker or source directory missing.\n' >&2; exit 1; }
  [[ "$(cat "$snapshot/.galialuna-source")" == "$source_root" ]] || { printf 'Snapshot belongs to another source.\n' >&2; exit 1; }
  printf 'Synchronizing the snapshot; stop builds and previews using it first.\n'
else
  printf 'Usage: bash scripts/wsl-snapshot.sh create [source]\n       bash scripts/wsl-snapshot.sh sync [source] [snapshot]\n' >&2
  exit 1
fi
# Excluded directories are protected by rsync from deletion during sync.
# --delete removes only stale copied source files inside the validated snapshot.
rsync -a --delete \
  --exclude='/.git/' --exclude='node_modules/' --exclude='.next/' \
  --exclude='.open-next/' --exclude='.wrangler/' --exclude='.sanity/' \
  --exclude='dist/' --exclude='out/' --exclude='coverage/' \
  --exclude='.env' --exclude='.env.*' --exclude='.dev.vars' --exclude='.dev.vars.*' \
  --exclude='tsconfig.tsbuildinfo' --exclude='*.log' \
  "$source_root/" "$snapshot/source/"
(
  cd "$snapshot/source"
  sha256sum package-lock.json > "$snapshot/lock.sha256"
)
printf '%s\n' "$snapshot"

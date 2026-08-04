#!/usr/bin/env bash
set -e

BINARY_NAME="ejunz-edge-desktop"
DIST_DIR="uniapp/neutralino/dist/${BINARY_NAME}"
PKG_DIR="${1:-/tmp/packages}"
mkdir -p "$PKG_DIR"

# Linux packages
for arch in x64 arm64 armhf; do
  name=$(echo "$arch" | tr '_' '-')
  staging="/tmp/linux-${arch}"
  mkdir -p "$staging"
  cp "${DIST_DIR}/${BINARY_NAME}-linux_${arch}" "$staging/"
  cp "${DIST_DIR}/resources.neu" "$staging/"
  chmod +x "$staging/${BINARY_NAME}-linux_${arch}"
  cd "$staging"
  tar -czvf "${PKG_DIR}/ejunz-edge-desktop-linux-${name}.tar.gz" .
done

# macOS packages
for arch in x64 arm64 universal; do
  if [ -f "${DIST_DIR}/${BINARY_NAME}-mac_${arch}" ]; then
    app_dir="/tmp/mac-${arch}/Ejunz Edge.app"
    mkdir -p "$app_dir/Contents/MacOS"
    cp "${DIST_DIR}/${BINARY_NAME}-mac_${arch}" "$app_dir/Contents/MacOS/${BINARY_NAME}"
    cp "${DIST_DIR}/resources.neu" "$app_dir/Contents/MacOS/"
    chmod +x "$app_dir/Contents/MacOS/${BINARY_NAME}"
    cat > "$app_dir/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Ejunz Edge</string>
  <key>CFBundleDisplayName</key><string>Ejunz Edge</string>
  <key>CFBundleIdentifier</key><string>com.ejunz.edge.desktop</string>
  <key>CFBundleVersion</key><string>${GITHUB_REF_NAME#v}</string>
  <key>CFBundleShortVersionString</key><string>${GITHUB_REF_NAME#v}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>${BINARY_NAME}</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST
    cd "/tmp/mac-${arch}"
    tar -czvf "${PKG_DIR}/ejunz-edge-desktop-mac-${arch}.tar.gz" "Ejunz Edge.app"
  fi
done

# Windows package
if [ -f "${DIST_DIR}/${BINARY_NAME}-win_x64.exe" ]; then
  staging="/tmp/win"
  mkdir -p "$staging"
  cp "${DIST_DIR}/${BINARY_NAME}-win_x64.exe" "$staging/"
  cp "${DIST_DIR}/resources.neu" "$staging/"
  cd "$staging"
  zip -r "${PKG_DIR}/ejunz-edge-desktop-win-x64.zip" .
fi

echo "Packages created in ${PKG_DIR}:"
ls -la "${PKG_DIR}/"

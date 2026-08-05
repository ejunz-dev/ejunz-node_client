#!/usr/bin/env bash
set -euo pipefail

BINARY_NAME="ejunz-edge-desktop"
DIST_DIR="${NEU_DIST_DIR:-uniapp/neutralino/dist/${BINARY_NAME}}"
PKG_DIR="${1:-/tmp/packages}"
VERSION="${RELEASE_VERSION:-${GITHUB_REF_NAME#v}}"
VERSION="${VERSION#v}"
if [ -z "$VERSION" ] || [ "$VERSION" = "${GITHUB_REF_NAME:-}" ]; then
  VERSION="0.0.0"
fi

WORK_DIR="${RUNNER_TEMP:-/tmp}/ejunz-edge-package"
rm -rf "$WORK_DIR" "$PKG_DIR"
mkdir -p "$WORK_DIR" "$PKG_DIR"

require_file() {
  if [ ! -f "$1" ]; then
    echo "missing required file: $1" >&2
    exit 1
  fi
}

DESKTOP_FILE="$WORK_DIR/ejunz-edge.desktop"
ICON_FILE="$WORK_DIR/ejunz-edge-desktop.svg"
cat > "$DESKTOP_FILE" <<'DESKTOP'
[Desktop Entry]
Name=Ejunz Edge
Comment=Ejunz Edge node and Zigbee device manager
Exec=ejunz-edge-desktop %U
Icon=ejunz-edge-desktop
Terminal=false
Type=Application
Categories=Network;Utility;
DESKTOP

cat > "$ICON_FILE" <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="48" fill="#2563eb"/>
  <path d="M64 128h128M128 64v128" stroke="#fff" stroke-width="24" stroke-linecap="round"/>
  <circle cx="128" cy="128" r="34" fill="#2563eb" stroke="#fff" stroke-width="12"/>
</svg>
SVG

make_linux_root() {
  local root="$1"
  local binary="$2"
  rm -rf "$root"
  mkdir -p \
    "$root/usr/bin" \
    "$root/usr/lib/$BINARY_NAME" \
    "$root/usr/share/applications" \
    "$root/usr/share/icons/hicolor/scalable/apps"
  cp "$binary" "$root/usr/lib/$BINARY_NAME/$BINARY_NAME"
  cp "$DIST_DIR/resources.neu" "$root/usr/lib/$BINARY_NAME/resources.neu"
  chmod +x "$root/usr/lib/$BINARY_NAME/$BINARY_NAME"
  ln -s "../lib/$BINARY_NAME/$BINARY_NAME" "$root/usr/bin/$BINARY_NAME"
  cp "$DESKTOP_FILE" "$root/usr/share/applications/ejunz-edge.desktop"
  cp "$ICON_FILE" "$root/usr/share/icons/hicolor/scalable/apps/ejunz-edge-desktop.svg"
}

# Portable Linux packages for all Neutralino architectures.
for arch in x64 arm64 armhf; do
  binary="$DIST_DIR/$BINARY_NAME-linux_${arch}"
  require_file "$binary"
  staging="$WORK_DIR/linux-$arch"
  mkdir -p "$staging"
  cp "$binary" "$staging/$BINARY_NAME-linux_$arch"
  cp "$DIST_DIR/resources.neu" "$staging/"
  chmod +x "$staging/$BINARY_NAME-linux_$arch"
  tar -czf "$PKG_DIR/Ejunz Edge_${VERSION}_linux-${arch//_/-}.tar.gz" -C "$staging" .
done

# Debian package for the main Linux x86_64 target.
LINUX_X64="$DIST_DIR/$BINARY_NAME-linux_x64"
require_file "$LINUX_X64"
DEB_ROOT="$WORK_DIR/deb-root"
make_linux_root "$DEB_ROOT" "$LINUX_X64"
mkdir -p "$DEB_ROOT/DEBIAN"
cat > "$DEB_ROOT/DEBIAN/control" <<CONTROL
Package: ejunz-edge
Version: $VERSION
Section: net
Priority: optional
Architecture: amd64
Maintainer: Ejunz <dev@ejunz.com>
Description: Ejunz Edge node and Zigbee device manager
 Portable Neutralino.js desktop client for Ejunz Edge.
CONTROL
dpkg-deb --build --root-owner-group "$DEB_ROOT" "$PKG_DIR/Ejunz Edge_${VERSION}_amd64.deb" >/dev/null

# RPM package for the main Linux x86_64 target.
RPM_TOP="$WORK_DIR/rpmbuild"
mkdir -p "$RPM_TOP"/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}
RPM_SPEC="$RPM_TOP/SPECS/ejunz-edge.spec"
cat > "$RPM_SPEC" <<SPEC
Name: ejunz-edge
Version: $VERSION
Release: 1
Summary: Ejunz Edge node and Zigbee device manager
License: Proprietary
BuildArch: x86_64

%description
Portable Neutralino.js desktop client for Ejunz Edge.

%install
mkdir -p %{buildroot}/usr/bin
mkdir -p %{buildroot}/usr/lib/$BINARY_NAME
mkdir -p %{buildroot}/usr/share/applications
mkdir -p %{buildroot}/usr/share/icons/hicolor/scalable/apps
install -m 0755 $LINUX_X64 %{buildroot}/usr/lib/$BINARY_NAME/$BINARY_NAME
install -m 0644 $DIST_DIR/resources.neu %{buildroot}/usr/lib/$BINARY_NAME/resources.neu
ln -s ../lib/$BINARY_NAME/$BINARY_NAME %{buildroot}/usr/bin/$BINARY_NAME
install -m 0644 $DESKTOP_FILE %{buildroot}/usr/share/applications/ejunz-edge.desktop
install -m 0644 $ICON_FILE %{buildroot}/usr/share/icons/hicolor/scalable/apps/ejunz-edge-desktop.svg

%files
/usr/bin/$BINARY_NAME
/usr/lib/$BINARY_NAME/$BINARY_NAME
/usr/lib/$BINARY_NAME/resources.neu
/usr/share/applications/ejunz-edge.desktop
/usr/share/icons/hicolor/scalable/apps/ejunz-edge-desktop.svg
SPEC
rpmbuild --define "_topdir $RPM_TOP" --define "_build_id_links none" -bb "$RPM_SPEC" >/dev/null
RPM_FILE=$(find "$RPM_TOP/RPMS" -type f -name '*.rpm' -print -quit)
if [ -z "$RPM_FILE" ]; then
  echo "rpmbuild did not produce an RPM" >&2
  exit 1
fi
cp "$RPM_FILE" "$PKG_DIR/Ejunz Edge-${VERSION}-1.x86_64.rpm"

# AppImage package for Linux x86_64. This is built only in CI on Ubuntu;
# local NixOS development does not need to execute appimagetool.
APPDIR="$WORK_DIR/AppDir"
mkdir -p "$APPDIR/usr/bin" "$APPDIR/usr/share/applications" "$APPDIR/usr/share/icons/hicolor/scalable/apps"
cp "$LINUX_X64" "$APPDIR/usr/bin/$BINARY_NAME"
cp "$DIST_DIR/resources.neu" "$APPDIR/usr/bin/resources.neu"
chmod +x "$APPDIR/usr/bin/$BINARY_NAME"
cp "$DESKTOP_FILE" "$APPDIR/usr/share/applications/ejunz-edge.desktop"
cp "$ICON_FILE" "$APPDIR/usr/share/icons/hicolor/scalable/apps/ejunz-edge-desktop.svg"
cp "$DESKTOP_FILE" "$APPDIR/ejunz-edge.desktop"
cp "$ICON_FILE" "$APPDIR/ejunz-edge-desktop.svg"
cat > "$APPDIR/AppRun" <<'APPRUN'
#!/bin/sh
set -eu
HERE="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$HERE/usr/bin"
exec "$HERE/usr/bin/ejunz-edge-desktop" "$@"
APPRUN
chmod +x "$APPDIR/AppRun"
APPIMAGETOOL="$WORK_DIR/appimagetool-x86_64.AppImage"
curl -fsSL -o "$APPIMAGETOOL" \
  https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x "$APPIMAGETOOL"
APPIMAGE_EXTRACT_AND_RUN=1 "$APPIMAGETOOL" "$APPDIR" "$PKG_DIR/Ejunz Edge_${VERSION}_amd64.AppImage"

# macOS portable app archives. The DMG job wraps these archives later.
for arch in x64 arm64 universal; do
  binary="$DIST_DIR/$BINARY_NAME-mac_${arch}"
  if [ -f "$binary" ]; then
    app_dir="$WORK_DIR/mac-$arch/Ejunz Edge.app"
    mkdir -p "$app_dir/Contents/MacOS"
    cp "$binary" "$app_dir/Contents/MacOS/$BINARY_NAME"
    cp "$DIST_DIR/resources.neu" "$app_dir/Contents/MacOS/"
    chmod +x "$app_dir/Contents/MacOS/$BINARY_NAME"
    cat > "$app_dir/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Ejunz Edge</string>
  <key>CFBundleDisplayName</key><string>Ejunz Edge</string>
  <key>CFBundleIdentifier</key><string>com.ejunz.edge.desktop</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>$BINARY_NAME</string>
  <key>LSMinimumSystemVersion</key><string>11.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST
    tar -czf "$PKG_DIR/Ejunz Edge_${VERSION}_mac-${arch}.tar.gz" -C "$WORK_DIR/mac-$arch" "Ejunz Edge.app"
  fi
done

# Windows installer inputs; the Windows job wraps these files with Inno Setup and WiX.
WINDOWS_EXE="$DIST_DIR/$BINARY_NAME-win_x64.exe"
require_file "$WINDOWS_EXE"
WINDOWS_STAGING_DIR="${WINDOWS_STAGING_DIR:-$WORK_DIR/win}"
rm -rf "$WINDOWS_STAGING_DIR"
mkdir -p "$WINDOWS_STAGING_DIR"
cp "$WINDOWS_EXE" "$WINDOWS_STAGING_DIR/"
cp "$DIST_DIR/resources.neu" "$WINDOWS_STAGING_DIR/"

echo "Packages created in $PKG_DIR:"
ls -la "$PKG_DIR/"

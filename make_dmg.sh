#!/bin/bash

# MDRN Corp Release Script - HYBO v1.0.0
# Generates production build and macOS DMG with native Ghost Protocol Shell.

echo "--- Building HYBO Web App ---"
npm run build

echo "--- Creating macOS Iconset ---"
mkdir -p HYBO.iconset
sips -z 16 16     public/icon.png --out HYBO.iconset/icon_16x16.png
sips -z 32 32     public/icon.png --out HYBO.iconset/icon_16x16@2x.png
sips -z 32 32     public/icon.png --out HYBO.iconset/icon_32x32.png
sips -z 64 64     public/icon.png --out HYBO.iconset/icon_32x32@2x.png
sips -z 128 128   public/icon.png --out HYBO.iconset/icon_128x128.png
sips -z 256 256   public/icon.png --out HYBO.iconset/icon_128x128@2x.png
sips -z 256 256   public/icon.png --out HYBO.iconset/icon_256x256.png
sips -z 512 512   public/icon.png --out HYBO.iconset/icon_256x256@2x.png
sips -z 512 512   public/icon.png --out HYBO.iconset/icon_512x512.png
sips -z 1024 1024 public/icon.png --out HYBO.iconset/icon_512x512@2x.png
iconutil -c icns HYBO.iconset
rm -rf HYBO.iconset

echo "--- Structuring HYBO.app ---"
mkdir -p build/HYBO.app/Contents/MacOS
mkdir -p build/HYBO.app/Contents/Resources
cp HYBO.icns build/HYBO.app/Contents/Resources/AppIcon.icns
cp Info.plist build/HYBO.app/Contents/Info.plist

echo "--- Compiling Native macOS Shell ---"
swiftc launcher.swift -o build/HYBO.app/Contents/MacOS/HYBO

echo "--- Copying Web Assets ---"
cp -r dist/* build/HYBO.app/Contents/Resources/

echo "--- Generating DMG ---"
# Creating a DMG that includes the .app and a link to Applications
mkdir -p dmg_root
cp -r build/HYBO.app dmg_root/
ln -s /Applications dmg_root/Applications

hdiutil create -volname "HYBO" -srcfolder dmg_root -ov -format UDZO HYBO_v1.0.0.dmg

echo "--- Cleaning up ---"
rm -rf dmg_root
rm HYBO.icns

echo "--- Release Complete: HYBO_v1.0.0.dmg ---"

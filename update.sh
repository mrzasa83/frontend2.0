#!/bin/bash

# Paths
DOWNLOADS="/c/Users/mrzasa/Downloads"
ZIPFILE="$DOWNLOADS/frontend2_updated.zip"
TEMP_DIR="$DOWNLOADS/frontend2_temp"
DEST="/e/frontend2.4"

# Clean up any previous temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "Unzipping archive..."
unzip -q "$ZIPFILE" -d "$TEMP_DIR"

# The archive contains: frontend2.4share/
SOURCE="$TEMP_DIR/frontend2.4share"

if [ ! -d "$SOURCE" ]; then
    echo "ERROR: Expected folder 'frontend2.4share' not found inside ZIP."
    exit 1
fi

echo "Replacing target folders..."

# Only these three folders will be replaced
TARGET_FOLDERS=("app" "components" "lib")

for folder in "${TARGET_FOLDERS[@]}"; do
    if [ -d "$SOURCE/$folder" ]; then
        echo "Updating $folder..."
        rm -rf "$DEST/$folder"
        cp -r "$SOURCE/$folder" "$DEST/"
    else
        echo "WARNING: $folder not found in ZIP source"
    fi
done

echo "Cleaning up..."
rm -rf "$TEMP_DIR"

echo "Done!"
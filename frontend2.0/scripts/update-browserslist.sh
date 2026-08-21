#!/bin/bash
# Run this script to update the browserslist database and fix the warning:
# "Browserslist: caniuse-lite is outdated"

echo "Updating browserslist database..."
npx update-browserslist-db@latest

echo "Done! The 'baseline-browser-mapping is over 2 months old' warning should be resolved."

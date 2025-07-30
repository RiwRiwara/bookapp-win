#!/bin/bash

# Test script to run the built app without screen protection
echo "Starting app with screen protection disabled for testing..."

export DISABLE_SCREEN_PROTECTION=true
npm run start

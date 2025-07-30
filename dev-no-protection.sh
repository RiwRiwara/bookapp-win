#!/bin/bash

# Run the Electron app in development mode with screen protection disabled
echo "Starting Electron app with screen protection disabled..."
DISABLE_SCREEN_PROTECTION=true npm run dev

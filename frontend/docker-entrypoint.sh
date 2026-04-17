#!/bin/sh
set -e
node -e "
const fs = require('fs');
const env = {
  VITE_API_URL: process.env.VITE_API_URL || '',
  VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID || '',
  VITE_AUTH_DISABLED: process.env.VITE_AUTH_DISABLED || '',
};
fs.writeFileSync('/usr/share/nginx/html/runtime-config.js', 'window.__ENV = ' + JSON.stringify(env) + ';');
"
exec nginx -g 'daemon off;'

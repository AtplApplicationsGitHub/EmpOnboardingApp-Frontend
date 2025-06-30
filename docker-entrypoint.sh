#!/bin/sh
# Start Next.js (runs on 3000 by default)
npm run start &

# Start nginx (daemon off to stay in foreground)
nginx -g 'daemon off;'

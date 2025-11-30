#!/bin/bash

# Start backend in background
cd qa-app/backend
npm start &

# Start frontend in background
cd ../frontend-vue
npm run dev &

# Wait for both processes
wait

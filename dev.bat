@echo off
start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"

@echo off
title TN26 Live Auto-Updater
echo ========================================
echo  TN26 LIVE ELECTION AUTO-UPDATER
echo  Press Ctrl+C to stop
echo ========================================

set URL=https://www.youtube.com/watch?v=RL8T3i95G94

:loop
echo [%time%] Grabbing frame and reading results...
python screen_updater.py "%URL%"
echo Done! Waiting 5 minutes...
timeout /t 300 /nobreak
goto loop
@echo off
title TN26 Live Auto-Updater
echo ========================================
echo  TN26 LIVE ELECTION AUTO-UPDATER
echo  Press Ctrl+C to stop
echo ========================================

set URL=https://www.youtube.com/watch?v=RL8T3i95G94
set DURATION=180
set START=43000

:loop
echo [%time%] Fetching latest election data...
python groq_updater.py "%URL%" --start %START% --duration %DURATION%
echo Done! Waiting 5 minutes...
set /a START=%START%+300
timeout /t 300 /nobreak
goto loop
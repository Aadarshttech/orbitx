Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\Projects\Projects\CV_reelscroller\x-autopilot"
WshShell.Run "cmd.exe /c start-background.bat", 0, False

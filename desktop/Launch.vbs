set WshShell = CreateObject("WScript.Shell")
set oFSO = CreateObject("Scripting.FileSystemObject")

sBase = oFSO.GetParentFolderName(WScript.ScriptFullName)

sBackend = oFSO.GetParentFolderName(sBase) & "\backend"
sFrontend = oFSO.GetParentFolderName(sBase) & "\frontend"

Set oShell = CreateObject("Shell.Application")

' Start backend
WshShell.Run "cmd /c cd /d " & sBackend & " && call venv\Scripts\activate && uvicorn main:app --reload", 0, False

WScript.Sleep 3000

' Start frontend
WshShell.Run "cmd /c cd /d " & sFrontend & " && npm run dev", 0, False

WScript.Sleep 6000

' Start Electron
WshShell.Run "cmd /c cd /d " & sBase & " && npm run dev", 1, False

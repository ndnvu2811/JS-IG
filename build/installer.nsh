; Custom NSIS installer script for Instagram Tool Care
; File: build/installer.nsh

!macro customInstall
  DetailPrint "Closing running instances of Instagram Tool Care..."
  nsExec::ExecToLog 'taskkill /F /IM "Instagram Tool Care.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM electron.exe /T'
  Sleep 3000
  DetailPrint "Installation proceeding..."
!macroend

!macro customUnInstall
  DetailPrint "Closing running instances before uninstall..."
  nsExec::ExecToLog 'taskkill /F /IM "Instagram Tool Care.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM electron.exe /T'
  Sleep 2000
  DetailPrint "Uninstall proceeding..."
!macroend
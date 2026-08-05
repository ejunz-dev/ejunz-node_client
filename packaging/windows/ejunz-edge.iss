#ifndef AppVersion
#define AppVersion "0.0.0"
#endif
#ifndef SourceDir
#define SourceDir "."
#endif

#define AppName "Ejunz Edge"
#define AppExe "ejunz-edge-desktop-win_x64.exe"

[Setup]
AppId={{com.ejunz.edge.desktop}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Ejunz
AppPublisherURL=https://github.com/ejunz-dev/ejunz-node_client
DefaultDirName={localappdata}\Programs\Ejunz Edge
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=.
OutputBaseFilename=Ejunz Edge_{#AppVersion}_x64-setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName={#AppName}

[Files]
Source: "{#SourceDir}\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#SourceDir}\resources.neu"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"

[Run]
Filename: "{app}\{#AppExe}"; Description: "Launch {#AppName}"; Flags: nowait postinstall skipifsilent

import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync } from 'fs';

const startupDir = join(homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const vbsPath = 'd:\\Projects\\Projects\\CV_reelscroller\\x-autopilot\\run-silent.vbs';
const batPath = 'd:\\Projects\\Projects\\CV_reelscroller\\x-autopilot\\start-background.bat';

// Create a direct .bat in Startup folder that launches our daemon detached
const startupBat = join(startupDir, 'x-autopilot-autostart.bat');
const content = `@echo off\nstart "" wscript.exe "${vbsPath}"\n`;
writeFileSync(startupBat, content, 'utf-8');

console.log('✅ Created autostart script in Windows Startup folder:', startupBat);

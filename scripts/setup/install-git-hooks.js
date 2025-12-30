#!/usr/bin/env node

/**
 * Install Git Hooks
 *
 * This script installs git hooks from scripts/git-hooks/ to .git/hooks/
 * Run with: pnpm run hooks:install
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`v ${message}`, colors.green);
}

function error(message) {
  log(`x ${message}`, colors.red);
}

function info(message) {
  log(`i ${message}`, colors.blue);
}

function warning(message) {
  log(`! ${message}`, colors.yellow);
}

// Get project root directory
const projectRoot = path.resolve(__dirname, '..', '..');
const hooksSourceDir = path.join(projectRoot, 'scripts', 'git-hooks');
const hooksTargetDir = path.join(projectRoot, '.git', 'hooks');

// Check if .git directory exists
if (!fs.existsSync(path.join(projectRoot, '.git'))) {
  error('Not a git repository. Please run this script from the project root.');
  process.exit(1);
}

// Check if source hooks directory exists
if (!fs.existsSync(hooksSourceDir)) {
  error(`Source hooks directory not found: ${hooksSourceDir}`);
  process.exit(1);
}

log('\nInstalling Git Hooks...\n');

// Get all hook files from source directory
const hookFiles = fs.readdirSync(hooksSourceDir).filter(file => {
  const filePath = path.join(hooksSourceDir, file);
  return fs.statSync(filePath).isFile() && !file.endsWith('.md');
});

if (hookFiles.length === 0) {
  warning('No hook files found in scripts/git-hooks/');
  process.exit(0);
}

let installedCount = 0;
let skippedCount = 0;

// Install each hook
for (const hookFile of hookFiles) {
  const sourcePath = path.join(hooksSourceDir, hookFile);
  const targetPath = path.join(hooksTargetDir, hookFile);

  try {
    // Read the hook content
    const hookContent = fs.readFileSync(sourcePath, 'utf8');

    // Check if hook already exists
    if (fs.existsSync(targetPath)) {
      const existingContent = fs.readFileSync(targetPath, 'utf8');
      if (existingContent === hookContent) {
        info(`${hookFile} - already installed (up to date)`);
        skippedCount++;
        continue;
      }
    }

    // Copy the hook file
    fs.writeFileSync(targetPath, hookContent, { mode: 0o755 });

    // Make it executable (Unix-like systems)
    if (process.platform !== 'win32') {
      fs.chmodSync(targetPath, 0o755);
    }

    success(`${hookFile} - installed`);
    installedCount++;
  } catch (err) {
    error(`${hookFile} - failed to install: ${err.message}`);
  }
}

// Summary
log('\n----------------------------------------\n');

if (installedCount > 0) {
  success(`Installed ${installedCount} hook(s)`);
}

if (skippedCount > 0) {
  info(`Skipped ${skippedCount} hook(s) (already up to date)`);
}

log('\nAvailable hooks:');
hookFiles.forEach(hook => {
  log(`   - ${hook}`, colors.blue);
});

log('\nTo bypass hooks when needed:');
log('   git commit --no-verify');
log('   git push --no-verify');

log('\nGit hooks are now active!\n');

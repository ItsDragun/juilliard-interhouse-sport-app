/**
 * Rename all "fotmob" references to "jais" (Juilliard Academy Interhouse Sports)
 * across the entire public/ directory.
 */
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Files to process
const filesToProcess = [
  'index.html',
  'css/fotmob.css',
  'css/main.css',
  'css/app-shell.css',
  'js/pages.js',
  'js/app.js',
  'js/router.js',
  'js/theme.js',
  'js/ui.js',
  'js/admin.js',
  'js/auth.js',
  'js/db.js',
  'js/icons.js',
  'js/audio.js',
  'js/seed-data.js',
  'js/firebase-config.js',
];

let totalReplacements = 0;

for (const relFile of filesToProcess) {
  const filePath = path.join(publicDir, relFile);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${relFile}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // ---- Class name / CSS selector replacements ----
  // .fotmob-xxx → .jais-xxx  (CSS class names)
  // "fotmob-xxx" → "jais-xxx"  (JS string references to class names)
  content = content.replace(/fotmob-/g, 'jais-');
  
  // ---- Brand text replacements ----
  // "FotMob" brand text → "Juilliard Sports"
  content = content.replace(/FOTMOB\+/g, 'JUILLIARD');
  content = content.replace(/FOTMOB/g, 'JUILLIARD');
  content = content.replace(/FotMob\+/g, 'Juilliard');
  content = content.replace(/FotMob/g, 'Juilliard Sports');

  // ---- CSS file reference ----
  content = content.replace(/css\/fotmob\.css/g, 'css/styles.css');
  content = content.replace(/fotmob\.css/g, 'styles.css');
  
  // ---- Comment/doc header cleanups ----
  // Update comment headers that say "FotMob Native" etc
  content = content.replace(/Juilliard Sports Native Mobile Screens/g, 'Juilliard Academy Interhouse Sports - App Screens');
  content = content.replace(/Juilliard Sports App Interface/g, 'Juilliard Academy Interhouse Sports');
  content = content.replace(/Juilliard Sports-style/g, 'App-style');
  content = content.replace(/Juilliard Sports Native/g, 'Native App');
  content = content.replace(/Juilliard Sports Mobile Aesthetic/g, 'Mobile App Aesthetic');
  content = content.replace(/Juilliard Sports native app/g, 'app design');
  content = content.replace(/Juilliard Sports Experience/g, 'Sports Day Experience');
  content = content.replace(/Juilliard Sports Navigation/g, 'Main Navigation');

  // ---- Meta description cleanup ----
  content = content.replace(
    /Juilliard Interhouse Sports Day - Juilliard Sports Native Mobile Experience/g,
    'Juilliard Academy Interhouse Sports Day - Live Scores & Results'
  );
  
  // ---- Title cleanup ----
  content = content.replace(
    /Juilliard Sports - Juilliard Sports Day/g,
    'Juilliard Academy - Interhouse Sports Day'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = content.split('').length - originalContent.split('').length; // approximate
    console.log(`UPDATED: ${relFile}`);
    totalReplacements++;
  } else {
    console.log(`NO CHANGE: ${relFile}`);
  }
}

// Rename the CSS file itself
const oldCssPath = path.join(publicDir, 'css', 'fotmob.css');
const newCssPath = path.join(publicDir, 'css', 'styles.css');
if (fs.existsSync(oldCssPath)) {
  fs.renameSync(oldCssPath, newCssPath);
  console.log('\nRENAMED: css/fotmob.css → css/styles.css');
}

console.log(`\nDone! Updated ${totalReplacements} files.`);

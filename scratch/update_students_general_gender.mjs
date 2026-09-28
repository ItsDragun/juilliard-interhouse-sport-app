import fs from 'fs';

const filePath = 'public/js/seed-data.js';
let code = fs.readFileSync(filePath, 'utf8');
const studentStart = code.indexOf('export const INITIAL_STUDENTS = [');
if (studentStart > -1) {
  const before = code.substring(0, studentStart);
  let studentsPart = code.substring(studentStart);
  studentsPart = studentsPart.replaceAll('"gender": "Boys"', '"gender": "General"');
  studentsPart = studentsPart.replaceAll('"gender": "Girls"', '"gender": "General"');
  fs.writeFileSync(filePath, before + studentsPart, 'utf8');
  console.log('✅ INITIAL_STUDENTS updated with gender: General');
}

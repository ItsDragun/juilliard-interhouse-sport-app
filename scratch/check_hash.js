function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + str.length;
}

const target = "h_cgbpl1_17";
const candidates = [
  "admin2026",
  "admin",
  "osaruyi",
  "osaruyi2026",
  "osaruyiaideyan",
  "juilliard",
  "juilliard2026",
  "sportsday2026",
  "interhouse2026",
  "juilliardsports",
  "juilliardsport",
  "juilliardadmin",
  "osaruyi aideyan",
  "password",
  "12345678",
  "123456"
];

for (const c of candidates) {
  if (simpleHash(c) === target) {
    console.log("MATCH FOUND:", c);
  }
}
console.log("Target length:", 17);
// Notice length suffix is 17!

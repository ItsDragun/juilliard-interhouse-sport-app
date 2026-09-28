import { INITIAL_EVENTS } from "../public/js/seed-data.js";

console.log("Total events:", INITIAL_EVENTS.length);
INITIAL_EVENTS.forEach((e, i) => {
  console.log(`${i+1}. [${e.category}] ${e.id} - ${e.name} (Format: ${e.format || 'multi'}, Contenders: ${e.contenders ? e.contenders.join(' vs ') : 'All Houses'})`);
});

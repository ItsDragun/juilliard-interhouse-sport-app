const API_KEY = 'AIzaSyB2PhuebmPvGujVkYW22Z1Xs9woZbt6UCY';
const BASE_URL = 'https://firestore.googleapis.com/v1/projects/ja-mega-26/databases/(default)/documents';

async function verify() {
  const [housesData, eventsData, seedJs] = await Promise.all([
    fetch(BASE_URL + '/houses?key=' + API_KEY).then(r => r.json()),
    fetch(BASE_URL + '/events?pageSize=100&key=' + API_KEY).then(r => r.json()),
    fetch('https://ja-mega-26.web.app/js/seed-data.js').then(r => r.text())
  ]);

  console.log('=== Firestore Live Status ===');
  housesData.documents.forEach(d => {
    const id = d.name.split('/').pop();
    const f = d.fields;
    console.log(`House ${id}: totalPoints=${f.totalPoints?.integerValue || 0}, gold=${f.goldCount?.integerValue || 0}, silver=${f.silverCount?.integerValue || 0}, bronze=${f.bronzeCount?.integerValue || 0}, teamPoints=${f.teamPoints?.integerValue || 0}`);
  });

  const nonUpcoming = eventsData.documents.filter(d => d.fields.status?.stringValue !== 'upcoming');
  console.log('Non-upcoming events in Firestore:', nonUpcoming.length);

  console.log('\n=== Deployed seed-data.js Status ===');
  console.log('DEMO_SAMPLE_SCORES is empty array:', seedJs.includes('export const DEMO_SAMPLE_SCORES = [];'));
  console.log('Has completed events:', seedJs.includes('"completed"'));
  console.log('Has live events:', seedJs.includes('"live"'));
}

verify().catch(console.error);

const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3003;
const CAMUNDA_URL = 'http://localhost:8080/engine-rest';

const apartments = [
  {apartmentId:'apt-mi-1', location:'Milano', bedrooms:3, maxOccupancy:6, price:1500, agencyId:'agency-milano', ownerId:'owner-1'},
  {apartmentId:'apt-mi-2', location:'Milano', bedrooms:1, maxOccupancy:2, price:800,  agencyId:'agency-milano', ownerId:'owner-2'},
  {apartmentId:'apt-mi-3', location:'Milano', bedrooms:2, maxOccupancy:4, price:1100, agencyId:'agency-milano', ownerId:'owner-5'},
  {apartmentId:'apt-mi-4', location:'Torino', bedrooms:2, maxOccupancy:4, price:950,  agencyId:'agency-milano', ownerId:'owner-5'},
  {apartmentId:'apt-to-1', location:'Torino', bedrooms:2, maxOccupancy:4, price:900,  agencyId:'agency-torino', ownerId:'owner-2'},
  {apartmentId:'apt-to-2', location:'Torino', bedrooms:1, maxOccupancy:2, price:700,  agencyId:'agency-torino', ownerId:'owner-6'},
  {apartmentId:'apt-to-3', location:'Torino', bedrooms:3, maxOccupancy:5, price:1250, agencyId:'agency-torino', ownerId:'owner-2'},
  {apartmentId:'apt-to-4', location:'Roma',   bedrooms:3, maxOccupancy:6, price:1400, agencyId:'agency-torino', ownerId:'owner-8'},
  {apartmentId:'apt-ro-1', location:'Roma',   bedrooms:2, maxOccupancy:4, price:1400, agencyId:'agency-roma',   ownerId:'owner-4'},
  {apartmentId:'apt-ro-2', location:'Roma',   bedrooms:1, maxOccupancy:2, price:950,  agencyId:'agency-roma',   ownerId:'owner-7'},
  {apartmentId:'apt-ro-3', location:'Roma',   bedrooms:3, maxOccupancy:6, price:1600, agencyId:'agency-roma',   ownerId:'owner-7'},
  {apartmentId:'apt-ro-4', location:'Milano', bedrooms:1, maxOccupancy:2, price:900,  agencyId:'agency-roma',   ownerId:'owner-8'}
];

async function sendMessageWithRetry(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${CAMUNDA_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.status === 204 || response.status === 200) {
        return response;
      }
      const errorBody = await response.text();
      console.log(`  tentativo ${attempt}/${maxRetries} fallito — status ${response.status}: ${errorBody.slice(0, 150)}`);
    } catch (err) {
      console.log(`  tentativo ${attempt}/${maxRetries} fallito — errore rete: ${err.message}`);
    }
    if (attempt < maxRetries) {
      const backoff = 500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  console.log(`  tutti i ${maxRetries} tentativi falliti, rinuncio`);
  return null;
}

app.post('/partners/:partnerId/rental-requests', async (req, res) => {
  const { partnerId } = req.params;
  const { rentalId, location, numberOfRooms, maxBudget } = req.body;
  console.log(`[PARTNER MOCK] Richiesta per ${partnerId} (rentalId ${rentalId}): location=${location}`);

  res.status(202).json({ status: 'accepted' });

  const delay = 3000 + Math.random() * 1000;
  setTimeout(async () => {
    const matches = apartments.filter(a =>
      a.agencyId === partnerId &&
      a.location === location &&
      a.price <= maxBudget &&
      a.bedrooms >= numberOfRooms
    );
    const response = await sendMessageWithRetry({
      messageName: 'PartnerApartmentListSubmitted',
      businessKey: rentalId,
      localCorrelationKeys: { correlationId: { value: partnerId, type: 'String' } },
      processVariables: { apartments: { value: JSON.stringify(matches), type: 'String' } }
    });
    if (response) {
      console.log(`[PARTNER MOCK] Lista inviata per ${partnerId} — status ${response.status} — trovati ${matches.length}`);
    }
  }, delay);
});

app.post('/partners/:partnerId/notifications', (req, res) => {
  const { partnerId } = req.params;
  const { rentalId, stage, message } = req.body;
  console.log(`[PARTNER MOCK] Notifica per ${partnerId} (rentalId ${rentalId}): stage=${stage}${message ? ' - ' + message : ''}`);
  res.status(200).json({ status: 'delivered' });
});

app.post('/partners/:partnerId/payments', (req, res) => {
  const { partnerId } = req.params;
  const { rentalId, rentAmount, partnerFee } = req.body;
  console.log(`[PARTNER MOCK] Pagamento per ${partnerId} (rentalId ${rentalId}): rent=${rentAmount}€ fee=${partnerFee}€`);
  res.status(200).json({ status: 'received' });
});

app.listen(PORT, () => {
  console.log(`CommercialPartner mock in ascolto su http://localhost:${PORT}`);
});

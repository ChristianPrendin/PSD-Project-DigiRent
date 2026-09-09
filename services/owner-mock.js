const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3002;
const CAMUNDA_URL = 'http://localhost:8080/engine-rest';

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

app.post('/owners/:ownerId/visit-requests', async (req, res) => {
  const { ownerId } = req.params;
  const { rentalId, apartmentId, requestedPeriodStart } = req.body;
  console.log(`[OWNER MOCK] Richiesta disponibilità per ${ownerId} (rentalId ${rentalId}, apartmentId ${apartmentId})`);

  res.status(202).json({ status: 'accepted' });

  const delay = 3000 + Math.random() * 1000;
  setTimeout(async () => {
    const availableSlots = JSON.stringify([{ date: requestedPeriodStart || '2026-10-05', time: '15:00' }]);
    const response = await sendMessageWithRetry({
      messageName: 'OwnerAvailabilitySubmitted',
      businessKey: rentalId,
      localCorrelationKeys: { correlationId: { value: ownerId, type: 'String' } },
      processVariables: { availableSlots: { value: availableSlots, type: 'String' } }
    });
    if (response) {
      console.log(`[OWNER MOCK] Disponibilità inviata a Camunda per ${ownerId} — status ${response.status}`);
    }
  }, delay);
});

app.post('/owners/:ownerId/payments', (req, res) => {
  const { ownerId } = req.params;
  const { rentalId, amount } = req.body;
  console.log(`[OWNER MOCK] Pagamento ricevuto per ${ownerId} (rentalId ${rentalId}): ${amount}€`);
  res.status(200).json({ status: 'received' });
});

app.listen(PORT, () => {
  console.log(`Owner mock in ascolto su http://localhost:${PORT}`);
});

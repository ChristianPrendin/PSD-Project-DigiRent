const express = require('express');
const app = express();
app.use(express.json());

const PORT = 3001;

app.post('/customers/:customerId/notifications', (req, res) => {
  const { customerId } = req.params;
  const { rentalId, stage, message } = req.body;
  console.log(`[CUSTOMER MOCK] Notifica per ${customerId} (rentalId ${rentalId}): stage=${stage}${message ? ' - ' + message : ''}`);
  res.status(200).json({ status: 'delivered' });
});

app.listen(PORT, () => {
  console.log(`Customer mock in ascolto su http://localhost:${PORT}`);
});

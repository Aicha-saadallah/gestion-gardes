import dbConnect from "@/pages/api/back/model/connectDB";
import ModelEchange from "@/pages/api/back/mod/exchangeSchema";
import ModelGarde from "@/pages/api/back/mod/gardeSchema";
import ModelArticle from "@/pages/api/back/mod/articleSchemaDB";
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your actual secret
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (decoded.role !== 'Chef de service') {
    return res.status(403).json({ success: false, message: 'Access denied. Not a Chef de service.' });
  }

  const { service, status, exchangeId, decision, approverId } = req.query; // For GET
  const { exchangeId: bodyExchangeId, decision: bodyDecision, approverId: bodyApproverId } = req.body; // For PUT

  switch (req.method) {
    case 'GET':
      try {
        let query = {
          $or: [
            { 'gardesToGive.service': decoded.service }, // Gardes given by doctors in their service
            { 'gardesToGet.service': decoded.service } // Gardes received by doctors in their service
          ]
        };

        if (status && status !== 'all') {
          query.status = status;
        }

        const exchanges = await ModelEchange.find(query)
          .populate({
            path: 'fromDoctor',
            select: 'nom prenom email service'
          })
          .populate({
            path: 'gardesToGive',
            select: 'date nom prenom service'
          })
          .populate({
            path: 'gardesToGet',
            select: 'date nom prenom service'
          })
          .sort({ createdAt: -1 });

        // Filter exchanges to only include those relevant to the Chef de service's own service
        const relevantExchanges = exchanges.filter(exchange => {
            const involvesTheirService = exchange.gardesToGive.some(garde => garde.service === decoded.service) ||
                                       exchange.gardesToGet.some(garde => garde.service === decoded.service);
            return involvesTheirService;
        });

        res.status(200).json({ success: true, exchanges: relevantExchanges });
      } catch (error) {
        console.error('Error fetching exchanges:', error);
        res.status(500).json({ success: false, message: 'Error fetching exchanges', error: error.message });
      }
      break;

    case 'PUT':
      try {
        const idToUpdate = bodyExchangeId || exchangeId;
        const finalDecision = bodyDecision || decision;
        const finalApproverId = bodyApproverId || approverId;

        if (!idToUpdate || !finalDecision || !finalApproverId) {
          return res.status(400).json({ success: false, message: 'Missing exchange ID, decision, or approver ID' });
        }

        const exchange = await ModelEchange.findById(idToUpdate);
        if (!exchange) {
          return res.status(404).json({ success: false, message: 'Exchange not found' });
        }

        if (exchange.status !== 'en attente') {
            return res.status(400).json({ success: false, message: 'This exchange has already been processed.' });
        }

        let updateData = {
          status: finalDecision === 'approve' ? 'accepté' : 'refusé',
          respondedAt: new Date(),
          respondedBy: finalApproverId,
        };

        const updatedExchange = await ModelEchange.findByIdAndUpdate(
          idToUpdate,
          updateData,
          { new: true }
        );

        if (finalDecision === 'approve') {
          // Logic for approving the exchange: Update involved guardes
          for (const gardeToGiveId of updatedExchange.gardesToGive) {
            await ModelGarde.findByIdAndUpdate(gardeToGiveId, {
              doctor: updatedExchange.toDoctors[0], // Assuming one recipient for simplicity
              nom: (await ModelArticle.findById(updatedExchange.toDoctors[0])).nom,
              prenom: (await ModelArticle.findById(updatedExchange.toDoctors[0])).prenom,
            });
          }
          for (const gardeToGetId of updatedExchange.gardesToGet) {
            await ModelGarde.findByIdAndUpdate(gardeToGetId, {
              doctor: updatedExchange.fromDoctor,
              nom: (await ModelArticle.findById(updatedExchange.fromDoctor)).nom,
              prenom: (await ModelArticle.findById(updatedExchange.fromDoctor)).prenom,
            });
          }
        }

        res.status(200).json({ success: true, message: `Exchange ${finalDecision === 'approve' ? 'approved' : 'rejected'} successfully`, exchange: updatedExchange });
      } catch (error) {
        console.error('Error processing exchange:', error);
        res.status(500).json({ success: false, message: 'Error processing exchange', error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
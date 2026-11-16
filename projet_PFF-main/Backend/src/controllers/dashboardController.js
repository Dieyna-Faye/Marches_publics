const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const models = require('../models');
const { Tender, Bid, Supplier, Contract, Score, AuditLog, Alert } = models;

const getDashboard = asyncHandler(async (req, res) => {
  const userRole = req.user ? req.user.role : 'admin';
  const userId = req.user ? req.user.id : null;

  let tenders = [];
  let bids = [];
  let contracts = [];
  let alerts = [];
  let suppliers = [];

  if (userRole === 'supplier') {
    const supplier = await Supplier.findOne({ where: { userId } });
    const supplierId = supplier ? supplier.id : null;

    tenders = await Tender.findAll({ where: { status: 'publie' } });
    bids = supplierId
      ? await Bid.findAll({ where: { supplierId }, include: [{ model: Score, as: 'score' }, { model: Tender, as: 'tender' }] })
      : [];
    contracts = supplierId
      ? await Contract.findAll({ where: { supplierId } })
      : [];
    suppliers = supplier ? [supplier] : [];
    alerts = [];
  } else if (userRole === 'authority') {
    tenders = await Tender.findAll({ where: { createdBy: userId } });
    const tenderIds = tenders.map((t) => t.id);
    bids = tenderIds.length
      ? await Bid.findAll({ where: { tenderId: tenderIds, status: { [Op.ne]: 'brouillon' } }, include: [{ model: Score, as: 'score' }] })
      : [];
    contracts = tenderIds.length
      ? await Contract.findAll({ where: { tenderId: tenderIds } })
      : [];
    suppliers = await Supplier.findAll();
    alerts = tenderIds.length
      ? await Alert.findAll({ where: { entityId: tenderIds, status: 'ouverte' } })
      : [];
  } else {
    // Admin, Commission, Auditeur : vue plateforme
    tenders = await Tender.findAll();
    bids = await Bid.findAll({ where: { status: { [Op.ne]: 'brouillon' } }, include: [{ model: Score, as: 'score' }] });
    suppliers = await Supplier.findAll();
    contracts = await Contract.findAll();
    alerts = await Alert.findAll({ where: { status: 'ouverte' } });
  }

  const published = tenders.filter((t) => t.status === 'publie').length;
  const inValidation = tenders.filter((t) => t.status === 'en_validation').length;
  const inEvaluation = tenders.filter((t) => ['en_ouverture', 'en_evaluation'].includes(t.status)).length;
  const closed = tenders.filter((t) => t.status === 'cloture').length;
  const awardedTenders = tenders.filter((t) => t.status === 'attribue').length;

  const totalBudget = tenders.reduce((a, t) => a + Number(t.estimatedBudget || 0), 0);
  const contractAmount = contracts.reduce((a, c) => a + Number(c.amount || 0), 0);
  const savings = totalBudget - contractAmount;

  const compliant = bids.filter((b) => b.isCompliant).length;
  const complianceRate = bids.length ? Math.round((compliant / bids.length) * 100) : 0;

  const lateContracts = contracts.filter(
    (c) => c.progress < 100 && c.endDate && new Date(c.endDate) < new Date()
  ).length;
  const atRisk = contracts.filter((c) => c.delayRiskPredicted || Number(c.penaltyApplied || 0) > 0).length;

  const topSuppliers = bids.reduce((acc, b) => {
    acc[b.supplierId] = (acc[b.supplierId] || 0) + 1;
    return acc;
  }, {});
  const activeSuppliers = Object.entries(topSuppliers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ supplierId: id, bids: count }));

  const monthKeys = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - offset));
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, label: date.toLocaleString('fr-FR', { month: 'short' }) };
  });
  const monthlySubmissions = monthKeys.map((month) => ({
    month: month.label,
    count: bids.filter((bid) => {
      const created = bid.createdAt && new Date(bid.createdAt);
      return created && `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}` === month.key;
    }).length,
  }));

  res.json({
    role: userRole,
    kpis: {
      appelOffresPublies: published,
      appelOffresBrouillons: tenders.filter((t) => t.status === 'brouillon').length,
      appelOffresEnValidation: inValidation,
      appelOffresEnEvaluation: inEvaluation,
      appelOffresClotures: closed,
      appelOffresAttribues: awardedTenders,
      appelOffresArchives: tenders.filter((t) => t.status === 'archive').length,
      nombreAppelsOffres: tenders.length,
      offresRecues: bids.length,
      tauxParticipation: tenders.length ? Math.round((bids.length / Math.max(1, tenders.length)) * 100) : 0,
      averageOffersPerTender: tenders.length ? Math.round((bids.length / tenders.length) * 10) / 10 : 0,
      montantTotalMarches: Math.round(contractAmount),
      budgetTotal: Math.round(totalBudget),
      economiesRealisees: Math.round(savings > 0 ? savings : 0),
      fournisseursActifs: suppliers.length,
      marchesEnRetard: lateContracts,
      marchesARisque: atRisk,
      tauxConformite: complianceRate,
      alertesOuvertes: alerts.length,
    },
    topSuppliers: activeSuppliers,
    monthlySubmissions,
  });
});

module.exports = { getDashboard };

module.exports = { getDashboard };


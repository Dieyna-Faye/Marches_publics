const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const models = require('../models');
const { Tender, TenderDocument, User, Bid, Supplier, BidDocument, EvaluationCriteria } = models;
const { TENDER_TYPES, TENDER_STATUSES } = require('../config/constants');
const { writeAudit } = require('../middleware/audit');
const { UPLOAD_DIR } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

function generateReference() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AO-${year}-${rand}`;
}

const createTender = asyncHandler(async (req, res) => {
  const body = req.validated;
  if (!TENDER_TYPES.includes(body.type)) return res.status(400).json({ error: 'Type de marche invalide' });
  const tender = await Tender.create({
    reference: generateReference(),
    title: body.title,
    description: body.description,
    type: body.type,
    estimatedBudget: body.estimatedBudget,
    currency: body.currency || 'XOF',
    submissionDeadline: body.submissionDeadline,
    status: 'brouillon',
    createdBy: req.user.id,
  });
  await writeAudit({ user: req.user, action: 'CREATE_TENDER', entity: 'Tender', entityId: tender.id, req });
  res.status(201).json(tender);
});

const listTenders = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.type) where.type = req.query.type;
  if (req.user.role === 'supplier') where.status = 'publie';
  const tenders = await Tender.findAll({
    where,
    include: [{ model: TenderDocument, as: 'documents', ...(req.user.role === 'supplier' ? { attributes: ['id', 'label', 'originalName', 'mimeType', 'size'] } : {}) }],
    order: [['createdAt', 'DESC']],
  });
  res.json(tenders);
});

const listPublicTenders = asyncHandler(async (req, res) => {
  const where = { status: 'publie' };
  if (req.query.type) where.type = req.query.type;
  const tenders = await Tender.findAll({
    where,
    attributes: ['id', 'reference', 'title', 'description', 'type', 'estimatedBudget', 'currency', 'submissionDeadline', 'status', 'publishedAt', 'createdAt', 'updatedAt'],
    include: [{ model: TenderDocument, as: 'documents', attributes: ['id', 'label', 'originalName', 'mimeType', 'size'] }],
    order: [['publishedAt', 'DESC']],
  });
  res.json(tenders);
});

const getPublicTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findOne({
    where: { id: req.params.id, status: 'publie' },
    attributes: ['id', 'reference', 'title', 'description', 'type', 'estimatedBudget', 'currency', 'submissionDeadline', 'status', 'publishedAt', 'createdAt', 'updatedAt'],
    include: [{ model: TenderDocument, as: 'documents', attributes: ['id', 'label', 'originalName', 'mimeType', 'size'] }],
  });
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres public introuvable' });
  res.json(tender);
});

const downloadTenderDocument = asyncHandler(async (req, res) => {
  const document = await TenderDocument.findOne({ where: { id: req.params.documentId, tenderId: req.params.id }, include: [{ model: Tender, as: 'tender' }] });
  if (!document || !document.tender || document.tender.status !== 'publie') return res.status(404).json({ error: 'Document public introuvable' });
  const root = fs.realpathSync(path.resolve(process.cwd(), UPLOAD_DIR));
  const candidate = path.resolve(process.cwd(), document.filePath);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(candidate)) return res.status(404).json({ error: 'Document introuvable' });
  const safePath = fs.realpathSync(candidate);
  const realRelative = path.relative(root, safePath);
  if (realRelative.startsWith('..') || path.isAbsolute(realRelative) || !fs.statSync(safePath).isFile()) return res.status(404).json({ error: 'Document introuvable' });
  res.download(safePath, document.originalName || 'document.pdf');
});

const listPublishedTenders = asyncHandler(async (req, res) => {
  const tenders = await Tender.findAll({
    where: { status: 'publie' },
    attributes: ['id', 'reference', 'title', 'description', 'type', 'estimatedBudget', 'currency', 'submissionDeadline', 'status', 'publishedAt', 'createdAt', 'updatedAt'],
    include: [{ model: TenderDocument, as: 'documents', attributes: ['id', 'label', 'originalName', 'mimeType', 'size'] }],
    order: [['publishedAt', 'DESC']],
  });
  res.json(tenders);
});

const getTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id, {
    include: [
      { model: TenderDocument, as: 'documents' },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
    ],
  });
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (req.user.role === 'supplier' && tender.status !== 'publie') return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (req.user.role === 'supplier') tender.documents = (tender.documents || []).map((doc) => ({ id: doc.id, label: doc.label, originalName: doc.originalName, mimeType: doc.mimeType, size: doc.size }));
  res.json(tender);
});

const updateTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (tender.status === 'publie' || tender.status === 'cloture')
    return res.status(400).json({ error: 'Appel d\'offres deja publie, modification impossible' });
  const body = req.validated;
  Object.assign(tender, body);
  await tender.save();
  await writeAudit({ user: req.user, action: 'UPDATE_TENDER', entity: 'Tender', entityId: tender.id, req });
  res.json(tender);
});

async function hasTechnicalCriteria(tenderId) {
  const criteria = await EvaluationCriteria.findAll({ where: { tenderId }, attributes: ['category'] });
  return criteria.some((item) => !['administratif', 'financier'].includes(String(item.category || '').toLowerCase()));
}

const publishTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (!(await hasTechnicalCriteria(tender.id))) return res.status(409).json({ error: 'Ajoutez au moins un critère technique issu du dossier de consultation avant de publier le marché.' });
  tender.status = 'publie';
  tender.publishedAt = new Date();
  await tender.save();
  await writeAudit({ user: req.user, action: 'PUBLISH_TENDER', entity: 'Tender', entityId: tender.id, req });
  res.json({ message: 'Appel d\'offres publie', tender });
});

const archiveTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  tender.status = 'archive';
  tender.archivedAt = new Date();
  await tender.save();
  await writeAudit({ user: req.user, action: 'ARCHIVE_TENDER', entity: 'Tender', entityId: tender.id, req });
  res.json({ message: 'Archive' });
});

const addTenderDocument = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoye' });
  const doc = await TenderDocument.create({
    tenderId: tender.id,
    label: req.body.label || 'Cahier des charges',
    filePath: path.relative(process.cwd(), req.file.path),
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
  await writeAudit({ user: req.user, action: 'ADD_TENDER_DOC', entity: 'TenderDocument', entityId: doc.id, req });
  res.status(201).json(doc);
});

const submitForValidation = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (tender.status !== 'brouillon') {
    return res.status(400).json({ error: 'Seul un appel d\'offres en brouillon peut être soumis pour validation.' });
  }
  if (!(await hasTechnicalCriteria(tender.id))) return res.status(409).json({ error: 'Ajoutez au moins un critère technique issu du dossier de consultation avant de soumettre le marché pour validation.' });
  tender.status = 'en_validation';
  await tender.save();
  await writeAudit({ user: req.user, action: 'SUBMIT_TENDER_VALIDATION', entity: 'Tender', entityId: tender.id, req });
  res.json({ message: 'Appel d\'offres soumis pour validation avec succès.', tender });
});

const closeTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (tender.status !== 'publie') {
    return res.status(400).json({ error: 'Seul un appel d\'offres publié peut être clôturé.' });
  }
  tender.status = 'cloture';
  await tender.save();
  await writeAudit({ user: req.user, action: 'CLOSE_TENDER', entity: 'Tender', entityId: tender.id, req });
  res.json({ message: 'Période de soumission clôturée.', tender });
});

const openBidsSession = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });

  if (!['commission', 'authority', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Seuls la commission d’évaluation ou l’autorité contractante peuvent ouvrir les plis.' });
  }

  const now = new Date();
  const deadline = tender.submissionDeadline ? new Date(tender.submissionDeadline) : null;
  const force = Boolean(req.body?.force || req.query?.force);
  // Si le statut est encore 'publie' et que la deadline n'est pas passée (et ouverture anticipée non forcée)
  if (tender.status === 'publie' && deadline && deadline > now && !force) {
    return res.status(400).json({
      error: `La date limite de soumission (${deadline.toLocaleString('fr-FR')}) n'est pas encore échue. Les plis restent scellés jusqu'à l'heure limite.`
    });
  }

  if (['en_evaluation', 'en_attribution', 'attribue'].includes(tender.status)) {
    return res.status(400).json({ error: 'Les plis de cet appel d\'offres ont déjà été ouverts.' });
  }

  // Récupérer toutes les offres déposées
  const bids = await Bid.findAll({
    where: { tenderId: tender.id, status: { [Op.ne]: 'brouillon' } },
    include: [{ model: Supplier, as: 'supplier' }, { model: BidDocument, as: 'documents' }]
  });

  // Basculer l'appel d'offres en évaluation
  tender.status = 'en_evaluation';
  await tender.save();

  // Basculer les offres déposées en évaluation
  for (const bid of bids) {
    if (bid.status === 'deposee' || bid.status === 'ouvert') {
      bid.status = 'en_evaluation';
      await bid.save();
    }
  }

  const pvOpening = {
    tenderReference: tender.reference,
    tenderTitle: tender.title,
    openedAt: now.toISOString(),
    openedBy: {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      role: req.user.role,
    },
    bidsCount: bids.length,
    bids: bids.map((b) => ({
      reference: b.reference,
      supplier: b.supplier ? b.supplier.companyName : 'Fournisseur inconnu',
      financialAmount: b.financialAmount,
      currency: b.currency,
      executionDelayDays: b.executionDelayDays,
      documentsCount: (b.documents || []).length,
      receiptHash: b.receiptHash,
      submittedAt: b.submittedAt,
    })),
  };

  await writeAudit({
    user: req.user,
    action: 'OPEN_BIDS_SESSION',
    entity: 'Tender',
    entityId: tender.id,
    req,
    details: pvOpening,
  });

  res.json({
    message: 'Séance d’ouverture des plis formalisée avec succès.',
    tender,
    pv: pvOpening,
    unsealedBidsCount: bids.length,
  });
});

const cancelTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findByPk(req.params.id);
  if (!tender) return res.status(404).json({ error: 'Appel d\'offres introuvable' });
  if (['attribue', 'archive'].includes(tender.status)) {
    return res.status(400).json({ error: 'Impossible d\'annuler une procédure déjà attribuée ou archivée.' });
  }
  tender.status = 'annule';
  await tender.save();
  await writeAudit({
    user: req.user,
    action: 'CANCEL_TENDER',
    entity: 'Tender',
    entityId: tender.id,
    req,
    details: { reason: req.body.reason || 'Annulation administrative motivée' },
  });
  res.json({ message: 'Appel d\'offres annulé.', tender });
});

module.exports = {
  createTender,
  listTenders,
  listPublishedTenders,
  listPublicTenders,
  getPublicTender,
  downloadTenderDocument,
  getTender,
  updateTender,
  submitForValidation,
  publishTender,
  closeTender,
  openBidsSession,
  cancelTender,
  archiveTender,
  addTenderDocument,
};

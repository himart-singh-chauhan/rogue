const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const c = require('../controllers/certificateController');

// Public
router.get('/verify/:number', c.verifyCertificate);

// Admin (approval, issuance, templates)
router.get('/admin/templates', protect, admin, c.listTemplates);
router.post('/admin/templates', protect, admin, c.createTemplate);
router.put('/admin/templates/:id', protect, admin, c.updateTemplate);
router.delete('/admin/templates/:id', protect, admin, c.deleteTemplate);
router.get('/admin/queue', protect, admin, c.getApprovalQueue);
router.get('/admin/issued', protect, admin, c.listIssued);
router.post('/admin/issue', protect, admin, c.issueCertificate);
router.put('/admin/:id/revoke', protect, admin, c.revokeCertificate);

// Athlete
router.get('/mine', protect, c.getMyCertificates);
router.get('/:number/download', protect, c.getCertificateForDownload);

module.exports = router;

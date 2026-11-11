const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  createRecordByAdmin,
  updateRecordByAdmin,
  deleteRecordByAdmin,
  getAllEventsByAdmin,
  createEventByAdmin,
  updateEventByAdmin,
  deleteEventByAdmin,
  getAllProductsByAdmin,
  createProductByAdmin,
  updateProductByAdmin,
  deleteProductByAdmin,
  uploadProductImage,
  getAllInquiries,
  deleteInquiry,
  getAllOrdersByAdmin,
  updateOrderShippingStatusByAdmin,
  deleteOrderByAdmin,
  getCustomerPurchaseHistoryByAdmin,
  getPaymentsLedger,
  updatePaymentStatus,
  createManualRevenue,
  updateSuccessMessages,
  getJudgesRoster,
  assignRecordToJudge,
  submitJudgeDecision,
  approveFinalDecision,
  revertJudgeDecision,
  updateJudgeNotes,
  getHomepageRecords,
  updateRecordHomepageSection,
  removeRecordFromHomepage
} = require('../controllers/adminController');

const {
  getAppeals,
  getAppealById,
  updateAppealStatus,
  updateAppealNotes
} = require('../controllers/adminAppealsController');

const {
  getAIScans,
  updateAIScanOverride,
  flagSuspiciousActivity,
  getAISettings,
  updateAISettings
} = require('../controllers/aiVerificationController');

const {
  getReports,
  updateReport,
  getMessages,
  sendMessage,
  getBans
} = require('../controllers/adminModerationController');

const {
  getMediaAssets,
  getCertificates,
  updateCertificateOrder,
  getPageContent,
  updatePageContent,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  getHomepageSettings,
  updateHomepageSettings
} = require('../controllers/adminContentController');

const { productImageUpload, bannerUpload } = require('../config/upload');
const { protect, admin } = require('../middleware/authMiddleware');

// Lock down all endpoints underneath protection check
router.use(protect);
const extras = require('../controllers/adminExtrasController');
router.use(admin);

// 👥 User Operations
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserByAdmin);
router.delete('/users/:id', deleteUserByAdmin);

// ⚔️ Records Operations
router.post('/records', createRecordByAdmin);
router.put('/records/:id', updateRecordByAdmin);
router.delete('/records/:id', deleteRecordByAdmin);

// 📅 Events Operations
router.get('/events', getAllEventsByAdmin);
router.post('/events', createEventByAdmin);
router.put('/events/:id', updateEventByAdmin);
router.delete('/events/:id', deleteEventByAdmin);

// 🛍️ Shop Catalog Operations
router.get('/products', getAllProductsByAdmin);
router.post('/products', createProductByAdmin);
router.put('/products/:id', updateProductByAdmin);
router.delete('/products/:id', deleteProductByAdmin);
router.post('/products/:id/image', productImageUpload.single('productImage'), uploadProductImage);

// 📦 Shop Orders Operations
router.get('/orders', getAllOrdersByAdmin);
router.put('/orders/:id/shipping', updateOrderShippingStatusByAdmin);
router.delete('/orders/:id', deleteOrderByAdmin);
router.get('/orders/customer/:email', getCustomerPurchaseHistoryByAdmin);

// ✉️ Support Ticket Operations
router.get('/contacts', getAllInquiries);
router.delete('/contacts/:id', deleteInquiry);

// 💳 Dynamic Payments & Oversight Operations
router.get('/payments', getPaymentsLedger);
router.put('/payments/update', updatePaymentStatus);
router.post('/payments/create', createManualRevenue);

// ✉️ Success Message Settings Operations
router.put('/success-messages', updateSuccessMessages);

// 👨‍⚖️ Adjudicator Operations
router.get('/judges', getJudgesRoster);
router.put('/judges/:id/notes', updateJudgeNotes);
router.put('/records/:id/assign', assignRecordToJudge);
router.put('/records/:id/judge-review', submitJudgeDecision);
router.put('/records/:id/approve', approveFinalDecision);
router.put('/records/:id/revert', revertJudgeDecision);

// 🏠 Homepage Records Control
router.get('/homepage/records', getHomepageRecords);
router.put('/records/:id/homepage', updateRecordHomepageSection);
router.delete('/records/:id/homepage', removeRecordFromHomepage);

// 🤖 AI Verification Operations
router.get('/ai-verification/scans', getAIScans);
router.put('/ai-verification/scans/:id/override', updateAIScanOverride);
router.put('/ai-verification/scans/:id/flag', flagSuspiciousActivity);
router.get('/ai-verification/settings', getAISettings);
router.put('/ai-verification/settings', updateAISettings);

// 🛡️ Moderation & Communications (Phase 1)
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.get('/messages', getMessages);
router.post('/messages', extras.sendAdminMessage); // real composer (to one member or all)
router.get('/bans', getBans);

// ⚖️ Dispute Resolution / Appeals (Phase 12)
router.get('/appeals', getAppeals);
router.get('/appeals/:id', getAppealById);
router.put('/appeals/:id/status', updateAppealStatus);
router.put('/appeals/:id/notes', updateAppealNotes);

// 🎬 Content, Media & Certificates (Phase 2)
router.get('/media', getMediaAssets);
router.post('/media', extras.createMediaAsset);
router.put('/media/:id', extras.updateMediaAsset);
router.delete('/media/:id', extras.deleteMediaAsset);
router.get('/certificates', getCertificates);
router.put('/certificates/:id/order', updateCertificateOrder);

// 📄 CMS / Content Pages
router.get('/content/pages/:slug', getPageContent);
router.put('/content/pages/:slug', updatePageContent);

router.get('/content/faqs', getFaqs);
router.post('/content/faqs', createFaq);
router.put('/content/faqs/:id', updateFaq);
router.delete('/content/faqs/:id', deleteFaq);

router.get('/content/homepage/:section', getHomepageSettings);
router.put('/content/homepage/:section', updateHomepageSettings);

// 🔒 Security & Infrastructure (Phase 3)
const { getAuditLogs, triggerBackup, getApiKeys, updateSeoSettings } = require('../controllers/adminSecurityController');
router.get('/security/audit-logs', getAuditLogs);
router.post('/security/backup', triggerBackup);
router.get('/security/api-keys', getApiKeys);
router.put('/security/seo', extras.updateSeoSettings); // persisted in system_settings
router.put('/settings/fees', extras.updateFees); // record submission / challenge fees

// 💰 Monetization, Sponsorships, Rankings & VIP (Phase 4)
const { getSponsors, createSponsor, updateSponsor, deleteSponsor, trackSponsorClick, trackSponsorView, updateVipStatus, getRevenueMetrics, recalculateRankings } = require('../controllers/adminMonetizationController');
router.get('/monetization/sponsors', getSponsors);
router.post('/monetization/sponsors', bannerUpload.fields([{ name: 'bannerImage', maxCount: 1 }, { name: 'logoImage', maxCount: 1 }]), createSponsor);
router.put('/monetization/sponsors/:id', bannerUpload.fields([{ name: 'bannerImage', maxCount: 1 }, { name: 'logoImage', maxCount: 1 }]), updateSponsor);
router.delete('/monetization/sponsors/:id', deleteSponsor);
router.post('/monetization/sponsors/:id/click', trackSponsorClick);
router.post('/monetization/sponsors/:id/view', trackSponsorView);
router.put('/monetization/vip/:userId', updateVipStatus);
router.get('/monetization/revenue', getRevenueMetrics);
router.get('/monetization/breakdown', extras.getMonetizationBreakdown);

// Championship belts & other products that need per-competitor approval
const productAuth = require('../controllers/productAuthController');
router.get('/product-authorizations', productAuth.listAuthorizations);
router.post('/product-authorizations', productAuth.grantAuthorization);
router.put('/product-authorizations/:id', productAuth.decideAuthorization);
router.post('/monetization/rankings/recalculate', recalculateRankings);

// A member's full profile (Users → click a name) and emailing them
const members = require('../controllers/adminMemberController');
router.get('/members/:id/overview', members.getMemberOverview);
router.post('/members/:id/email', members.emailMember);

// Referral, Points & Rewards program
const rewards = require('../controllers/rewardsController');
router.get('/rewards/settings', rewards.getSettings);
router.put('/rewards/settings', rewards.updateSettings);
router.get('/rewards/members', rewards.listMembers);
router.post('/rewards/adjust', rewards.adjust);
router.get('/rewards/transactions', rewards.listTransactions);
router.get('/rewards/referrals', rewards.listReferrals);
router.put('/rewards/referrals/:id', rewards.decideReferral);
router.get('/rewards/report', rewards.report);

// 🏆 Challenges Management
const { getChallenges, createChallenge, updateChallenge, deleteChallenge, toggleFeatureChallenge } = require('../controllers/adminChallengesController');
const { challengeUpload } = require('../config/upload');
router.get('/challenges', getChallenges);
router.post('/challenges', challengeUpload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'thumbnailImage', maxCount: 1 }]), createChallenge);
router.put('/challenges/:id', challengeUpload.fields([{ name: 'videoFile', maxCount: 1 }, { name: 'thumbnailImage', maxCount: 1 }]), updateChallenge);
router.delete('/challenges/:id', deleteChallenge);
router.put('/challenges/:id/feature', toggleFeatureChallenge);

module.exports = router;

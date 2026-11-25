const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Contact Us form: saved for Admin → Inquiries and emailed to the AMPEX mailbox (see contactController)
router.post('/', require('../controllers/contactController').submitContact);

router.get('/success-messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*');

    if (error) throw error;

    const settings = {};
    (data || []).forEach(item => {
      settings[item.key] = item.value;
    });

    const finalSettings = {
      msg_shop: settings.msg_shop || 'Thank you! Your order has been processed securely. Your items will be processed and shipped shortly.',
      msg_spectator: settings.msg_spectator || 'Thank you! Your order has been processed securely. Your spectator passes will be activated shortly.',
      msg_combined: settings.msg_combined || 'Thank you! Your order has been processed securely. Your items will be shipped shortly and your spectator passes will be activated shortly.',
      msg_record: settings.msg_record || 'Thank you! Your order has been processed securely. Our adjudication team will get back to you with the results using the email you provided.',
      msg_challenge: settings.msg_challenge || 'Thank you! Your challenge registration fee has been securely processed. Prepare to compete and claim your record!'
    };

    res.json(finalSettings);
  } catch (error) {
    res.json({
      msg_shop: 'Thank you! Your order has been processed securely. Your items will be processed and shipped shortly.',
      msg_spectator: 'Thank you! Your order has been processed securely. Your spectator passes will be activated shortly.',
      msg_combined: 'Thank you! Your order has been processed securely. Your items will be shipped shortly and your spectator passes will be activated shortly.',
      msg_record: 'Thank you! Your order has been processed securely. Our adjudication team will get back to you with the results using the email you provided.',
      msg_challenge: 'Thank you! Your challenge registration fee has been securely processed. Prepare to compete and claim your record!'
    });
  }
});

module.exports = router;

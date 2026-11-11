const supabase = require('../config/supabase');

// Submission / challenge fees, edited in Admin → System Settings → Fees (system_settings table).
const DEFAULT_FEES = { submissionFee: 3.5, challengeFee: 3.5 };
const toFee = (v, d) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n >= 0 && n <= 10000 ? n : d;
};

const getFees = async () => {
  const { data } = await supabase.from('system_settings').select('key, value').in('key', ['submission_fee', 'challenge_fee']);
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return {
    submissionFee: toFee(map.submission_fee, DEFAULT_FEES.submissionFee),
    challengeFee: toFee(map.challenge_fee, DEFAULT_FEES.challengeFee),
  };
};

const feeForRecordType = async (recordType) => {
  const fees = await getFees();
  return recordType === 'challenge' ? fees.challengeFee : fees.submissionFee;
};

module.exports = { DEFAULT_FEES, toFee, getFees, feeForRecordType };

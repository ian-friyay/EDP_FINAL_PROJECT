// Shared in-memory store for profile unlock requests and 30-day cooldowns
const unlockRequestsStore = [
  {
    id: 1,
    user_id: 'MMC-0001',
    student_id: 'MMC-0001',
    student_name: 'Jasmine Requestor',
    student_email: 'jasmine@serbisyou.ph',
    location: 'Victoria, Oriental Mindoro',
    request_type: 'profile_unlock',
    notes: 'Incorrect contact number submitted during initial registration.',
    status: 'pending',
    admin_notes: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  }
];

const userCooldowns = new Map(); // userId -> { updatedAt, unlockedByAdmin: boolean }
const passwordOtpStore = new Map(); // userId -> { otp, expiresAt }

module.exports = {
  unlockRequestsStore,
  userCooldowns,
  passwordOtpStore
};

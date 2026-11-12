export const KNOWN_USERS = {
  'MMC-1042': {
    user_id: 'MMC-1042',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    username: 'juandelacruz',
    email: 'juan.delacruz@serbisyou.ph',
    contact_number: '09123456789',
    user_type: 'Provider',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Central',
  },
  'MMC-0001': {
    user_id: 'MMC-0001',
    first_name: 'Jasmine',
    last_name: 'Requestor',
    username: 'jasmine',
    email: 'jasmine.requestor@serbisyou.ph',
    contact_number: '09123456789',
    user_type: 'Requestor',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Central',
  },
  'MMC-2015': {
    user_id: 'MMC-2015',
    first_name: 'Maria',
    last_name: 'Santos',
    username: 'mariasantos',
    email: 'maria.santos@serbisyou.ph',
    contact_number: '09123456789',
    user_type: 'Provider',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Batasan Hills',
  },
  'MMC-3044': {
    user_id: 'MMC-3044',
    first_name: 'Pedro',
    last_name: 'Penduko',
    username: 'pedropenduko',
    email: 'pedro.penduko@serbisyou.ph',
    contact_number: '09123456789',
    user_type: 'Provider',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Commonwealth',
  },
};

export const getCurrentUserId = () => {
  try {
    return localStorage.getItem('user_id') || 'MMC-1042';
  } catch {
    return 'MMC-1042';
  }
};

export const getCurrentUser = () => {
  const uid = getCurrentUserId();
  return (
    KNOWN_USERS[uid] || {
      user_id: uid,
      first_name: 'User',
      last_name: uid,
      username: uid.toLowerCase(),
      email: `${uid.toLowerCase()}@serbisyou.ph`,
      contact_number: '09123456789',
      user_type: 'Provider',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Brgy. Central',
    }
  );
};

export const setCurrentUser = (userId) => {
  try {
    localStorage.setItem('user_id', userId);
    window.dispatchEvent(new CustomEvent('serbisyou_user_changed', { detail: { userId } }));
  } catch {
    // ignore
  }
};

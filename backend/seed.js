const supabase = require('./supabaseClient');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  console.log('[SerbisYou DB Seeder] Checking Supabase database state...');

  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const initialUsers = [
    {
      user_id: 'MMC-0000',
      first_name: 'Administrator',
      last_name: 'Console',
      username: 'admin',
      email: 'adriandadoviernes@gmail.com',
      contact_number: '09123456789',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Central',
      user_type: 'Admin',
      department: 'Information Technology',
      designation: 'Platform Administrator',
      password: adminPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-0001',
      first_name: 'Jasmine',
      last_name: 'Requestor',
      username: 'jasminerequestor',
      email: 'jasmine.requestor@serbisyou.ph',
      contact_number: '09171234567',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Batasan Hills',
      user_type: 'Requestor',
      password: defaultPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-1042',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      username: 'juandelacruz',
      email: 'juan.delacruz@serbisyou.ph',
      contact_number: '09123456789',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Brgy. Central',
      user_type: 'Provider',
      password: defaultPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-2015',
      first_name: 'Maria',
      last_name: 'Santos',
      username: 'mariasantos',
      email: 'maria.santos@serbisyou.ph',
      contact_number: '09223334444',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Brgy. Batasan Hills',
      user_type: 'Provider',
      password: defaultPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-3044',
      first_name: 'Pedro',
      last_name: 'Penduko',
      username: 'pedropenduko',
      email: 'pedro.penduko@serbisyou.ph',
      contact_number: '09334445555',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Brgy. Commonwealth',
      user_type: 'Provider',
      password: defaultPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-3045',
      first_name: 'Adrian',
      last_name: 'Friday',
      username: 'adrianfriday',
      email: '09262874496adrian@gmail.com',
      contact_number: '09262874496',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Batasan Hills',
      user_type: 'Requestor',
      password: defaultPasswordHash,
      is_active: true,
    },
    {
      user_id: 'MMC-3046',
      first_name: 'Keizy',
      last_name: 'Lara',
      username: 'keizylara',
      email: 'keizyaala@gmail.com',
      contact_number: '09445556666',
      region: 'NCR',
      province: 'Metro Manila',
      city: 'Quezon City',
      barangay: 'Batasan Hills',
      user_type: 'Provider',
      password: defaultPasswordHash,
      is_active: true,
    },
  ];

  for (const u of initialUsers) {
    const { data: existing } = await supabase
      .from('users')
      .select('user_id, email')
      .eq('user_id', u.user_id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('users').insert([u]);
      if (error) {
        console.error(`Failed to seed user ${u.user_id}:`, error.message);
      } else {
        console.log(`Seeded user: ${u.user_id} (${u.email})`);
      }
    } else if (
      u.user_id === 'MMC-0000' &&
      existing.email === 'admin@serbisyou.ph'
    ) {
      const { data: updated, error } = await supabase
        .from('users')
        .update({ email: u.email })
        .eq('user_id', u.user_id)
        .eq('email', existing.email)
        .select('user_id')
        .maybeSingle();

      if (error) {
        console.error(`Failed to update admin email for ${u.user_id}:`, error.message);
      } else if (updated) {
        console.log(`Updated admin email for ${u.user_id} to ${u.email}`);
      } else {
        console.error(`Failed to update admin email for ${u.user_id}: no matching row was updated.`);
      }
    }
  }

  // Sample services auto-seeding disabled for clean production deployment.
  // Providers publish real services directly via the marketplace.

  console.log('[SerbisYou DB Seeder] Seeding check complete.');
};

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;

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
      email: 'admin@serbisyou.ph',
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
      .select('user_id')
      .eq('user_id', u.user_id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('users').insert([u]);
      if (error) {
        console.error(`Failed to seed user ${u.user_id}:`, error.message);
      } else {
        console.log(`Seeded user: ${u.user_id} (${u.email})`);
      }
    }
  }

  // Seed sample services if none exist
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('service_id')
    .limit(1);

  if (!services || services.length === 0) {
    const initialServices = [
      {
        user_id: 'MMC-2015',
        service_category: 'Plumbing & Sanitation',
        subcategory: 'Pipe Installation & Leak Repair',
        service_description:
          'Emergency pipe repair, bathroom sink unclogging, PVC and GI pipe fitting, and high-pressure water leak troubleshooting. Tools and standard sealants provided.',
        amount_topay: 1200.0,
        service_status: 'active',
        rate_unit: 'per_service',
        picture_proof: [
          'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
        ],
      },
      {
        user_id: 'MMC-3044',
        service_category: 'Electrical Works',
        subcategory: 'Residential Circuit & Breaker Wiring',
        service_description:
          'Comprehensive home electrical inspection, short-circuit troubleshooting, breaker panel replacement, main line re-routing, and smart lighting installations.',
        amount_topay: 2500.0,
        service_status: 'active',
        rate_unit: 'per_service',
        picture_proof: [
          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
        ],
      },
      {
        user_id: 'MMC-1042',
        service_category: 'Carpentry & Handyman',
        subcategory: 'Custom Furniture & Home Repair',
        service_description:
          'Door alignment, cabinet hinge repairs, wooden table varnish, wall bracket installation, and general campus carpentry services.',
        amount_topay: 850.0,
        service_status: 'active',
        rate_unit: 'per_service',
        picture_proof: [
          'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?w=800&auto=format&fit=crop&q=80',
        ],
      },
      {
        user_id: 'MMC-3046',
        service_category: 'Academic & Creative Services',
        subcategory: 'Graphic Design & Layout',
        service_description:
          'Custom event posters, academic infographics, logo designs, and club presentation decks.',
        amount_topay: 500.0,
        service_status: 'active',
        rate_unit: 'per_hour',
        picture_proof: [
          'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
        ],
      },
    ];

    for (const s of initialServices) {
      let { error: insertServiceErr } = await supabase.from('services').insert([s]);
      if (insertServiceErr && insertServiceErr.message.includes('rate_unit')) {
        const { rate_unit: _, ...fallbackService } = s;
        const retryResult = await supabase.from('services').insert([fallbackService]);
        insertServiceErr = retryResult.error;
      }
      if (insertServiceErr) {
        console.error('Failed to seed service:', insertServiceErr.message);
      } else {
        console.log(`Seeded service: ${s.subcategory}`);
      }
    }
  }

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

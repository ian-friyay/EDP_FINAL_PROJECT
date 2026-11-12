// Comprehensive geographic data for Philippine regions, provinces, and major cities/municipalities
export const philippineRegions = [
  {
    name: 'National Capital Region (NCR)',
    code: 'NCR',
    provinces: [
      {
        name: 'Metro Manila',
        cities: [
          {
            name: 'Quezon City',
            barangays: ['Batasan Hills', 'Commonwealth', 'Holy Spirit', 'Bagong Silangan', 'Payatas', 'Cubao', 'Diliman', 'Novariches', 'Tandang Sora', 'Central']
          },
          {
            name: 'Manila',
            barangays: ['Tondo', 'Sampaloc', 'Santa Mesa', 'Malate', 'Ermita', 'Paco', 'Santa Cruz', 'Binondo', 'Intramuros', 'San Andres']
          },
          {
            name: 'Makati',
            barangays: ['Poblacion', 'Bel-Air', 'San Lorenzo', 'Guadalupe Nuevo', 'Guadalupe Viejo', 'Pio del Pilar', 'Bangkal', 'Cembo', 'Pembo']
          },
          {
            name: 'Taguig',
            barangays: ['Fort Bonifacio (BGC)', 'Ususan', 'Tuktukan', 'Western Bicutan', 'Signal Village', 'Bagumbayan', 'Lower Bicutan']
          },
          {
            name: 'Pasig',
            barangays: ['Kapitolyo', 'San Antonio', 'Ugong', 'Rosario', 'Manggahan', 'Pinagbuhatan', 'Caniogan', 'Maybunga']
          },
          {
            name: 'Caloocan',
            barangays: ['Barangay 1', 'Bagong Silang (Brgy 176)', 'Camarin', 'Tala', 'Grace Park East', 'Grace Park West']
          },
          {
            name: 'Mandaluyong',
            barangays: ['Highway Hills', 'Addition Hills', 'Wack-Wack Greenhills', 'Barangka Drive', 'Hulo', 'Pleasant Hills']
          },
          {
            name: 'Marikina',
            barangays: ['Concepcion Uno', 'Concepcion Dos', 'Marikina Heights', 'San Roque', 'Industrial Valley', 'Barangka']
          },
          {
            name: 'Parañaque',
            barangays: ['BF Homes', 'Don Bosco', 'Moonwalk', 'San Antonio', 'Sun Valley', 'Baclaran', 'Tambo']
          },
          {
            name: 'Las Piñas',
            barangays: ['Almanza Uno', 'Almanza Dos', 'Pamplona Uno', 'Talon Uno', 'Pulang Lupa Uno', 'Zapote']
          },
          {
            name: 'Pasay',
            barangays: ['Barangay 76', 'Barangay 183 (Villamor)', 'Malibay', 'San Isidro', 'San Roque']
          },
          {
            name: 'Valenzuela',
            barangays: ['Gen. T. de Leon', 'Marulas', 'Karuhatan', 'Punturin', 'Malanday', 'Mapulang Lupa']
          }
        ]
      }
    ]
  },
  {
    name: 'Region IV-A (CALABARZON)',
    code: '04A',
    provinces: [
      {
        name: 'Cavite',
        cities: [
          { name: 'Dasmarinas', barangays: ['Salitran', 'Paliparan', 'Burol', 'Zone 1', 'Langkaan'] },
          { name: 'Bacoor', barangays: ['Habay', 'Molino I', 'Molino III', 'Panapaan', 'Talaba'] },
          { name: 'Imus', barangays: ['Anabu I', 'Bucandala', 'Malagasang', 'Poblacion', 'Tanzang Luma'] },
          { name: 'General Trias', barangays: ['Manggahan', 'Navarro', 'San Francisco', 'Santiago'] },
          { name: 'Tagaytay', barangays: ['Asisan', 'Kaybagal', 'Maharlika', 'Mendez Crossing', 'Silang Junction'] }
        ]
      },
      {
        name: 'Laguna',
        cities: [
          { name: 'Santa Rosa', barangays: ['Balibago', 'Don Jose', 'Dita', 'Macabling', 'Tagapo'] },
          { name: 'Calamba', barangays: ['Canlubang', 'Halang', 'Parian', 'Real', 'Bucal'] },
          { name: 'Binan', barangays: ['Canlalay', 'San Antonio', 'San Vicente', 'Sto. Tomas', 'Zapote'] },
          { name: 'San Pedro', barangays: ['Cuyab', 'Landayan', 'San Antonio', 'San Vicente', 'Pacita'] }
        ]
      },
      {
        name: 'Rizal',
        cities: [
          { name: 'Antipolo', barangays: ['Dela Paz', 'Mambugan', 'Mayamot', 'San Jose', 'San Roque'] },
          { name: 'Cainta', barangays: ['San Andres', 'San Isidro', 'San Juan', 'Santa Rosa', 'Santo Domingo'] },
          { name: 'Taytay', barangays: ['Dolores', 'Muzon', 'San Isidro', 'San Juan', 'Santa Ana'] }
        ]
      },
      {
        name: 'Batangas',
        cities: [
          { name: 'Batangas City', barangays: ['Alangilan', 'Balagtas', 'Bolbok', 'Kumintang Ibaba', 'Poblacion'] },
          { name: 'Lipa City', barangays: ['Balintawak', 'Marawoy', 'Mataas na Lupa', 'Poblacion', 'Sabang'] }
        ]
      }
    ]
  },
  {
    name: 'Region III (Central Luzon)',
    code: '03',
    provinces: [
      {
        name: 'Bulacan',
        cities: [
          { name: 'San Jose del Monte', barangays: ['Ciudad Real', 'Graceville', 'Kaypian', 'Muzon', 'Tungkong Mangga'] },
          { name: 'Malolos', barangays: ['Bulihan', 'Cofradia', 'Dakila', 'Guinhawa', 'Mojon'] },
          { name: 'Meycauayan', barangays: ['Bancal', 'Calvario', 'Camalig', 'Malhacan', 'Perez'] }
        ]
      },
      {
        name: 'Pampanga',
        cities: [
          { name: 'Angeles City', barangays: ['Balibago', 'Cutcut', 'Malabanias', 'Pulung Maragul', 'Sto. Domingo'] },
          { name: 'San Fernando', barangays: ['Dolores', 'Sindalan', 'San Agustin', 'Telabastagan', 'Quebiawan'] }
        ]
      }
    ]
  },
  {
    name: 'Region VII (Central Visayas)',
    code: '07',
    provinces: [
      {
        name: 'Cebu',
        cities: [
          { name: 'Cebu City', barangays: ['Lahug', 'Mabolo', 'Guadalupe', 'Banilad', 'Talamban', 'Kamputhaw'] },
          { name: 'Mandaue City', barangays: ['Bakilid', 'Banilad', 'Centro', 'Subangdaku', 'Tipolo'] },
          { name: 'Lapu-Lapu City', barangays: ['Basak', 'Gun-ob', 'Mactan', 'Marigondon', 'Punta Engaño'] }
        ]
      }
    ]
  },
  {
    name: 'Region XI (Davao Region)',
    code: '11',
    provinces: [
      {
        name: 'Davao del Sur',
        cities: [
          { name: 'Davao City', barangays: ['Buhangin', 'Matina Crossing', 'Talomo', 'Poblacion', 'Bago Gallera'] }
        ]
      }
    ]
  }
];

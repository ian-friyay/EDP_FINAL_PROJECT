/**
 * Map Controller - Campus Rendezvous Locations
 * Ported from Laravel MapController.php
 */

const CAMPUS_LOCATIONS = [
  {
    id: 'loc-student-center',
    name: 'Main Campus - Student Center',
    short_name: 'Student Center',
    description: 'Central hub for creative, digital, and event service meetings',
    latitude: 13.4115,
    longitude: 121.1803,
    icon: 'building',
    tags: ['Creative', 'Meetings', 'Indoor'],
  },
  {
    id: 'loc-it-eng',
    name: 'IT & Engineering Building',
    short_name: 'IT & Engineering',
    description: 'Digital service support, laptop repairs, and tech rendezvous',
    latitude: 13.412,
    longitude: 121.181,
    icon: 'laptop',
    tags: ['Tech', 'Electronics', 'Diagnostics'],
  },
  {
    id: 'loc-gym',
    name: 'Campus Gymnasium & Auditorium',
    short_name: 'Gymnasium & Auditorium',
    description: 'Event hosting, sports, and photography services meetup point',
    latitude: 13.4108,
    longitude: 121.1795,
    icon: 'trophy',
    tags: ['Photography', 'Events', 'Outdoor/Indoor'],
  },
  {
    id: 'loc-library',
    name: 'University Library Commons',
    short_name: 'Library Commons',
    description: 'Graphic design consultations, quiet study, and portfolio reviews',
    latitude: 13.4112,
    longitude: 121.1815,
    icon: 'book',
    tags: ['Consultation', 'Design', 'Quiet'],
  },
];

const getCampusLocations = (req, res) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const embedUrl = googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=13.4115,121.1803`
    : 'https://maps.google.com/maps?q=13.4115,121.1803&z=16&output=embed';

  return res.status(200).json({
    status: 'success',
    message: 'Campus map locations retrieved.',
    data: {
      default_center: {
        latitude: 13.4115,
        longitude: 121.1803,
        zoom: 16,
      },
      locations: CAMPUS_LOCATIONS,
      embed_url: embedUrl,
    },
  });
};

module.exports = {
  CAMPUS_LOCATIONS,
  getCampusLocations,
};

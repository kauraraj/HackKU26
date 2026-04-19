import type { SearchResults, SearchLocation } from '@/types/search';

const MOCK_LOCATIONS: SearchLocation[] = [
  {
    id: 'loc-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    category: 'City',
    short_description: 'A dazzling mix of ultramodern and traditional, from neon-lit skyscrapers to historic temples.',
    thumbnail_url: null,
    trending_count: 3420,
    visit_count: 18900,
    attractions: [
      { id: 'a1', name: 'Senso-ji Temple', category: 'Temple', thumbnail_url: null, trending_count: 1200, visit_count: 7400, short_description: 'Tokyo\'s oldest Buddhist temple in Asakusa.' },
      { id: 'a2', name: 'Shibuya Crossing', category: 'Landmark', thumbnail_url: null, trending_count: 980, visit_count: 6200, short_description: 'The world\'s busiest pedestrian crossing.' },
      { id: 'a3', name: 'Shinjuku Gyoen', category: 'Park', thumbnail_url: null, trending_count: 640, visit_count: 4100, short_description: 'Expansive national garden with cherry blossoms.' },
      { id: 'a4', name: 'teamLab Planets', category: 'Museum', thumbnail_url: null, trending_count: 870, visit_count: 3200, short_description: 'Immersive digital art museum in Toyosu.' },
    ],
  },
  {
    id: 'loc-kyoto',
    name: 'Kyoto',
    country: 'Japan',
    category: 'City',
    short_description: 'Japan\'s former imperial capital, famous for classical Buddhist temples and traditional culture.',
    thumbnail_url: null,
    trending_count: 2810,
    visit_count: 14200,
    attractions: [
      { id: 'b1', name: 'Fushimi Inari Shrine', category: 'Shrine', thumbnail_url: null, trending_count: 1450, visit_count: 8900, short_description: 'Thousands of torii gates winding up a mountain.' },
      { id: 'b2', name: 'Arashiyama Bamboo Grove', category: 'Nature', thumbnail_url: null, trending_count: 1120, visit_count: 6300, short_description: 'Serene bamboo forest on the outskirts of Kyoto.' },
      { id: 'b3', name: 'Kinkaku-ji', category: 'Temple', thumbnail_url: null, trending_count: 890, visit_count: 5700, short_description: 'The iconic gold-leafed Golden Pavilion.' },
    ],
  },
  {
    id: 'loc-lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    category: 'City',
    short_description: 'Europe\'s westernmost capital — sun-soaked, hilly, and rich with seafaring history.',
    thumbnail_url: null,
    trending_count: 1940,
    visit_count: 9800,
    attractions: [
      { id: 'c1', name: 'Belém Tower', category: 'Monument', thumbnail_url: null, trending_count: 720, visit_count: 4100, short_description: 'A 16th-century fortified tower on the Tagus River.' },
      { id: 'c2', name: 'Alfama District', category: 'Neighbourhood', thumbnail_url: null, trending_count: 640, visit_count: 3800, short_description: 'Narrow medieval streets and Fado music venues.' },
      { id: 'c3', name: 'LX Factory', category: 'Market', thumbnail_url: null, trending_count: 510, visit_count: 2900, short_description: 'Creative market in a repurposed industrial complex.' },
    ],
  },
  {
    id: 'loc-bali',
    name: 'Bali',
    country: 'Indonesia',
    category: 'Island',
    short_description: 'Volcanic mountains, lush rice terraces, coral reefs, and legendary surf breaks.',
    thumbnail_url: null,
    trending_count: 3100,
    visit_count: 16400,
    attractions: [
      { id: 'd1', name: 'Ubud Monkey Forest', category: 'Nature Reserve', thumbnail_url: null, trending_count: 880, visit_count: 5200, short_description: 'Sacred forest with over 700 Balinese macaques.' },
      { id: 'd2', name: 'Tegallalang Rice Terraces', category: 'Nature', thumbnail_url: null, trending_count: 760, visit_count: 4400, short_description: 'UNESCO-recognised traditional irrigation system.' },
      { id: 'd3', name: 'Tanah Lot', category: 'Temple', thumbnail_url: null, trending_count: 670, visit_count: 3900, short_description: 'Sea temple perched on a rocky outcrop.' },
    ],
  },
];

const MOCK_RESULTS: SearchResults = {
  users: [
    { id: 'u1', username: 'mira.codes', display_name: 'Mira Chen', avatar_url: null, home_city: 'San Francisco', trips_count: 12, is_friend: true, is_following: true },
    { id: 'u2', username: 'jae.explores', display_name: 'Jae Park', avatar_url: null, home_city: 'Seoul', trips_count: 7, is_friend: false, is_following: true },
    { id: 'u3', username: 'sanya.trails', display_name: 'Sanya Okafor', avatar_url: null, home_city: 'London', trips_count: 19, is_friend: false, is_following: false },
    { id: 'u4', username: 'leo.roams', display_name: 'Leo Martinez', avatar_url: null, home_city: 'Mexico City', trips_count: 5, is_friend: true, is_following: true },
  ],
  locations: MOCK_LOCATIONS,
  itineraries: [
    { id: 'i1', title: 'Kyoto Temples in 3 Days', destination: 'Kyoto, Japan', cover_image_url: null, days_count: 3, places_count: 9, saves: 214, rating: 4.8, creator_name: 'Mira Chen', creator_username: 'mira.codes', posted_at: '2026-02-14' },
    { id: 'i2', title: 'Lisbon Coffee Crawl', destination: 'Lisbon, Portugal', cover_image_url: null, days_count: 2, places_count: 7, saves: 88, rating: 4.6, creator_name: 'Leo Martinez', creator_username: 'leo.roams', posted_at: '2025-11-02' },
    { id: 'i3', title: '5 Days in Bali on a Budget', destination: 'Bali, Indonesia', cover_image_url: null, days_count: 5, places_count: 14, saves: 342, rating: 4.9, creator_name: 'Sanya Okafor', creator_username: 'sanya.trails', posted_at: '2026-01-18' },
    { id: 'i4', title: 'Tokyo Highlights Weekend', destination: 'Tokyo, Japan', cover_image_url: null, days_count: 2, places_count: 8, saves: 176, rating: 4.7, creator_name: 'Jae Park', creator_username: 'jae.explores', posted_at: '2026-03-05' },
  ],
};

export async function searchAll(query: string): Promise<SearchResults> {
  await new Promise((r) => setTimeout(r, 400));
  const q = query.toLowerCase().trim();
  if (!q) return { users: [], locations: [], itineraries: [] };
  return {
    users: MOCK_RESULTS.users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.home_city ?? '').toLowerCase().includes(q)
    ),
    locations: MOCK_RESULTS.locations.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    ),
    itineraries: MOCK_RESULTS.itineraries.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.destination.toLowerCase().includes(q) ||
        i.creator_name.toLowerCase().includes(q)
    ),
  };
}

export async function getLocationById(id: string): Promise<SearchLocation | null> {
  return MOCK_LOCATIONS.find((l) => l.id === id) ?? null;
}

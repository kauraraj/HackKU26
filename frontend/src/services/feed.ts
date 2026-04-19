import type { FeedItem } from '@/types/feed';

const MOCK_FEED: FeedItem[] = [
  {
    id: 'fi1',
    creator: { id: 'f1', username: 'mira.codes', display_name: 'Mira', avatar_url: null, is_friend: true },
    title: 'Hidden Cafés of Tokyo',
    destination: 'Tokyo, Japan',
    cover_image_url: null,
    days_count: 3,
    places_count: 8,
    saves: 312,
    rating: 4.9,
    posted_at: '2026-04-10',
    section: 'following',
    days: [
      {
        day_number: 1,
        day_date: '2026-04-10',
        summary: 'Shimokitazawa indie coffee scene',
        items: [
          { id: 'fi1d1m', block: 'morning', title: 'Bear Pond Espresso', notes: 'Arrive early — tiny queue' },
          { id: 'fi1d1a', block: 'afternoon', title: 'Waltz Records & Coffee', notes: null },
          { id: 'fi1d1e', block: 'evening', title: 'Little Nap Coffee Stand', notes: 'Great matcha latte' },
        ],
      },
      {
        day_number: 2,
        day_date: '2026-04-11',
        summary: 'Yanaka and Nezu old-town vibes',
        items: [
          { id: 'fi1d2m', block: 'morning', title: 'Kayaba Coffee', notes: 'Classic retro interior' },
          { id: 'fi1d2a', block: 'afternoon', title: 'Yanaka Ginza street walk', notes: null },
          { id: 'fi1d2e', block: 'evening', title: 'Hagiso Café', notes: null },
        ],
      },
    ],
    places: [
      { id: 'fp1', name: 'Bear Pond Espresso', category: 'Café', city: 'Tokyo', country: 'Japan', thumbnail_url: null, rating: 4.9 },
      { id: 'fp2', name: 'Kayaba Coffee', category: 'Café', city: 'Tokyo', country: 'Japan', thumbnail_url: null, rating: 4.7 },
      { id: 'fp3', name: 'Hagiso Café', category: 'Café', city: 'Tokyo', country: 'Japan', thumbnail_url: null, rating: 4.6 },
    ],
  },
  {
    id: 'fi2',
    creator: { id: 'f2', username: 'jae.explores', display_name: 'Jae', avatar_url: null, is_friend: true },
    title: 'Amalfi Coast in 4 Days',
    destination: 'Amalfi, Italy',
    cover_image_url: null,
    days_count: 4,
    places_count: 11,
    saves: 527,
    rating: 4.8,
    posted_at: '2026-03-28',
    section: 'following',
    days: [
      {
        day_number: 1,
        day_date: '2026-03-25',
        summary: 'Positano arrival',
        items: [
          { id: 'fi2d1m', block: 'morning', title: 'Spiaggia Grande Beach', notes: 'Get there before 9am' },
          { id: 'fi2d1a', block: 'afternoon', title: 'Ristorante La Sponda', notes: null },
          { id: 'fi2d1e', block: 'evening', title: 'Sunset walk on Via Positanesi d\'America', notes: null },
        ],
      },
    ],
    places: [
      { id: 'fp4', name: 'Spiaggia Grande', category: 'Beach', city: 'Positano', country: 'Italy', thumbnail_url: null, rating: 4.8 },
      { id: 'fp5', name: 'Ravello Gardens', category: 'Garden', city: 'Ravello', country: 'Italy', thumbnail_url: null, rating: 4.7 },
    ],
  },
  {
    id: 'fi3',
    creator: { id: 'u3', username: 'wanderlust.ana', display_name: 'Ana Reyes', avatar_url: null, is_friend: false },
    title: 'Kyoto Temples in 3 Days',
    destination: 'Kyoto, Japan',
    cover_image_url: null,
    days_count: 3,
    places_count: 9,
    saves: 1420,
    rating: 4.9,
    posted_at: '2026-02-14',
    section: 'trending',
    days: [
      {
        day_number: 1,
        day_date: '2026-02-14',
        summary: 'Eastern temples circuit',
        items: [
          { id: 'fi3d1m', block: 'morning', title: 'Fushimi Inari Shrine', notes: 'Hike early to beat crowds' },
          { id: 'fi3d1a', block: 'afternoon', title: 'Kinkaku-ji (Golden Pavilion)', notes: null },
          { id: 'fi3d1e', block: 'evening', title: 'Gion district walk', notes: 'Spot geiko near Hanamikoji' },
        ],
      },
      {
        day_number: 2,
        day_date: '2026-02-15',
        summary: 'Arashiyama day',
        items: [
          { id: 'fi3d2m', block: 'morning', title: 'Arashiyama Bamboo Grove', notes: null },
          { id: 'fi3d2a', block: 'afternoon', title: 'Tenryu-ji Garden', notes: null },
          { id: 'fi3d2e', block: 'evening', title: 'Togetsukyo Bridge sunset', notes: null },
        ],
      },
    ],
    places: [
      { id: 'fp6', name: 'Fushimi Inari Shrine', category: 'Temple', city: 'Kyoto', country: 'Japan', thumbnail_url: null, rating: 4.9 },
      { id: 'fp7', name: 'Kinkaku-ji', category: 'Temple', city: 'Kyoto', country: 'Japan', thumbnail_url: null, rating: 4.8 },
      { id: 'fp8', name: 'Arashiyama Bamboo Grove', category: 'Nature', city: 'Kyoto', country: 'Japan', thumbnail_url: null, rating: 4.7 },
    ],
  },
  {
    id: 'fi4',
    creator: { id: 'u4', username: 'nomad.kenji', display_name: 'Kenji Mori', avatar_url: null, is_friend: false },
    title: 'Lisbon in 2 Days',
    destination: 'Lisbon, Portugal',
    cover_image_url: null,
    days_count: 2,
    places_count: 7,
    saves: 893,
    rating: 4.7,
    posted_at: '2026-01-20',
    section: 'trending',
    days: [
      {
        day_number: 1,
        day_date: '2026-01-20',
        summary: 'Alfama and Belém',
        items: [
          { id: 'fi4d1m', block: 'morning', title: 'Pastéis de Belém', notes: 'The original pastel de nata' },
          { id: 'fi4d1a', block: 'afternoon', title: 'Jerónimos Monastery', notes: null },
          { id: 'fi4d1e', block: 'evening', title: 'Miradouro da Graça', notes: 'Best sunset view' },
        ],
      },
    ],
    places: [
      { id: 'fp9', name: 'Pastéis de Belém', category: 'Bakery', city: 'Lisbon', country: 'Portugal', thumbnail_url: null, rating: 4.9 },
      { id: 'fp10', name: 'Jerónimos Monastery', category: 'Monument', city: 'Lisbon', country: 'Portugal', thumbnail_url: null, rating: 4.8 },
    ],
  },
  {
    id: 'fi5',
    creator: { id: 'u5', username: 'city.hopper', display_name: 'Priya S.', avatar_url: null, is_friend: false },
    title: 'NYC Food Weekend',
    destination: 'New York, USA',
    cover_image_url: null,
    days_count: 2,
    places_count: 6,
    saves: 641,
    rating: 4.6,
    posted_at: '2026-03-05',
    section: 'trending',
    days: [
      {
        day_number: 1,
        day_date: '2026-03-05',
        summary: 'Lower East Side eats',
        items: [
          { id: 'fi5d1m', block: 'morning', title: 'Russ & Daughters', notes: 'Get the classic bagel' },
          { id: 'fi5d1a', block: 'afternoon', title: 'Xi\'an Famous Foods', notes: null },
          { id: 'fi5d1e', block: 'evening', title: 'Carbone', notes: 'Book 2 weeks out' },
        ],
      },
    ],
    places: [
      { id: 'fp11', name: 'Russ & Daughters', category: 'Deli', city: 'New York', country: 'USA', thumbnail_url: null, rating: 4.8 },
      { id: 'fp12', name: 'Carbone', category: 'Restaurant', city: 'New York', country: 'USA', thumbnail_url: null, rating: 4.7 },
    ],
  },
  {
    id: 'fi6',
    creator: { id: 'u6', username: 'roam.free', display_name: 'Luca Bianchi', avatar_url: null, is_friend: false },
    title: 'Barcelona Architecture Walk',
    destination: 'Barcelona, Spain',
    cover_image_url: null,
    days_count: 2,
    places_count: 5,
    saves: 388,
    rating: 4.8,
    posted_at: '2026-04-01',
    section: 'recommended',
    days: [
      {
        day_number: 1,
        day_date: '2026-04-01',
        summary: 'Gaudí day',
        items: [
          { id: 'fi6d1m', block: 'morning', title: 'Sagrada Família', notes: 'Book skip-the-line tickets' },
          { id: 'fi6d1a', block: 'afternoon', title: 'Park Güell', notes: null },
          { id: 'fi6d1e', block: 'evening', title: 'Casa Batlló night tour', notes: 'Magic Nights are worth it' },
        ],
      },
    ],
    places: [
      { id: 'fp13', name: 'Sagrada Família', category: 'Monument', city: 'Barcelona', country: 'Spain', thumbnail_url: null, rating: 4.9 },
      { id: 'fp14', name: 'Park Güell', category: 'Park', city: 'Barcelona', country: 'Spain', thumbnail_url: null, rating: 4.7 },
    ],
  },
  {
    id: 'fi7',
    creator: { id: 'u7', username: 'passport.stamps', display_name: 'Yuna Kim', avatar_url: null, is_friend: false },
    title: 'Marrakech Medina & Souks',
    destination: 'Marrakech, Morocco',
    cover_image_url: null,
    days_count: 3,
    places_count: 7,
    saves: 512,
    rating: 4.7,
    posted_at: '2026-03-18',
    section: 'recommended',
    days: [
      {
        day_number: 1,
        day_date: '2026-03-18',
        summary: 'Medina exploration',
        items: [
          { id: 'fi7d1m', block: 'morning', title: 'Djemaa el-Fna square', notes: 'Best at sunrise' },
          { id: 'fi7d1a', block: 'afternoon', title: 'Souk Semmarine', notes: 'Bargain hard' },
          { id: 'fi7d1e', block: 'evening', title: 'Café de France rooftop', notes: null },
        ],
      },
    ],
    places: [
      { id: 'fp15', name: 'Djemaa el-Fna', category: 'Square', city: 'Marrakech', country: 'Morocco', thumbnail_url: null, rating: 4.8 },
      { id: 'fp16', name: 'Bahia Palace', category: 'Palace', city: 'Marrakech', country: 'Morocco', thumbnail_url: null, rating: 4.7 },
    ],
  },
  {
    id: 'fi8',
    creator: { id: 'u8', username: 'the.map.maker', display_name: 'Dev Patel', avatar_url: null, is_friend: false },
    title: 'Sydney Coastal Walks',
    destination: 'Sydney, Australia',
    cover_image_url: null,
    days_count: 2,
    places_count: 6,
    saves: 277,
    rating: 4.6,
    posted_at: '2026-04-05',
    section: 'recommended',
    days: [
      {
        day_number: 1,
        day_date: '2026-04-05',
        summary: 'Bondi to Coogee coastal walk',
        items: [
          { id: 'fi8d1m', block: 'morning', title: 'Bondi Beach', notes: 'Swim early before it fills up' },
          { id: 'fi8d1a', block: 'afternoon', title: 'Bondi to Coogee cliff walk', notes: '6km, about 2 hours' },
          { id: 'fi8d1e', block: 'evening', title: 'Icebergs Dining Room', notes: null },
        ],
      },
    ],
    places: [
      { id: 'fp17', name: 'Bondi Beach', category: 'Beach', city: 'Sydney', country: 'Australia', thumbnail_url: null, rating: 4.8 },
      { id: 'fp18', name: 'Icebergs Dining Room', category: 'Restaurant', city: 'Sydney', country: 'Australia', thumbnail_url: null, rating: 4.6 },
    ],
  },
];

export async function getFeedItems(): Promise<FeedItem[]> {
  return MOCK_FEED;
}

export async function saveFeedItinerary(id: string): Promise<void> {
  console.log('[feed] save itinerary', id);
}

export async function saveFeedPlace(placeId: string): Promise<void> {
  console.log('[feed] save place', placeId);
}

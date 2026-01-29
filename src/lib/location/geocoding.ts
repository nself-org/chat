/**
 * Geocoding Utilities
 *
 * Placeholder for address lookup and reverse geocoding.
 * In production, this would integrate with a geocoding API like:
 * - Google Maps Geocoding API
 * - Mapbox Geocoding API
 * - OpenStreetMap Nominatim
 */

import type { Coordinates, GeocodedAddress, Place, PlaceCategory } from './location-types'

// ============================================================================
// Types
// ============================================================================

/**
 * Geocoding result.
 */
export interface GeocodingResult {
  /** Success status */
  success: boolean
  /** Address data (if successful) */
  address?: GeocodedAddress
  /** Error message (if failed) */
  error?: string
}

/**
 * Reverse geocoding options.
 */
export interface ReverseGeocodingOptions {
  /** Language for results (e.g., 'en', 'es') */
  language?: string
  /** Include all address components */
  includeComponents?: boolean
}

/**
 * Places search options.
 */
export interface PlacesSearchOptions {
  /** Search radius in meters */
  radius?: number
  /** Filter by category */
  category?: PlaceCategory
  /** Maximum number of results */
  limit?: number
  /** Language for results */
  language?: string
}

// ============================================================================
// Mock Data (for development)
// ============================================================================

const MOCK_ADDRESSES: Record<string, GeocodedAddress> = {
  default: {
    formattedAddress: '123 Main Street, San Francisco, CA 94102, USA',
    streetNumber: '123',
    street: 'Main Street',
    neighborhood: 'Downtown',
    city: 'San Francisco',
    state: 'California',
    postalCode: '94102',
    country: 'United States',
    countryCode: 'US',
  },
}

const MOCK_PLACES: Place[] = [
  {
    id: 'place_1',
    name: 'Central Coffee House',
    address: '100 Market St',
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    category: 'cafe',
    distance: 150,
    rating: 4.5,
    isOpen: true,
  },
  {
    id: 'place_2',
    name: 'City Park',
    address: '200 Park Ave',
    coordinates: { latitude: 37.7751, longitude: -122.4180 },
    category: 'park',
    distance: 300,
    rating: 4.8,
    isOpen: true,
  },
  {
    id: 'place_3',
    name: 'Metro Station',
    address: '150 Transit Way',
    coordinates: { latitude: 37.7745, longitude: -122.4200 },
    category: 'transit',
    distance: 200,
  },
  {
    id: 'place_4',
    name: 'Local Grocery',
    address: '50 Food Lane',
    coordinates: { latitude: 37.7755, longitude: -122.4170 },
    category: 'store',
    distance: 400,
    rating: 4.2,
    isOpen: true,
  },
  {
    id: 'place_5',
    name: 'Downtown Medical Center',
    address: '300 Health Blvd',
    coordinates: { latitude: 37.7740, longitude: -122.4210 },
    category: 'hospital',
    distance: 500,
    isOpen: true,
  },
]

// ============================================================================
// Reverse Geocoding
// ============================================================================

/**
 * Reverse geocode coordinates to an address.
 *
 * NOTE: This is a placeholder implementation that returns mock data.
 * In production, integrate with a real geocoding API.
 */
export async function reverseGeocode(
  coordinates: Coordinates,
  _options?: ReverseGeocodingOptions
): Promise<GeocodingResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // In production, make actual API call here
  // Example with fetch:
  // const response = await fetch(
  //   `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json?access_token=${API_KEY}`
  // )

  // Return mock data for development
  return {
    success: true,
    address: {
      ...MOCK_ADDRESSES.default,
      // Generate a somewhat realistic address based on coordinates
      formattedAddress: `${Math.abs(Math.round(coordinates.latitude * 100))} ${
        coordinates.latitude >= 0 ? 'North' : 'South'
      } ${Math.abs(Math.round(coordinates.longitude * 100))} ${
        coordinates.longitude >= 0 ? 'East' : 'West'
      } Street`,
    },
  }
}

/**
 * Geocode an address to coordinates.
 *
 * NOTE: This is a placeholder implementation.
 */
export async function geocodeAddress(
  address: string,
  _options?: { language?: string }
): Promise<{ success: boolean; coordinates?: Coordinates; error?: string }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  if (!address || address.trim().length < 3) {
    return {
      success: false,
      error: 'Address is too short',
    }
  }

  // Return mock coordinates for development
  // In production, this would call a geocoding API
  return {
    success: true,
    coordinates: {
      latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
    },
  }
}

// ============================================================================
// Places Search
// ============================================================================

/**
 * Search for nearby places.
 *
 * NOTE: This is a placeholder implementation that returns mock data.
 * In production, integrate with a places API like Google Places or Foursquare.
 */
export async function searchNearbyPlaces(
  coordinates: Coordinates,
  options: PlacesSearchOptions = {}
): Promise<Place[]> {
  const { radius = 1000, category, limit = 10, language: _language } = options

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Filter mock places by category if specified
  let places = [...MOCK_PLACES]
  if (category) {
    places = places.filter((p) => p.category === category)
  }

  // Update distances based on actual coordinates
  places = places.map((place) => ({
    ...place,
    distance: Math.round(
      Math.sqrt(
        Math.pow((place.coordinates.latitude - coordinates.latitude) * 111000, 2) +
        Math.pow((place.coordinates.longitude - coordinates.longitude) * 111000 * Math.cos(coordinates.latitude * Math.PI / 180), 2)
      )
    ),
  }))

  // Filter by radius and sort by distance
  places = places
    .filter((p) => (p.distance || 0) <= radius)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, limit)

  return places
}

/**
 * Search places by text query.
 */
export async function searchPlaces(
  query: string,
  coordinates?: Coordinates,
  options: PlacesSearchOptions = {}
): Promise<Place[]> {
  const { limit = 10 } = options

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Simple text matching for mock data
  const lowerQuery = query.toLowerCase()
  let places = MOCK_PLACES.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.address.toLowerCase().includes(lowerQuery)
  )

  // Update distances if coordinates provided
  if (coordinates) {
    places = places.map((place) => ({
      ...place,
      distance: Math.round(
        Math.sqrt(
          Math.pow((place.coordinates.latitude - coordinates.latitude) * 111000, 2) +
          Math.pow((place.coordinates.longitude - coordinates.longitude) * 111000 * Math.cos(coordinates.latitude * Math.PI / 180), 2)
        )
      ),
    }))
  }

  return places.slice(0, limit)
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Format address for display.
 */
export function formatAddress(address: GeocodedAddress, style: 'full' | 'short' | 'city' = 'full'): string {
  switch (style) {
    case 'short':
      return [address.street, address.city]
        .filter(Boolean)
        .join(', ')
    case 'city':
      return [address.city, address.state, address.country]
        .filter(Boolean)
        .join(', ')
    case 'full':
    default:
      return address.formattedAddress
  }
}

/**
 * Get place category icon name.
 */
export function getPlaceCategoryIcon(category: PlaceCategory): string {
  const icons: Record<PlaceCategory, string> = {
    restaurant: 'utensils',
    cafe: 'coffee',
    bar: 'wine',
    store: 'shopping-bag',
    hotel: 'building',
    hospital: 'hospital',
    pharmacy: 'pill',
    gas_station: 'fuel',
    parking: 'parking',
    transit: 'train',
    airport: 'plane',
    school: 'graduation-cap',
    gym: 'dumbbell',
    park: 'tree',
    museum: 'landmark',
    church: 'church',
    bank: 'landmark',
    atm: 'credit-card',
    other: 'map-pin',
  }

  return icons[category] || 'map-pin'
}

/**
 * Get place category display name.
 */
export function getPlaceCategoryName(category: PlaceCategory): string {
  const names: Record<PlaceCategory, string> = {
    restaurant: 'Restaurant',
    cafe: 'Cafe',
    bar: 'Bar',
    store: 'Store',
    hotel: 'Hotel',
    hospital: 'Hospital',
    pharmacy: 'Pharmacy',
    gas_station: 'Gas Station',
    parking: 'Parking',
    transit: 'Transit',
    airport: 'Airport',
    school: 'School',
    gym: 'Gym',
    park: 'Park',
    museum: 'Museum',
    church: 'Church',
    bank: 'Bank',
    atm: 'ATM',
    other: 'Place',
  }

  return names[category] || 'Place'
}

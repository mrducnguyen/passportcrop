export interface PassportGuides {
  /** Top of head / crown as fraction of photo height from top */
  crownFraction: number
  /** Chin position as fraction of photo height from top */
  chinFraction: number
  /** Eye level as fraction of photo height from top */
  eyeLevelFraction: number
  /** Face oval width as fraction of photo width */
  ovalWidthFraction: number
}

export interface PassportSpec {
  id: string
  label: string
  country: string
  flag: string
  /** Photo width in mm */
  photoWidthMm: number
  /** Photo height in mm */
  photoHeightMm: number
  /** Min face height (chin to crown) in mm */
  minFaceHeightMm: number
  /** Max face height (chin to crown) in mm */
  maxFaceHeightMm: number
  background: string
  notes: string[]
  guides: PassportGuides
  /** Output pixel dimensions for download */
  outputWidth: number
  outputHeight: number
}

/**
 * Australia passport photo requirements
 * Source: Australian Passport Office guidelines
 * Photo: 35mm × 45mm
 * Face (chin to crown): 32–36mm (71–80% of height)
 */
export const AU_PASSPORT: PassportSpec = {
  id: 'au',
  label: 'Australia',
  country: 'Australia',
  flag: '🇦🇺',
  photoWidthMm: 35,
  photoHeightMm: 45,
  minFaceHeightMm: 32,
  maxFaceHeightMm: 36,
  background: 'Plain white or light grey',
  notes: [
    'Plain white or light grey background',
    'Neutral expression, mouth closed',
    'Eyes open and clearly visible',
    'No glasses',
    'Taken within last 6 months',
  ],
  guides: {
    // Crown at ~8% from top (3.6mm gap at top)
    crownFraction: 0.08,
    // Chin at ~83% from top → face height = 75% = 33.75mm ✓ (within 32–36mm)
    chinFraction: 0.83,
    // Eyes roughly 35–40% from top
    eyeLevelFraction: 0.37,
    // Face oval width ~68% of photo width
    ovalWidthFraction: 0.68,
  },
  // 35mm × 45mm at 300 DPI = 413 × 531 px
  outputWidth: 413,
  outputHeight: 531,
}

/**
 * US passport photo requirements
 * Source: US Department of State guidelines
 * Photo: 2×2 inches (51×51mm) — square
 * Face (chin to crown): 1–1⅜ inches (50–69% of height)
 * Eyes: 1⅛–1⅜ inches from bottom (56–69% from bottom = 31–44% from top)
 */
export const US_PASSPORT: PassportSpec = {
  id: 'us',
  label: 'United States',
  country: 'United States',
  flag: '🇺🇸',
  photoWidthMm: 51,
  photoHeightMm: 51,
  minFaceHeightMm: 25.4, // 1 inch
  maxFaceHeightMm: 35,   // 1⅜ inches
  background: 'Plain white or off-white',
  notes: [
    'Plain white or off-white background',
    'Neutral expression or natural smile',
    'Eyes open and looking directly at camera',
    'No glasses (since Nov 2016)',
    'Taken within last 6 months',
  ],
  guides: {
    // Crown at ~10% from top (0.2 inches gap)
    crownFraction: 0.10,
    // Chin at ~70% from top → face height = 60% = 1.22 inches ✓ (within 1–1.375 inches)
    chinFraction: 0.70,
    // Eyes at 56–69% from bottom = 31–44% from top; use 37%
    eyeLevelFraction: 0.37,
    // Face oval width ~65% of photo width
    ovalWidthFraction: 0.65,
  },
  // 2×2 inches at 300 DPI = 600×600 px
  outputWidth: 600,
  outputHeight: 600,
}

export const PASSPORT_SPECS: PassportSpec[] = [AU_PASSPORT, US_PASSPORT]

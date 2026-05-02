export interface StateLaws {
  state: string
  abbr: string
  tint: {
    frontSide: string
    rearSide: string
    rear: string
    note?: string
  }
  exhaust: {
    limit: string
    note?: string
  }
  emissions: {
    required: boolean
    areas?: string
    note?: string
  }
  underglow: {
    status: 'legal' | 'restricted' | 'illegal'
    note: string
  }
  straightPipe: {
    status: 'legal' | 'restricted' | 'illegal'
    note: string
  }
  coloredHeadlights: {
    status: 'legal' | 'restricted' | 'illegal'
    note: string
  }
  decorativeLights: {
    status: 'legal' | 'restricted' | 'illegal'
    note: string
  }
  strictness: 'lenient' | 'moderate' | 'strict'
}

export const MOD_LAWS: Record<string, StateLaws> = {
  AL: {
    state: 'Alabama',
    abbr: 'AL',
    tint: {
      frontSide: '32% VLT',
      rearSide: '32% VLT',
      rear: '32% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unnecessarily loud." Officer discretion applies.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not red, blue, or flashing. Must not be visible from front.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'No specific ban but must not be excessively loud per officer discretion.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber only for headlights. Colored films illegal.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  AK: {
    state: 'Alaska',
    abbr: 'AK',
    tint: {
      frontSide: '70% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Very permissive tint laws.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be unreasonably loud. Broad officer discretion.',
    },
    emissions: {
      required: false,
      note: 'No emissions testing program statewide.',
    },
    underglow: {
      status: 'legal',
      note: 'Generally legal. Avoid red or blue lights visible from front.',
    },
    straightPipe: {
      status: 'legal',
      note: 'No specific straight pipe restrictions. Very lenient.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'Headlights must emit white light. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
  AZ: {
    state: 'Arizona',
    abbr: 'AZ',
    tint: {
      frontSide: '33% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear tinted darker than 33%.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'No louder than stock. Officer discretion.',
    },
    emissions: {
      required: true,
      areas: 'Maricopa and Pima counties',
      note: 'Required in metro Phoenix and Tucson areas only.',
    },
    underglow: {
      status: 'legal',
      note: 'Legal if not red or blue and not flashing. Widely accepted.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'No specific dB limit but must not be "unnecessarily loud."',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White/amber headlights required. Tinted covers are restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  AR: {
    state: 'Arkansas',
    abbr: 'AR',
    tint: {
      frontSide: '25% VLT',
      rearSide: '25% VLT',
      rear: '10% VLT',
      note: 'Reflective tint not permitted on front windows.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be modified to increase noise beyond factory levels.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue in color.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Straight pipe without muffler is technically illegal.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'Headlights must produce white light. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  CA: {
    state: 'California',
    abbr: 'CA',
    tint: {
      frontSide: '70% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Front side windows must allow 70%+ light transmission. Dual mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: '95 dB (stationary test)',
      note: 'Strictly enforced. BAR-certified shops required for legal exhaust modifications.',
    },
    emissions: {
      required: true,
      areas: 'Statewide (smog check)',
      note: 'Biennial smog check required for most vehicles. Exempt: 1975 and older, diesel 1997 and older, electric vehicles.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not visible while driving. No red visible from front, no blue at all.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Must pass 95 dB limit. Non-compliant systems result in fix-it tickets. CARB exemptions required.',
    },
    coloredHeadlights: {
      status: 'illegal',
      note: 'Only white headlights permitted. Colored covers or HID without approval are illegal.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  CO: {
    state: 'Colorado',
    abbr: 'CO',
    tint: {
      frontSide: '27% VLT',
      rearSide: '27% VLT',
      rear: '27% VLT',
      note: 'Tint must not be red or amber. Metallic or mirrored tint not permitted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not exceed noise levels of the original equipment.',
    },
    emissions: {
      required: true,
      areas: 'Denver metro and Front Range counties',
      note: 'Required in Denver, Boulder, and surrounding Front Range counties.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and avoids red or blue. Common in the Denver scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'No specific dB statute but must not be "unreasonably loud." Generally enforced by officer discretion.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Blue-tinted or HID bulbs may require approval.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  CT: {
    state: 'Connecticut',
    abbr: 'CT',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'No metallic or mirrored tint on any window.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Exhaust modifications that increase noise are illegal.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Biennial emissions testing required for most gasoline-powered vehicles.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Must not distract other drivers.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by law. Straight pipe without muffler is illegal.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'Headlights must emit white light. Tinted covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  DE: {
    state: 'Delaware',
    abbr: 'DE',
    tint: {
      frontSide: '70% VLT',
      rearSide: '70% VLT',
      rear: '70% VLT',
      note: 'Very restrictive tint laws. Essentially no meaningful tint allowed.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not exceed OEM noise levels. Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Annual emissions testing required for vehicles 2 years and older.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Rarely enforced.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Straight pipe typically fails inspection.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White/amber only. Colored headlight covers are not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  FL: {
    state: 'Florida',
    abbr: 'FL',
    tint: {
      frontSide: '28% VLT',
      rearSide: '15% VLT',
      rear: '15% VLT',
      note: 'Dual side mirrors required if rear window is tinted below 28%.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Officer discretion. Generally enforced in residential areas.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'legal',
      note: 'Legal if not red or blue and not flashing. Common in the Florida car scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by law. However enforcement is inconsistent.',
    },
    coloredHeadlights: {
      status: 'illegal',
      note: 'Only white or amber headlights permitted. Colored covers are illegal in FL.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  GA: {
    state: 'Georgia',
    abbr: 'GA',
    tint: {
      frontSide: '32% VLT',
      rearSide: '32% VLT',
      rear: '32% VLT',
      note: 'No red or amber tint. Side mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively or unnecessarily loud."',
    },
    emissions: {
      required: true,
      areas: 'Metro Atlanta counties',
      note: 'Required in 13 metro Atlanta counties. Annual testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. No projection onto road.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'No specific dB limit but muffler required. Officer discretion.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Tinted film over headlights is restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  HI: {
    state: 'Hawaii',
    abbr: 'HI',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'No metallic or mirrored appearance. Dual mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unreasonably loud." Annual safety inspection enforces compliance.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Annual safety and emissions check required. Strict enforcement.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red, blue, or amber. Rarely seen due to strict atmosphere.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual inspection will flag non-compliant exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights only. Strict annual inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  ID: {
    state: 'Idaho',
    abbr: 'ID',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Side mirrors required if rear window tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'No unreasonably loud exhaust. General noise ordinances apply.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing. Ada County (Boise) has its own program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and non-red/blue. Broadly tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by statute. Straight pipe may fail safety inspection.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  IL: {
    state: 'Illinois',
    abbr: 'IL',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Side mirrors required if rear is tinted darker than 35%.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Chicago has stricter local ordinances.',
    },
    emissions: {
      required: true,
      areas: 'Chicago metro counties',
      note: 'Required in Cook, DuPage, Kane, Lake, McHenry, and Will counties.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. Chicago may enforce more strictly.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Chicago enforces noise ordinances aggressively.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Colored tint or covers are restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  IN: {
    state: 'Indiana',
    abbr: 'IN',
    tint: {
      frontSide: '30% VLT',
      rearSide: '30% VLT',
      rear: '30% VLT',
      note: 'Reflective or mirrored tint not permitted on any window.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unnecessarily loud or harsh."',
    },
    emissions: {
      required: true,
      areas: 'Lake and Porter counties',
      note: 'Required in northwest Indiana near Chicago metro area.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing, non-red, non-blue. Commonly seen at car meets.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but noise complaints can lead to citations.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Tinted covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  IA: {
    state: 'Iowa',
    abbr: 'IA',
    tint: {
      frontSide: '70% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Very restrictive front window tint. Dual mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not produce excessive or unusual noise.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by state law. Straight pipe technically illegal.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Tinted covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  KS: {
    state: 'Kansas',
    abbr: 'KS',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unreasonably loud." General nuisance laws apply.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. Common in the Kansas car scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but noise ordinances apply.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Colored tint restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  KY: {
    state: 'Kentucky',
    abbr: 'KY',
    tint: {
      frontSide: '35% VLT',
      rearSide: '18% VLT',
      rear: '18% VLT',
      note: 'Side mirrors required if rear window tinted. No red or amber tint.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red, blue, or amber.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by statute. Enforcement varies by county.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  LA: {
    state: 'Louisiana',
    abbr: 'LA',
    tint: {
      frontSide: '40% VLT',
      rearSide: '25% VLT',
      rear: '12% VLT',
      note: 'Dual side mirrors required if rear tint is applied.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud or unusual." Officer discretion.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. New Orleans has additional local rules.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Broadly tolerated in rural areas.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required by law. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  ME: {
    state: 'Maine',
    abbr: 'ME',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Must not be "excessively loud."',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing. Annual safety inspection required.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not red, blue, or flashing. Broadly tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection may flag this.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber only. Safety inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  MD: {
    state: 'Maryland',
    abbr: 'MD',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Tint must not be reflective. Dual mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Baltimore and DC suburbs enforce more aggressively.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Biennial emissions testing required for most gasoline vehicles.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing, non-red, non-blue. Must not be distracting.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by law. Fails emissions inspection.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Tinted covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  MA: {
    state: 'Massachusetts',
    abbr: 'MA',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted. Strictly enforced.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Annual inspection enforces compliance strictly.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Annual OBD emissions test required. One of the strictest in the US.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Must not be visible to other drivers in a distracting way.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual inspection will flag non-compliant exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Annual safety inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  MI: {
    state: 'Michigan',
    abbr: 'MI',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear is tinted. No colored tint.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unreasonably loud." Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'Southeast Michigan (Wayne, Oakland, Macomb, Washtenaw, Livingston, Monroe, St. Clair counties)',
      note: 'Required annually in the Detroit metro area.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Common in the Michigan car scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but officer discretion applies.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Tinted covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  MN: {
    state: 'Minnesota',
    abbr: 'MN',
    tint: {
      frontSide: '50% VLT',
      rearSide: '50% VLT',
      rear: '50% VLT',
      note: 'One of the more restrictive tint states. Dual mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing.',
    },
    underglow: {
      status: 'illegal',
      note: 'Underglow lights are prohibited while the vehicle is in motion on public roads.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Must not be unreasonably loud.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Colored tint or covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  MS: {
    state: 'Mississippi',
    abbr: 'MS',
    tint: {
      frontSide: '28% VLT',
      rearSide: '28% VLT',
      rear: '28% VLT',
      note: 'Dual side mirrors required if rear is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Very leniently enforced.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not red, blue, or flashing. Rarely enforced.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by law but enforcement is minimal in practice.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Colored covers technically restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  MO: {
    state: 'Missouri',
    abbr: 'MO',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unnecessarily loud." Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'St. Louis and Kansas City metro areas',
      note: 'Required in specific metro counties. Annual testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing, non-red, non-blue. Generally accepted in car culture.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by statute. Enforcement varies by area.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  MT: {
    state: 'Montana',
    abbr: 'MT',
    tint: {
      frontSide: '24% VLT',
      rearSide: '14% VLT',
      rear: '14% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'No statewide exhaust noise law. Very lenient.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing. Some counties may have local requirements.',
    },
    underglow: {
      status: 'legal',
      note: 'Generally legal. Avoid red or blue lights that could be confused with emergency vehicles.',
    },
    straightPipe: {
      status: 'legal',
      note: 'No statewide noise limit. One of the most permissive states for exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required by law. Colored covers technically restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
  NE: {
    state: 'Nebraska',
    abbr: 'NE',
    tint: {
      frontSide: '35% VLT',
      rearSide: '20% VLT',
      rear: '20% VLT',
      note: 'Dual side mirrors required if rear window tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Must not produce "excessive or unusual noise."',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Tinted covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  NV: {
    state: 'Nevada',
    abbr: 'NV',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Las Vegas enforces more actively.',
    },
    emissions: {
      required: true,
      areas: 'Clark County (Las Vegas) and Washoe County (Reno)',
      note: 'Required in Clark and Washoe counties. Annual testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. Very popular in Las Vegas car scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Clark County actively enforces noise ordinances.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. HID or colored covers require approval.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  NH: {
    state: 'New Hampshire',
    abbr: 'NH',
    tint: {
      frontSide: '70% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Very restrictive front window tint. Rear is unrestricted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Annual inspection may flag issues.',
    },
    emissions: {
      required: false,
      note: 'No emissions testing program (unique for a northeastern state).',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Broadly tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection may flag loud exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  NJ: {
    state: 'New Jersey',
    abbr: 'NJ',
    tint: {
      frontSide: 'No tint permitted',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Front side windows must be untinted. Strictly enforced.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Annual inspection enforces compliance. Very strictly enforced.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Biennial OBD test required. One of the strictest emission inspection programs.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not red, blue, or flashing. Must not be visible while in motion in many interpretations.',
    },
    straightPipe: {
      status: 'illegal',
      note: 'Muffler required. Annual inspection will fail non-compliant exhaust. Very strictly enforced.',
    },
    coloredHeadlights: {
      status: 'illegal',
      note: 'Only white headlights permitted. Annual inspection flags violations.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  NM: {
    state: 'New Mexico',
    abbr: 'NM',
    tint: {
      frontSide: '20% VLT',
      rearSide: '20% VLT',
      rear: '20% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'Bernalillo County (Albuquerque)',
      note: 'Required in Albuquerque metro. Annual testing.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Colored tint restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  NY: {
    state: 'New York',
    abbr: 'NY',
    tint: {
      frontSide: '70% VLT',
      rearSide: '70% VLT',
      rear: '70% VLT',
      note: 'One of the most restrictive tint states. Essentially no visible tint allowed. Very strictly enforced.',
    },
    exhaust: {
      limit: 'No specific dB limit statewide; NYC has local limits',
      note: 'Annual inspection required. NYC enforces 96 dB limit with mobile cameras.',
    },
    emissions: {
      required: true,
      areas: 'Statewide',
      note: 'Annual OBD emissions test required for most vehicles. Very strictly enforced.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. NYC enforces more aggressively.',
    },
    straightPipe: {
      status: 'illegal',
      note: 'Annual inspection will fail non-compliant exhaust. NYC uses sound cameras for enforcement.',
    },
    coloredHeadlights: {
      status: 'illegal',
      note: 'Only white or amber headlights. Annual inspection enforces this strictly.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  NC: {
    state: 'North Carolina',
    abbr: 'NC',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Tint must not be red or amber. Dual side mirrors required if rear tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Annual safety inspection enforces compliance.',
    },
    emissions: {
      required: true,
      areas: 'Most NC counties (48 of 100)',
      note: 'Annual OBD test required in most urban and suburban counties.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. Annual inspection may flag issues.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection enforces this.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Annual inspection enforces compliance.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  ND: {
    state: 'North Dakota',
    abbr: 'ND',
    tint: {
      frontSide: '50% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unnecessarily loud." Very leniently enforced.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Very leniently enforced.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by statute. Enforcement minimal in rural areas.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers technically restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
  OH: {
    state: 'Ohio',
    abbr: 'OH',
    tint: {
      frontSide: '50% VLT',
      rearSide: '50% VLT',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted below 50%.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unreasonably loud." Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'Northeast Ohio counties (E-Check program)',
      note: 'E-Check program covers Cuyahoga, Lake, Geauga, Lorain, Medina, Portage, Summit counties.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red or blue. Common in the Ohio car scene.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but noise complaints apply.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Colored tint restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  OK: {
    state: 'Oklahoma',
    abbr: 'OK',
    tint: {
      frontSide: '25% VLT',
      rearSide: '25% VLT',
      rear: '25% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit; officer discretion applies.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  OR: {
    state: 'Oregon',
    abbr: 'OR',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Portland enforces more aggressively.',
    },
    emissions: {
      required: true,
      areas: 'Portland metro (Multnomah, Washington, Clackamas counties)',
      note: 'DEQ test required in the Portland metro area.',
    },
    underglow: {
      status: 'illegal',
      note: 'Underglow lights are illegal in Oregon while operating on public roads.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. DEQ inspection may flag excessively loud exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  PA: {
    state: 'Pennsylvania',
    abbr: 'PA',
    tint: {
      frontSide: 'No tint permitted',
      rearSide: 'No tint permitted',
      rear: 'No tint permitted',
      note: 'One of the strictest tint states. No aftermarket tint allowed on any window. Annual inspection enforces this.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Annual inspection enforces compliance. Heavily enforced.',
    },
    emissions: {
      required: true,
      areas: 'Most PA counties (OBD test)',
      note: 'Annual emission inspection required for most counties. Part of annual vehicle inspection.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Not visible during annual inspection.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual inspection will flag non-compliant exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Annual inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  RI: {
    state: 'Rhode Island',
    abbr: 'RI',
    tint: {
      frontSide: '70% VLT',
      rearSide: '70% VLT',
      rear: '70% VLT',
      note: 'Very restrictive. Essentially no tint allowed. Annual inspection enforces this.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Annual inspection enforces compliance.',
    },
    emissions: {
      required: false,
      note: 'No separate emissions test. Annual safety inspection required.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Annual inspection may flag wiring.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection enforces this.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Annual safety inspection enforces compliance.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  SC: {
    state: 'South Carolina',
    abbr: 'SC',
    tint: {
      frontSide: '27% VLT',
      rearSide: '27% VLT',
      rear: '27% VLT',
      note: 'Dual side mirrors required if rear window tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not flashing and not red, blue, or amber. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but officer discretion applies.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights only. Colored tint restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  SD: {
    state: 'South Dakota',
    abbr: 'SD',
    tint: {
      frontSide: '35% VLT',
      rearSide: '20% VLT',
      rear: '20% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'No statewide exhaust noise law. Very leniently enforced.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing, non-red, non-blue. Very tolerant state.',
    },
    straightPipe: {
      status: 'legal',
      note: 'No specific restrictions. One of the more permissive states.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights technically required but leniently enforced.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
  TN: {
    state: 'Tennessee',
    abbr: 'TN',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Dual side mirrors required if rear tint is applied. No red or amber tint.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing. Davidson County (Nashville) may have local requirements.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Active car scene in Nashville and Memphis.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but officer discretion applies.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Tinted covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  TX: {
    state: 'Texas',
    abbr: 'TX',
    tint: {
      frontSide: '25% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted. Annual inspection includes tint check.',
    },
    exhaust: {
      limit: 'No specific dB limit statewide',
      note: 'Must not be "excessively loud." Annual inspection includes exhaust check.',
    },
    emissions: {
      required: true,
      areas: 'Houston (HGB), Dallas-Fort Worth, Austin, San Antonio, El Paso (some counties)',
      note: 'Required in major metro counties. Annual OBD test.',
    },
    underglow: {
      status: 'legal',
      note: 'Legal if not red or blue and not flashing. Very popular in Texas car culture.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by law. Annual inspection enforces compliance. Broadly tolerated in rural areas.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Annual inspection enforces compliance.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  UT: {
    state: 'Utah',
    abbr: 'UT',
    tint: {
      frontSide: '43% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted below 43%.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "unreasonably loud." Annual safety inspection required.',
    },
    emissions: {
      required: true,
      areas: 'Wasatch Front counties (Salt Lake, Utah, Davis, Cache, Box Elder, Weber)',
      note: 'Annual OBD test required in Wasatch Front counties.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally accepted.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual inspection enforces compliance.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Annual inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  VT: {
    state: 'Vermont',
    abbr: 'VT',
    tint: {
      frontSide: 'No specific law',
      rearSide: 'No specific law',
      rear: 'No specific law',
      note: 'Vermont has no specific VLT requirements, making it one of the most permissive tint states.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Annual safety inspection required.',
    },
    emissions: {
      required: false,
      note: 'No separate emissions testing. Annual safety inspection covers basic compliance.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Annual safety inspection may flag.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection enforces compliance.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Annual safety inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
  VA: {
    state: 'Virginia',
    abbr: 'VA',
    tint: {
      frontSide: '50% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Dual side mirrors required if rear tinted. Annual inspection includes tint check.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Annual safety inspection enforces compliance.',
    },
    emissions: {
      required: true,
      areas: 'Northern Virginia and Hampton Roads',
      note: 'Annual OBD test required in Northern Virginia and Hampton Roads metro areas.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if not red or blue and not flashing. Must not be distracting.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. Annual safety inspection flags non-compliant exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights required. Annual safety inspection enforces this.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  WA: {
    state: 'Washington',
    abbr: 'WA',
    tint: {
      frontSide: '24% VLT',
      rearSide: '24% VLT',
      rear: '24% VLT',
      note: 'Dual side mirrors required if rear window tinted. Metallic or mirrored tint not permitted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Seattle and surrounding areas enforce more actively.',
    },
    emissions: {
      required: true,
      areas: 'Puget Sound area counties',
      note: 'Required in King, Pierce, Snohomish, and Clark counties. Annual OBD test.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Must not be distracting to other drivers.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but noise ordinances apply in urban areas.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'strict',
  },
  WV: {
    state: 'West Virginia',
    abbr: 'WV',
    tint: {
      frontSide: '35% VLT',
      rearSide: '35% VLT',
      rear: '35% VLT',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Muffler required. Must not be "excessively loud."',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally tolerated.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required by statute. Annual safety inspection may flag.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers restricted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  WI: {
    state: 'Wisconsin',
    abbr: 'WI',
    tint: {
      frontSide: '50% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'Must not be "excessively loud." Muffler required.',
    },
    emissions: {
      required: true,
      areas: 'Southeast Wisconsin (Milwaukee, Waukesha, Racine, Kenosha, Ozaukee, Washington counties)',
      note: 'Required in southeast Wisconsin counties. Annual OBD test.',
    },
    underglow: {
      status: 'restricted',
      note: 'Legal if non-flashing and not red or blue. Generally accepted.',
    },
    straightPipe: {
      status: 'restricted',
      note: 'Muffler required. No specific dB limit but noise ordinances apply.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White or amber headlights required. Colored covers not permitted.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'moderate',
  },
  WY: {
    state: 'Wyoming',
    abbr: 'WY',
    tint: {
      frontSide: '35% VLT',
      rearSide: 'Any darkness',
      rear: 'Any darkness',
      note: 'Dual side mirrors required if rear window is tinted. Very leniently enforced.',
    },
    exhaust: {
      limit: 'No specific dB limit',
      note: 'No statewide exhaust noise law. One of the most permissive states.',
    },
    emissions: {
      required: false,
      note: 'No statewide emissions testing program.',
    },
    underglow: {
      status: 'legal',
      note: 'Generally legal. Avoid red or blue lights to prevent confusion with emergency vehicles.',
    },
    straightPipe: {
      status: 'legal',
      note: 'No specific restrictions. One of the most permissive states for exhaust.',
    },
    coloredHeadlights: {
      status: 'restricted',
      note: 'White headlights technically required but very leniently enforced.',
    },
    decorativeLights: {
      status: 'restricted',
      note: 'Christmas lights, string lights, or decorative lighting on exterior generally not permitted while driving. May be allowed for stationary display at events. Check local ordinances.',
    },
    strictness: 'lenient',
  },
}

export const STATE_GRID: Array<{ abbr: string; name: string; row: number; col: number }> = [
  { abbr: 'ME', name: 'Maine', row: 0, col: 11 },
  { abbr: 'WA', name: 'Washington', row: 1, col: 0 },
  { abbr: 'MT', name: 'Montana', row: 1, col: 1 },
  { abbr: 'ND', name: 'North Dakota', row: 1, col: 2 },
  { abbr: 'MN', name: 'Minnesota', row: 1, col: 3 },
  { abbr: 'WI', name: 'Wisconsin', row: 1, col: 5 },
  { abbr: 'MI', name: 'Michigan', row: 1, col: 6 },
  { abbr: 'VT', name: 'Vermont', row: 1, col: 9 },
  { abbr: 'NH', name: 'New Hampshire', row: 1, col: 10 },
  { abbr: 'OR', name: 'Oregon', row: 2, col: 0 },
  { abbr: 'ID', name: 'Idaho', row: 2, col: 1 },
  { abbr: 'SD', name: 'South Dakota', row: 2, col: 2 },
  { abbr: 'NE', name: 'Nebraska', row: 2, col: 3 },
  { abbr: 'IA', name: 'Iowa', row: 2, col: 4 },
  { abbr: 'IL', name: 'Illinois', row: 2, col: 5 },
  { abbr: 'IN', name: 'Indiana', row: 2, col: 6 },
  { abbr: 'OH', name: 'Ohio', row: 2, col: 7 },
  { abbr: 'PA', name: 'Pennsylvania', row: 2, col: 8 },
  { abbr: 'NY', name: 'New York', row: 2, col: 9 },
  { abbr: 'MA', name: 'Massachusetts', row: 2, col: 10 },
  { abbr: 'RI', name: 'Rhode Island', row: 2, col: 11 },
  { abbr: 'CA', name: 'California', row: 3, col: 0 },
  { abbr: 'NV', name: 'Nevada', row: 3, col: 1 },
  { abbr: 'WY', name: 'Wyoming', row: 3, col: 2 },
  { abbr: 'CO', name: 'Colorado', row: 3, col: 3 },
  { abbr: 'KS', name: 'Kansas', row: 3, col: 4 },
  { abbr: 'MO', name: 'Missouri', row: 3, col: 5 },
  { abbr: 'KY', name: 'Kentucky', row: 3, col: 6 },
  { abbr: 'WV', name: 'West Virginia', row: 3, col: 7 },
  { abbr: 'VA', name: 'Virginia', row: 3, col: 8 },
  { abbr: 'MD', name: 'Maryland', row: 3, col: 9 },
  { abbr: 'DE', name: 'Delaware', row: 3, col: 10 },
  { abbr: 'NJ', name: 'New Jersey', row: 3, col: 11 },
  { abbr: 'CT', name: 'Connecticut', row: 3, col: 12 },
  { abbr: 'AZ', name: 'Arizona', row: 4, col: 1 },
  { abbr: 'UT', name: 'Utah', row: 4, col: 2 },
  { abbr: 'NM', name: 'New Mexico', row: 4, col: 3 },
  { abbr: 'OK', name: 'Oklahoma', row: 4, col: 4 },
  { abbr: 'AR', name: 'Arkansas', row: 4, col: 5 },
  { abbr: 'TN', name: 'Tennessee', row: 4, col: 6 },
  { abbr: 'NC', name: 'North Carolina', row: 4, col: 7 },
  { abbr: 'SC', name: 'South Carolina', row: 4, col: 8 },
  { abbr: 'TX', name: 'Texas', row: 5, col: 3 },
  { abbr: 'LA', name: 'Louisiana', row: 5, col: 4 },
  { abbr: 'MS', name: 'Mississippi', row: 5, col: 5 },
  { abbr: 'AL', name: 'Alabama', row: 5, col: 6 },
  { abbr: 'GA', name: 'Georgia', row: 5, col: 7 },
  { abbr: 'FL', name: 'Florida', row: 6, col: 7 },
  { abbr: 'AK', name: 'Alaska', row: 7, col: 0 },
  { abbr: 'HI', name: 'Hawaii', row: 7, col: 2 },
]

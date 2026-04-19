'use client'

import { useRef, useState, useMemo } from 'react'
import { Part } from '@/lib/types'

// ─── Parts that contribute HP ─────────────────────────────────────────────────

const HP_PART_IDS = new Set([
  'cold-air-intake',
  'catback-exhaust',
  'performance-headers',
  'ecu-tune',
  'turbo-kit',
])

// ─── Parse "+min–max hp" / "+min–max+ hp" ─────────────────────────────────────

function parseGain(s: string | undefined): { min: number; max: number } | null {
  if (!s) return null
  const m = s.match(/\+(\d+)[–\-](\d+)\+?/)
  if (!m) return null
  return { min: parseInt(m[1]), max: parseInt(m[2]) }
}

// ─── Stock HP lookup table ────────────────────────────────────────────────────

type HpRow = {
  make: string[]
  model: string[]
  trim?: string[]
  yearMin?: number
  yearMax?: number
  hp: number
}

const STOCK_HP_TABLE: HpRow[] = [

  // ── FORD ──────────────────────────────────────────────────────────────────
  { make: ['ford'], model: ['mustang'], trim: ['demon 170', 'dark horse'], yearMin: 2024, hp: 500 },
  { make: ['ford'], model: ['mustang'], trim: ['gt500', 'shelby gt500'], yearMin: 2020, hp: 760 },
  { make: ['ford'], model: ['mustang'], trim: ['gt500', 'shelby gt500'], yearMin: 2013, yearMax: 2014, hp: 662 },
  { make: ['ford'], model: ['mustang'], trim: ['gt350r', 'shelby gt350r'], hp: 526 },
  { make: ['ford'], model: ['mustang'], trim: ['gt350', 'shelby gt350'], hp: 526 },
  { make: ['ford'], model: ['mustang'], trim: ['mach 1'], hp: 480 },
  { make: ['ford'], model: ['mustang'], trim: ['gt performance', 'gt pp1', 'gt pp2'], yearMin: 2018, hp: 460 },
  { make: ['ford'], model: ['mustang'], trim: ['gt'], yearMin: 2018, hp: 460 },
  { make: ['ford'], model: ['mustang'], trim: ['gt'], yearMin: 2015, yearMax: 2017, hp: 435 },
  { make: ['ford'], model: ['mustang'], trim: ['gt'], yearMin: 2011, yearMax: 2014, hp: 420 },
  { make: ['ford'], model: ['mustang'], trim: ['boss 302'], hp: 444 },
  { make: ['ford'], model: ['mustang'], trim: ['ecoboost high performance', 'ecoboost hp'], hp: 330 },
  { make: ['ford'], model: ['mustang'], trim: ['ecoboost'], yearMin: 2018, hp: 310 },
  { make: ['ford'], model: ['mustang'], trim: ['ecoboost'], yearMax: 2017, hp: 310 },
  { make: ['ford'], model: ['mustang'], trim: ['v6'], yearMin: 2011, yearMax: 2017, hp: 300 },
  { make: ['ford'], model: ['focus rs'], hp: 350 },
  { make: ['ford'], model: ['focus st'], yearMin: 2013, hp: 252 },
  { make: ['ford'], model: ['fiesta st'], hp: 197 },
  { make: ['ford'], model: ['f-150', 'f150'], trim: ['raptor r'], yearMin: 2023, hp: 720 },
  { make: ['ford'], model: ['f-150', 'f150'], trim: ['raptor'], yearMin: 2021, hp: 450 },
  { make: ['ford'], model: ['f-150', 'f150'], trim: ['raptor'], yearMin: 2017, yearMax: 2020, hp: 450 },
  { make: ['ford'], model: ['f-150', 'f150'], trim: ['tremor', 'powerboost'], yearMin: 2021, hp: 430 },
  { make: ['ford'], model: ['bronco'], trim: ['raptor'], yearMin: 2022, hp: 418 },
  { make: ['ford'], model: ['explorer'], trim: ['st'], yearMin: 2020, hp: 400 },
  { make: ['ford'], model: ['expedition'], trim: ['stealth performance', 'timberline'], yearMin: 2022, hp: 440 },

  // ── CHEVROLET / GMC ───────────────────────────────────────────────────────
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['zl1 1le', 'zl1le'], hp: 650 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['zl1'], hp: 650 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['z/28', 'z28'], hp: 505 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['ss 1le', 'ss1le'], yearMin: 2016, hp: 455 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['ss'], yearMin: 2016, hp: 455 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['ss'], yearMin: 2010, yearMax: 2015, hp: 426 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['lt1', '2lt', '3lt'], hp: 335 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['turbo', 'rs'], yearMin: 2016, hp: 275 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], trim: ['z06'], yearMin: 2023, hp: 670 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], trim: ['z06'], yearMin: 2015, yearMax: 2019, hp: 650 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], trim: ['zr1'], yearMin: 2019, hp: 755 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], trim: ['e-ray', 'eray'], yearMin: 2024, hp: 655 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], trim: ['stingray', 'z51', 'c8'], yearMin: 2020, hp: 495 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], yearMin: 2014, yearMax: 2019, hp: 455 },
  { make: ['chevrolet', 'chevy'], model: ['corvette'], yearMin: 1997, yearMax: 2013, hp: 430 },
  { make: ['chevrolet', 'chevy'], model: ['silverado', 'sierra'], trim: ['zr2'], yearMin: 2022, hp: 420 },
  { make: ['chevrolet', 'chevy'], model: ['silverado', 'sierra'], trim: ['trail boss', 'at4x'], yearMin: 2019, hp: 355 },
  { make: ['chevrolet', 'chevy'], model: ['colorado', 'canyon'], trim: ['zr2 bison', 'zr2'], yearMin: 2023, hp: 310 },
  { make: ['chevrolet', 'chevy'], model: ['colorado', 'canyon'], trim: ['zr2'], yearMin: 2017, yearMax: 2022, hp: 308 },
  { make: ['chevrolet', 'chevy'], model: ['tahoe', 'suburban', 'yukon'], trim: ['rst', 'high country'], yearMin: 2021, hp: 420 },
  { make: ['chevrolet', 'chevy', 'gmc'], model: ['colorado', 'canyon'], trim: ['zr2'], yearMin: 2023, hp: 310 },

  // ── DODGE / RAM / CHRYSLER ────────────────────────────────────────────────
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['demon', 'srt demon 170'], yearMin: 2023, hp: 1025 },
  { make: ['dodge'], model: ['challenger'], trim: ['demon', 'srt demon'], yearMin: 2018, yearMax: 2018, hp: 808 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['super stock', 'redeye widebody', 'redeye'], hp: 797 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['jailbreak', 'hellcat jailbreak'], hp: 717 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['hellcat', 'srt hellcat', 'srt8 hellcat'], hp: 717 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['widebody', 'scat pack widebody'], hp: 485 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['scat pack', '392', 'srt 392', 'srt8 392'], hp: 485 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['r/t scat pack plus'], hp: 375 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['r/t', 'rt', 'r/t plus'], hp: 375 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['sxt plus', 'sxt'], hp: 305 },
  { make: ['dodge'], model: ['challenger', 'charger'], trim: ['gt', 'gt awd'], hp: 305 },
  { make: ['dodge'], model: ['viper', 'srt viper', 'srt-10'], trim: ['acr', 'ta'], yearMin: 2013, hp: 645 },
  { make: ['dodge'], model: ['viper', 'srt viper'], yearMin: 2013, hp: 640 },
  { make: ['dodge'], model: ['viper', 'srt-10'], yearMin: 2003, yearMax: 2010, hp: 500 },
  { make: ['dodge'], model: ['durango'], trim: ['hellcat', 'srt hellcat'], hp: 710 },
  { make: ['dodge'], model: ['durango'], trim: ['srt', 'srt 392'], hp: 475 },
  { make: ['dodge'], model: ['durango'], trim: ['r/t', 'rt', 'r/t plus', 'r/t awd'], yearMin: 2011, hp: 360 },
  { make: ['dodge'], model: ['durango'], trim: ['sxt', 'gt', 'citadel', 'limited', 'sxt awd', 'gt awd', 'citadel awd', 'limited awd', 'sxt plus'], yearMin: 2011, hp: 295 },
  { make: ['dodge'], model: ['durango'], yearMin: 2011, hp: 295 },
  { make: ['ram'], model: ['1500', 'ram 1500'], trim: ['trx'], yearMin: 2021, hp: 702 },
  { make: ['ram'], model: ['1500', 'ram 1500'], trim: ['rebel', 'limited', 'laramie longhorn'], yearMin: 2019, hp: 395 },

  // ── SUBARU ────────────────────────────────────────────────────────────────
  { make: ['subaru'], model: ['wrx'], trim: ['sti', 's209', 'sti type ra', 'sti s209'], hp: 341 },
  { make: ['subaru'], model: ['wrx'], trim: ['sti'], hp: 310 },
  { make: ['subaru'], model: ['wrx'], yearMin: 2022, hp: 271 },
  { make: ['subaru'], model: ['wrx'], yearMin: 2015, yearMax: 2021, hp: 268 },
  { make: ['subaru'], model: ['wrx'], yearMin: 2011, yearMax: 2014, hp: 265 },
  { make: ['subaru'], model: ['brz'], yearMin: 2022, hp: 228 },
  { make: ['subaru'], model: ['brz'], yearMin: 2013, yearMax: 2021, hp: 205 },
  { make: ['subaru'], model: ['forester'], trim: ['xt'], yearMin: 2014, yearMax: 2018, hp: 250 },
  { make: ['subaru'], model: ['forester'], trim: ['sport'], yearMin: 2019, hp: 182 },
  { make: ['subaru'], model: ['legacy'], trim: ['gt'], yearMin: 2005, yearMax: 2009, hp: 243 },
  { make: ['subaru'], model: ['outback'], trim: ['xt'], yearMin: 2020, hp: 260 },
  { make: ['subaru'], model: ['ascent'], yearMin: 2019, hp: 260 },
  { make: ['subaru'], model: ['impreza'], trim: ['wrx sti', 'sti'], yearMin: 2004, yearMax: 2007, hp: 293 },

  // ── HONDA ─────────────────────────────────────────────────────────────────
  { make: ['honda'], model: ['civic'], trim: ['type r', 'type-r', 'ctr'], yearMin: 2023, hp: 315 },
  { make: ['honda'], model: ['civic'], trim: ['type r', 'type-r', 'ctr'], yearMin: 2017, yearMax: 2022, hp: 306 },
  { make: ['honda'], model: ['civic'], trim: ['si'], yearMin: 2022, hp: 200 },
  { make: ['honda'], model: ['civic'], trim: ['si'], yearMin: 2017, yearMax: 2021, hp: 205 },
  { make: ['honda'], model: ['civic'], trim: ['sport', 'ex', 'lx'], yearMin: 2022, hp: 158 },
  { make: ['honda'], model: ['accord'], trim: ['sport 2.0t', '2.0t', 'touring 2.0t'], hp: 252 },
  { make: ['honda'], model: ['accord'], trim: ['sport', 'ex-l', 'touring'], yearMin: 2018, hp: 192 },
  { make: ['honda'], model: ['s2000', 'ap1', 'ap2'], yearMin: 2004, yearMax: 2009, hp: 237 },
  { make: ['honda'], model: ['s2000', 'ap1'], yearMin: 1999, yearMax: 2003, hp: 240 },
  { make: ['honda'], model: ['integra'], trim: ['type r', 'type-r'], yearMin: 2023, hp: 320 },
  { make: ['honda'], model: ['integra'], yearMin: 2023, hp: 200 },
  { make: ['honda'], model: ['cr-v', 'crv'], trim: ['sport touring', 'sport'], yearMin: 2023, hp: 204 },
  { make: ['honda'], model: ['passport', 'pilot', 'ridgeline'], trim: ['black edition', 'sport'], yearMin: 2019, hp: 280 },
  { make: ['honda'], model: ['nsx', 'acura nsx'], yearMin: 2017, hp: 573 },

  // ── ACURA ─────────────────────────────────────────────────────────────────
  { make: ['acura'], model: ['nsx'], yearMin: 2017, hp: 573 },
  { make: ['acura'], model: ['nsx'], yearMin: 1991, yearMax: 2005, hp: 290 },
  { make: ['acura'], model: ['integra'], trim: ['type s', 'type-s'], yearMin: 2023, hp: 320 },
  { make: ['acura'], model: ['integra'], yearMin: 2023, hp: 200 },
  { make: ['acura'], model: ['tlx'], trim: ['type s', 'pmc edition'], yearMin: 2021, hp: 355 },
  { make: ['acura'], model: ['rdx'], trim: ['a-spec', 'advance'], yearMin: 2019, hp: 272 },
  { make: ['acura'], model: ['tsx'], trim: ['v6'], yearMin: 2010, yearMax: 2014, hp: 280 },
  { make: ['acura'], model: ['rsx'], trim: ['type s', 'type-s'], yearMin: 2002, yearMax: 2006, hp: 210 },

  // ── TOYOTA ────────────────────────────────────────────────────────────────
  { make: ['toyota'], model: ['supra', 'gr supra', 'a90 supra'], trim: ['45th anniversary', 'premium'], yearMin: 2023, hp: 382 },
  { make: ['toyota'], model: ['supra', 'gr supra', 'a90 supra'], yearMin: 2022, hp: 382 },
  { make: ['toyota'], model: ['supra', 'gr supra', 'a90 supra'], trim: ['3.0', 'premium', 'launch edition'], yearMin: 2020, yearMax: 2021, hp: 335 },
  { make: ['toyota'], model: ['supra', 'gr supra', 'a90 supra'], trim: ['2.0', 'base'], yearMin: 2020, yearMax: 2022, hp: 255 },
  { make: ['toyota'], model: ['supra', 'a80'], yearMin: 1993, yearMax: 1998, hp: 320 },
  { make: ['toyota'], model: ['gr86', 'gr 86', '86', 'gt86', 'frs'], yearMin: 2022, hp: 228 },
  { make: ['toyota'], model: ['86', 'gt86', 'frs', 'fr-s'], yearMin: 2013, yearMax: 2021, hp: 205 },
  { make: ['toyota'], model: ['gr corolla'], trim: ['circuit edition', 'morizo'], yearMin: 2023, hp: 300 },
  { make: ['toyota'], model: ['gr corolla'], yearMin: 2023, hp: 300 },
  { make: ['toyota'], model: ['corolla'], trim: ['gr sport', 'apex', 'xse'], yearMin: 2020, hp: 169 },
  { make: ['toyota'], model: ['camry'], trim: ['trd', 'xse v6', 'xle v6'], yearMin: 2018, hp: 301 },
  { make: ['toyota'], model: ['camry'], trim: ['se', 'xse', 'le'], yearMin: 2018, hp: 203 },
  { make: ['toyota'], model: ['tacoma'], trim: ['trd pro'], yearMin: 2016, hp: 278 },
  { make: ['toyota'], model: ['tacoma'], trim: ['trd sport', 'trd off-road'], yearMin: 2016, hp: 278 },
  { make: ['toyota'], model: ['tundra'], trim: ['trd pro', 'limited', 'platinum'], yearMin: 2022, hp: 437 },
  { make: ['toyota'], model: ['4runner'], trim: ['trd pro', 'trd sport', 'trd off-road'], yearMin: 2010, hp: 270 },
  { make: ['toyota'], model: ['land cruiser'], trim: ['gxr', 'lc300'], yearMin: 2022, hp: 409 },
  { make: ['toyota'], model: ['land cruiser'], yearMin: 2008, yearMax: 2021, hp: 381 },
  { make: ['toyota'], model: ['rav4'], trim: ['prime', 'phev'], yearMin: 2021, hp: 302 },
  { make: ['toyota'], model: ['sequoia'], trim: ['trd pro', 'limited', 'platinum'], yearMin: 2022, hp: 437 },

  // ── LEXUS ─────────────────────────────────────────────────────────────────
  { make: ['lexus'], model: ['lfa'], hp: 552 },
  { make: ['lexus'], model: ['rc f', 'rcf', 'rc-f'], yearMin: 2015, hp: 472 },
  { make: ['lexus'], model: ['lc 500', 'lc500'], yearMin: 2017, hp: 471 },
  { make: ['lexus'], model: ['is 500', 'is500'], yearMin: 2022, hp: 472 },
  { make: ['lexus'], model: ['gs f', 'gsf', 'gs-f'], yearMin: 2016, hp: 467 },
  { make: ['lexus'], model: ['is 350', 'is350'], trim: ['f sport'], yearMin: 2014, hp: 311 },
  { make: ['lexus'], model: ['is 300', 'is300'], yearMin: 2021, hp: 241 },
  { make: ['lexus'], model: ['is 250', 'is250', 'is200t', 'is 200t'], yearMin: 2006, hp: 204 },

  // ── BMW ───────────────────────────────────────────────────────────────────
  { make: ['bmw'], model: ['m3', 'm4'], trim: ['csl', 'gtrs'], yearMin: 2023, hp: 591 },
  { make: ['bmw'], model: ['m3', 'm4'], trim: ['cs'], yearMin: 2021, hp: 543 },
  { make: ['bmw'], model: ['m3', 'm4'], trim: ['competition', 'competition xdrive'], yearMin: 2021, hp: 503 },
  { make: ['bmw'], model: ['m3', 'm4'], yearMin: 2021, hp: 473 },
  { make: ['bmw'], model: ['m3', 'm4'], trim: ['cs'], yearMin: 2016, yearMax: 2020, hp: 454 },
  { make: ['bmw'], model: ['m3', 'm4'], yearMin: 2015, yearMax: 2020, hp: 425 },
  { make: ['bmw'], model: ['m3'], yearMin: 2008, yearMax: 2013, hp: 414 },
  { make: ['bmw'], model: ['m5'], trim: ['cs'], yearMin: 2022, hp: 627 },
  { make: ['bmw'], model: ['m5'], trim: ['competition'], yearMin: 2018, hp: 617 },
  { make: ['bmw'], model: ['m5'], yearMin: 2018, hp: 600 },
  { make: ['bmw'], model: ['m5'], yearMin: 2013, yearMax: 2017, hp: 560 },
  { make: ['bmw'], model: ['m6'], yearMin: 2013, yearMax: 2018, hp: 560 },
  { make: ['bmw'], model: ['m8'], trim: ['competition'], yearMin: 2020, hp: 617 },
  { make: ['bmw'], model: ['m8'], yearMin: 2020, hp: 600 },
  { make: ['bmw'], model: ['m2'], trim: ['cs'], yearMin: 2020, yearMax: 2021, hp: 444 },
  { make: ['bmw'], model: ['m2'], yearMin: 2023, hp: 453 },
  { make: ['bmw'], model: ['m2'], yearMin: 2016, yearMax: 2022, hp: 405 },
  { make: ['bmw'], model: ['m240i', 'm240'], yearMin: 2022, hp: 382 },
  { make: ['bmw'], model: ['340i', 'm340i', 'm340'], yearMin: 2019, hp: 382 },
  { make: ['bmw'], model: ['340i'], yearMin: 2016, yearMax: 2019, hp: 320 },
  { make: ['bmw'], model: ['335i', 'n55 335', 'n54 335'], yearMin: 2012, yearMax: 2015, hp: 300 },
  { make: ['bmw'], model: ['135i', '1m', 'e82 1m'], yearMin: 2011, yearMax: 2012, hp: 335 },
  { make: ['bmw'], model: ['135i'], yearMin: 2008, yearMax: 2013, hp: 300 },
  { make: ['bmw'], model: ['x5m', 'x6m'], trim: ['competition'], yearMin: 2020, hp: 617 },
  { make: ['bmw'], model: ['x5m', 'x6m'], yearMin: 2020, hp: 600 },

  // ── MERCEDES-BENZ ─────────────────────────────────────────────────────────
  { make: ['mercedes', 'mercedes-benz'], model: ['c63', 'c63s', 'c63 amg', 'c 63'], yearMin: 2023, hp: 671 },
  { make: ['mercedes', 'mercedes-benz'], model: ['c63', 'c63s', 'c63 amg', 'c 63'], yearMin: 2015, yearMax: 2022, hp: 503 },
  { make: ['mercedes', 'mercedes-benz'], model: ['c43', 'c 43 amg'], yearMin: 2016, hp: 385 },
  { make: ['mercedes', 'mercedes-benz'], model: ['e63', 'e63s', 'e63 amg', 'e 63'], trim: ['s', 'final edition'], yearMin: 2018, hp: 603 },
  { make: ['mercedes', 'mercedes-benz'], model: ['e63', 'e63 amg', 'e 63'], yearMin: 2017, hp: 563 },
  { make: ['mercedes', 'mercedes-benz'], model: ['gt', 'amg gt', 'amg gt s', 'amg gt r'], trim: ['black series'], yearMin: 2021, hp: 720 },
  { make: ['mercedes', 'mercedes-benz'], model: ['amg gt r', 'gt r'], yearMin: 2017, hp: 577 },
  { make: ['mercedes', 'mercedes-benz'], model: ['amg gt s', 'gt s'], yearMin: 2016, hp: 503 },
  { make: ['mercedes', 'mercedes-benz'], model: ['amg gt', 'gt 43', 'gt 53', 'gt 63'], trim: ['63 s 4matic+'], yearMin: 2019, hp: 630 },
  { make: ['mercedes', 'mercedes-benz'], model: ['a45', 'a45s', 'a 45 amg'], hp: 415 },
  { make: ['mercedes', 'mercedes-benz'], model: ['cla 45', 'cla45', 'cla 45 amg'], hp: 382 },
  { make: ['mercedes', 'mercedes-benz'], model: ['gle 63', 'gle63', 'gle 63 s'], yearMin: 2021, hp: 603 },
  { make: ['mercedes', 'mercedes-benz'], model: ['g63', 'g 63 amg', 'g class amg'], yearMin: 2019, hp: 577 },

  // ── AUDI ──────────────────────────────────────────────────────────────────
  { make: ['audi'], model: ['r8'], trim: ['v10 plus', 'v10 performance', 'competition'], yearMin: 2020, hp: 611 },
  { make: ['audi'], model: ['r8'], trim: ['v10', 'plus'], yearMin: 2016, hp: 562 },
  { make: ['audi'], model: ['r8'], yearMin: 2016, hp: 532 },
  { make: ['audi'], model: ['rs e-tron gt', 'rs etron gt'], yearMin: 2022, hp: 637 },
  { make: ['audi'], model: ['rs7', 'rs 7'], yearMin: 2021, hp: 591 },
  { make: ['audi'], model: ['rs6', 'rs 6'], yearMin: 2020, hp: 591 },
  { make: ['audi'], model: ['rs5', 'rs 5'], yearMin: 2018, hp: 444 },
  { make: ['audi'], model: ['rs4', 'rs 4'], yearMin: 2018, hp: 444 },
  { make: ['audi'], model: ['rs3', 'rs 3'], yearMin: 2022, hp: 401 },
  { make: ['audi'], model: ['rs3', 'rs 3'], yearMin: 2017, yearMax: 2020, hp: 394 },
  { make: ['audi'], model: ['s8', 's 8'], yearMin: 2020, hp: 563 },
  { make: ['audi'], model: ['s7', 's 7'], yearMin: 2020, hp: 444 },
  { make: ['audi'], model: ['s6', 's 6'], yearMin: 2020, hp: 444 },
  { make: ['audi'], model: ['s5', 's 5'], yearMin: 2018, hp: 349 },
  { make: ['audi'], model: ['s4', 's 4'], yearMin: 2018, hp: 349 },
  { make: ['audi'], model: ['s3', 's 3'], yearMin: 2022, hp: 306 },
  { make: ['audi'], model: ['sq5', 'sq 5'], yearMin: 2021, hp: 349 },
  { make: ['audi'], model: ['tt rs', 'ttrs', 'tt rs coupe'], yearMin: 2018, hp: 394 },
  { make: ['audi'], model: ['tts', 'tt s'], yearMin: 2015, hp: 288 },

  // ── PORSCHE ───────────────────────────────────────────────────────────────
  { make: ['porsche'], model: ['911'], trim: ['gt3 rs', 'gt3rs'], yearMin: 2023, hp: 518 },
  { make: ['porsche'], model: ['911'], trim: ['gt3', 'gt3 touring'], yearMin: 2022, hp: 502 },
  { make: ['porsche'], model: ['911'], trim: ['turbo s'], yearMin: 2020, hp: 640 },
  { make: ['porsche'], model: ['911'], trim: ['turbo'], yearMin: 2020, hp: 572 },
  { make: ['porsche'], model: ['911'], trim: ['gt2 rs'], yearMin: 2018, hp: 690 },
  { make: ['porsche'], model: ['911'], trim: ['carrera s'], yearMin: 2020, hp: 443 },
  { make: ['porsche'], model: ['911'], trim: ['carrera'], yearMin: 2020, hp: 379 },
  { make: ['porsche'], model: ['cayman', '718 cayman'], trim: ['gt4 rs', 'gt4rs'], yearMin: 2022, hp: 493 },
  { make: ['porsche'], model: ['cayman', '718 cayman'], trim: ['gt4', 'spyder'], yearMin: 2020, hp: 414 },
  { make: ['porsche'], model: ['cayman', '718 cayman'], trim: ['s', 'gts'], yearMin: 2017, hp: 350 },
  { make: ['porsche'], model: ['cayenne'], trim: ['turbo gt', 'turbo s e-hybrid'], yearMin: 2021, hp: 670 },
  { make: ['porsche'], model: ['cayenne'], trim: ['turbo'], yearMin: 2019, hp: 541 },
  { make: ['porsche'], model: ['macan'], trim: ['gts', 'turbo'], yearMin: 2020, hp: 434 },
  { make: ['porsche'], model: ['panamera'], trim: ['turbo s', 'turbo s e-hybrid'], yearMin: 2017, hp: 620 },

  // ── NISSAN ────────────────────────────────────────────────────────────────
  { make: ['nissan'], model: ['gt-r', 'gtr', 'r35', 'nissan gt-r'], trim: ['nismo', 'track edition'], yearMin: 2015, hp: 600 },
  { make: ['nissan'], model: ['gt-r', 'gtr', 'r35', 'nissan gt-r'], yearMin: 2012, hp: 545 },
  { make: ['nissan'], model: ['gt-r', 'gtr', 'r35', 'nissan gt-r'], yearMin: 2009, yearMax: 2011, hp: 480 },
  { make: ['nissan'], model: ['z', '400z', '2023 z', 'nismo z'], trim: ['nismo'], yearMin: 2024, hp: 420 },
  { make: ['nissan'], model: ['z', '400z', '2023 z'], yearMin: 2023, hp: 400 },
  { make: ['nissan'], model: ['370z', 'nismo 370z'], trim: ['nismo'], yearMin: 2009, hp: 350 },
  { make: ['nissan'], model: ['370z'], yearMin: 2009, yearMax: 2020, hp: 332 },
  { make: ['nissan'], model: ['350z'], trim: ['nismo'], yearMin: 2004, hp: 300 },
  { make: ['nissan'], model: ['350z'], yearMin: 2003, yearMax: 2008, hp: 306 },
  { make: ['nissan'], model: ['silvia', 's15', 's14', 's13'], trim: ['spec r', 'spec s'], hp: 247 },
  { make: ['nissan'], model: ['skyline', 'r34', 'r33', 'r32'], trim: ['gt-r', 'gtr'], hp: 276 },
  { make: ['nissan'], model: ['altima'], trim: ['sr', 'sr vc-turbo', 'edition one'], yearMin: 2019, hp: 248 },
  { make: ['nissan'], model: ['sentra'], trim: ['sr', 'sr turbo'], yearMin: 2020, hp: 149 },

  // ── INFINITI ──────────────────────────────────────────────────────────────
  { make: ['infiniti'], model: ['q50'], trim: ['red sport 400', 'red sport'], yearMin: 2016, hp: 400 },
  { make: ['infiniti'], model: ['q50'], trim: ['sport', '3.0t sport'], yearMin: 2016, hp: 300 },
  { make: ['infiniti'], model: ['q60'], trim: ['red sport 400', 'red sport'], yearMin: 2017, hp: 400 },
  { make: ['infiniti'], model: ['q60'], yearMin: 2017, hp: 300 },
  { make: ['infiniti'], model: ['g37', 'g35'], trim: ['ipl', 'sport', 'journey'], yearMin: 2008, hp: 330 },

  // ── VOLKSWAGEN ────────────────────────────────────────────────────────────
  { make: ['volkswagen', 'vw'], model: ['golf r', 'mk8 r', 'mk7 r', 'mk7.5 r'], yearMin: 2022, hp: 315 },
  { make: ['volkswagen', 'vw'], model: ['golf r', 'mk7 r', 'mk7.5 r'], yearMin: 2015, yearMax: 2021, hp: 292 },
  { make: ['volkswagen', 'vw'], model: ['gti', 'mk8 gti', 'mk7 gti', 'mk7.5 gti'], trim: ['clubsport', 'clubsport s'], yearMin: 2016, hp: 261 },
  { make: ['volkswagen', 'vw'], model: ['gti', 'mk8 gti'], yearMin: 2022, hp: 241 },
  { make: ['volkswagen', 'vw'], model: ['gti', 'mk7 gti', 'mk7.5 gti'], yearMin: 2015, yearMax: 2021, hp: 228 },
  { make: ['volkswagen', 'vw'], model: ['jetta gli', 'gli'], yearMin: 2019, hp: 228 },
  { make: ['volkswagen', 'vw'], model: ['arteon'], yearMin: 2019, hp: 268 },
  { make: ['volkswagen', 'vw'], model: ['passat'], trim: ['r-line', 'sel premium'], yearMin: 2018, hp: 174 },

  // ── MAZDA ─────────────────────────────────────────────────────────────────
  { make: ['mazda'], model: ['miata', 'mx-5', 'mx5', 'nd miata', 'nc miata', 'nb miata', 'na miata'], trim: ['rf', 'club', 'grand touring'], yearMin: 2019, hp: 181 },
  { make: ['mazda'], model: ['miata', 'mx-5', 'mx5'], yearMin: 2016, yearMax: 2018, hp: 155 },
  { make: ['mazda'], model: ['miata', 'mx-5', 'mx5'], yearMin: 2006, yearMax: 2015, hp: 167 },
  { make: ['mazda'], model: ['rx-7', 'rx7', 'fd rx-7', 'fd3s'], trim: ['spirit r', 'touring x'], yearMin: 1999, yearMax: 2002, hp: 280 },
  { make: ['mazda'], model: ['rx-7', 'rx7', 'fd rx-7', 'fd3s'], yearMin: 1993, yearMax: 2002, hp: 255 },
  { make: ['mazda'], model: ['rx-8', 'rx8'], yearMin: 2004, yearMax: 2011, hp: 232 },
  { make: ['mazda'], model: ['mazdaspeed3', 'speed3', 'mazda3 speed'], hp: 263 },
  { make: ['mazda'], model: ['mazdaspeed6', 'speed6'], hp: 274 },
  { make: ['mazda'], model: ['cx-5', 'cx5'], trim: ['carbon edition', 'signature'], yearMin: 2021, hp: 187 },

  // ── HYUNDAI ───────────────────────────────────────────────────────────────
  { make: ['hyundai'], model: ['elantra n', 'elantra'], trim: ['n', 'n performance'], yearMin: 2022, hp: 276 },
  { make: ['hyundai'], model: ['veloster n', 'veloster'], trim: ['n', 'n performance'], yearMin: 2019, hp: 275 },
  { make: ['hyundai'], model: ['i30 n', 'i30'], trim: ['n', 'n performance', 'project c'], yearMin: 2018, hp: 275 },
  { make: ['hyundai'], model: ['sonata n', 'sonata'], trim: ['n line', 'n-line'], yearMin: 2021, hp: 290 },
  { make: ['hyundai'], model: ['tucson n', 'tucson'], trim: ['n', 'n line'], yearMin: 2022, hp: 281 },
  { make: ['hyundai'], model: ['genesis coupe', 'genesis'], trim: ['3.8 track', 'r-spec', '3.8 r-spec'], yearMin: 2010, yearMax: 2016, hp: 348 },
  { make: ['hyundai'], model: ['genesis coupe', 'genesis'], trim: ['2.0t r-spec', '2.0t track'], yearMin: 2010, yearMax: 2016, hp: 210 },

  // ── KIA ───────────────────────────────────────────────────────────────────
  { make: ['kia'], model: ['stinger'], trim: ['gt2', 'gt-line awd'], yearMin: 2018, hp: 368 },
  { make: ['kia'], model: ['stinger'], trim: ['gt', 'gt1'], yearMin: 2018, hp: 368 },
  { make: ['kia'], model: ['stinger'], yearMin: 2018, hp: 255 },
  { make: ['kia'], model: ['ev6'], trim: ['gt', 'gt-line awd'], yearMin: 2023, hp: 576 },

  // ── GENESIS ───────────────────────────────────────────────────────────────
  { make: ['genesis'], model: ['g70'], trim: ['3.3t sport', '3.3t launch edition'], yearMin: 2019, hp: 365 },
  { make: ['genesis'], model: ['g70'], yearMin: 2019, hp: 252 },
  { make: ['genesis'], model: ['g80'], trim: ['sport 3.5t', 'electrified'], yearMin: 2021, hp: 375 },

  // ── MITSUBISHI ────────────────────────────────────────────────────────────
  { make: ['mitsubishi'], model: ['evo', 'lancer evolution', 'lancer evo', 'evo x', 'evo ix', 'evo viii'], trim: ['mr', 'gsr', 'rs', 'final edition'], yearMin: 2008, hp: 291 },
  { make: ['mitsubishi'], model: ['evo', 'lancer evolution', 'lancer evo'], yearMin: 2003, hp: 286 },
  { make: ['mitsubishi'], model: ['eclipse'], trim: ['gst', 'gs-t', 'gsx', 'gs-x', 'spyder gst'], yearMin: 1995, yearMax: 2005, hp: 205 },
  { make: ['mitsubishi'], model: ['3000gt vr-4', '3000gt', '3000 gt'], trim: ['vr-4', 'vr4'], yearMin: 1991, hp: 320 },

  // ── ALFA ROMEO ────────────────────────────────────────────────────────────
  { make: ['alfa romeo', 'alfa'], model: ['giulia'], trim: ['gta', 'gtam'], yearMin: 2021, hp: 533 },
  { make: ['alfa romeo', 'alfa'], model: ['giulia'], trim: ['quadrifoglio', 'qv'], yearMin: 2017, hp: 505 },
  { make: ['alfa romeo', 'alfa'], model: ['giulia'], trim: ['ti sport', 'sprint', 'veloce'], yearMin: 2017, hp: 280 },
  { make: ['alfa romeo', 'alfa'], model: ['stelvio'], trim: ['quadrifoglio', 'qv'], yearMin: 2018, hp: 505 },

  // ── JAGUAR / LAND ROVER ───────────────────────────────────────────────────
  { make: ['jaguar'], model: ['f-type', 'ftype', 'f type'], trim: ['r', 'svr'], yearMin: 2016, hp: 575 },
  { make: ['jaguar'], model: ['f-type', 'ftype', 'f type'], trim: ['r-dynamic', 's', 'p450'], yearMin: 2016, hp: 444 },
  { make: ['jaguar'], model: ['f-type', 'ftype', 'f type'], yearMin: 2014, hp: 340 },
  { make: ['land rover'], model: ['defender'], trim: ['v8 carpathian edition', 'v8 bond edition'], yearMin: 2022, hp: 518 },
  { make: ['land rover'], model: ['range rover sport'], trim: ['svr'], yearMin: 2018, hp: 575 },

  // ── MASERATI ──────────────────────────────────────────────────────────────
  { make: ['maserati'], model: ['ghibli'], trim: ['trofeo'], yearMin: 2021, hp: 580 },
  { make: ['maserati'], model: ['ghibli'], trim: ['s q4', 'gransport'], yearMin: 2014, hp: 404 },
  { make: ['maserati'], model: ['quattroporte'], trim: ['gts', 'trofeo'], yearMin: 2014, hp: 523 },
  { make: ['maserati'], model: ['granturismo'], trim: ['mc stradale', 'sport'], yearMin: 2010, hp: 444 },

  // ── TESLA (for completeness) ───────────────────────────────────────────────
  { make: ['tesla'], model: ['model s'], trim: ['plaid'], yearMin: 2021, hp: 1020 },
  { make: ['tesla'], model: ['model s'], trim: ['long range', 'performance'], yearMin: 2020, hp: 670 },
  { make: ['tesla'], model: ['model 3'], trim: ['performance'], yearMin: 2018, hp: 450 },
  { make: ['tesla'], model: ['model 3'], trim: ['long range'], yearMin: 2018, hp: 358 },
  { make: ['tesla'], model: ['model y'], trim: ['performance'], yearMin: 2020, hp: 456 },
  { make: ['tesla'], model: ['cybertruck'], trim: ['cyberbeast', 'all-wheel drive'], yearMin: 2024, hp: 845 },

  // ── SCION ─────────────────────────────────────────────────────────────────
  { make: ['scion'], model: ['fr-s', 'frs'], yearMin: 2013, yearMax: 2016, hp: 200 },
  { make: ['scion'], model: ['tc'], yearMin: 2011, yearMax: 2016, hp: 179 },
  { make: ['scion'], model: ['xb'], yearMin: 2008, yearMax: 2015, hp: 158 },

  // ── FORD (additional / classic) ───────────────────────────────────────────
  { make: ['ford'], model: ['mustang'], trim: ['cobra r', 'svt cobra r'], yearMin: 2000, yearMax: 2000, hp: 385 },
  { make: ['ford'], model: ['mustang'], trim: ['svt cobra', 'terminator cobra'], yearMin: 2003, yearMax: 2004, hp: 390 },
  { make: ['ford'], model: ['mustang'], trim: ['gt500', 'shelby gt500'], yearMin: 2007, yearMax: 2012, hp: 550 },
  { make: ['ford'], model: ['mustang'], trim: ['gt'], yearMin: 2005, yearMax: 2010, hp: 300 },
  { make: ['ford'], model: ['mustang'], trim: ['v6'], yearMin: 2005, yearMax: 2010, hp: 210 },
  { make: ['ford'], model: ['mustang'], trim: ['cobra', 'svt cobra'], yearMin: 1999, yearMax: 2002, hp: 320 },
  { make: ['ford'], model: ['lightning', 'f-150 lightning', 'svt lightning'], trim: ['svt'], yearMin: 1999, yearMax: 2004, hp: 380 },
  { make: ['ford'], model: ['gt', 'ford gt'], yearMin: 2017, hp: 647 },
  { make: ['ford'], model: ['gt', 'ford gt'], yearMin: 2005, yearMax: 2006, hp: 550 },
  { make: ['ford'], model: ['maverick'], trim: ['tremor'], yearMin: 2022, hp: 250 },
  { make: ['ford'], model: ['ranger'], trim: ['raptor'], yearMin: 2024, hp: 405 },
  { make: ['ford'], model: ['escape'], trim: ['st', 'st-line'], yearMin: 2020, hp: 250 },
  { make: ['ford'], model: ['edge st', 'edge'], trim: ['st'], yearMin: 2019, hp: 335 },
  { make: ['ford'], model: ['expedition'], trim: ['stealth performance edition'], yearMin: 2023, hp: 440 },

  // ── CHEVROLET (additional / classic) ─────────────────────────────────────
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['z28', 'z/28'], yearMin: 1998, yearMax: 2002, hp: 310 },
  { make: ['chevrolet', 'chevy'], model: ['camaro'], trim: ['ss'], yearMin: 1998, yearMax: 2002, hp: 320 },
  { make: ['chevrolet', 'chevy'], model: ['monte carlo'], trim: ['ss', 'supercharged'], yearMin: 2000, yearMax: 2005, hp: 240 },
  { make: ['chevrolet', 'chevy'], model: ['cobalt'], trim: ['ss supercharged', 'ss turbocharged', 'ss'], yearMin: 2005, yearMax: 2010, hp: 260 },
  { make: ['chevrolet', 'chevy'], model: ['sonic'], trim: ['rs'], yearMin: 2012, yearMax: 2019, hp: 138 },
  { make: ['chevrolet', 'chevy'], model: ['cruze'], trim: ['rs', 'premier'], yearMin: 2012, hp: 153 },
  { make: ['chevrolet', 'chevy'], model: ['trailblazer'], trim: ['rs', 'activ'], yearMin: 2021, hp: 155 },
  { make: ['chevrolet', 'chevy'], model: ['blazer'], trim: ['rs', 'ss'], yearMin: 2019, hp: 308 },
  { make: ['chevrolet', 'chevy'], model: ['equinox'], trim: ['rs'], yearMin: 2018, hp: 252 },
  { make: ['chevrolet', 'chevy'], model: ['traverse'], trim: ['rs', 'high country'], yearMin: 2018, hp: 310 },
  { make: ['chevrolet', 'chevy', 'gmc'], model: ['colorado', 'canyon'], trim: ['zr2'], yearMin: 2017, yearMax: 2022, hp: 308 },

  // ── DODGE / RAM (additional) ──────────────────────────────────────────────
  { make: ['dodge'], model: ['neon'], trim: ['srt-4', 'srt4'], yearMin: 2003, yearMax: 2005, hp: 230 },
  { make: ['dodge'], model: ['caliber'], trim: ['srt-4', 'srt4'], yearMin: 2008, yearMax: 2009, hp: 285 },
  { make: ['dodge'], model: ['avenger'], trim: ['se', 'sxt', 'r/t'], yearMin: 2008, hp: 283 },
  { make: ['ram'], model: ['1500 trx', 'ram trx', 'trx'], yearMin: 2021, hp: 702 },
  { make: ['ram'], model: ['2500', 'ram 2500'], trim: ['power wagon'], yearMin: 2016, hp: 410 },
  { make: ['jeep'], model: ['wrangler', 'jl wrangler', 'jk wrangler'], trim: ['rubicon 392', '392'], yearMin: 2021, hp: 470 },
  { make: ['jeep'], model: ['wrangler', 'gladiator'], trim: ['mojave', 'rubicon'], yearMin: 2020, hp: 285 },
  { make: ['jeep'], model: ['grand cherokee', 'trackhawk'], trim: ['trackhawk', 'srt', 'srt8'], yearMin: 2018, hp: 707 },
  { make: ['jeep'], model: ['grand cherokee'], trim: ['srt', 'srt8'], yearMin: 2012, yearMax: 2017, hp: 470 },

  // ── HONDA (additional) ────────────────────────────────────────────────────
  { make: ['honda'], model: ['prelude'], trim: ['type sh', 'sh'], yearMin: 1997, yearMax: 2001, hp: 200 },
  { make: ['honda'], model: ['prelude'], trim: ['si', 'si awd'], yearMin: 1992, yearMax: 1996, hp: 190 },
  { make: ['honda'], model: ['del sol'], trim: ['vtec', 'sir'], yearMin: 1993, yearMax: 1997, hp: 160 },
  { make: ['honda'], model: ['crx'], trim: ['si', 'hf'], yearMin: 1988, yearMax: 1991, hp: 108 },
  { make: ['honda'], model: ['fit'], trim: ['sport', 'ge8'], yearMin: 2009, yearMax: 2014, hp: 117 },
  { make: ['honda'], model: ['element'], yearMin: 2003, yearMax: 2011, hp: 166 },
  { make: ['honda'], model: ['cr-z', 'crz'], trim: ['sport', 'ex'], yearMin: 2011, yearMax: 2016, hp: 122 },
  { make: ['honda'], model: ['pilot'], trim: ['type r'], yearMin: 2023, hp: 285 },
  { make: ['honda'], model: ['ridgeline'], trim: ['black edition', 'rtl-e'], yearMin: 2017, hp: 280 },
  { make: ['honda'], model: ['hrv'], trim: ['sport'], yearMin: 2023, hp: 158 },

  // ── ACURA (additional) ────────────────────────────────────────────────────
  { make: ['acura'], model: ['legend'], trim: ['l', 'gs'], yearMin: 1990, yearMax: 1995, hp: 230 },
  { make: ['acura'], model: ['vigor'], yearMin: 1992, yearMax: 1994, hp: 176 },
  { make: ['acura'], model: ['cl'], trim: ['type s'], yearMin: 2001, yearMax: 2003, hp: 260 },
  { make: ['acura'], model: ['tl'], trim: ['type s', 'sh-awd'], yearMin: 2007, yearMax: 2014, hp: 305 },
  { make: ['acura'], model: ['tsx'], trim: ['v6'], yearMin: 2010, yearMax: 2014, hp: 280 },
  { make: ['acura'], model: ['mdx'], trim: ['pmc edition', 'type s'], yearMin: 2022, hp: 355 },
  { make: ['acura'], model: ['zdx'], trim: ['type s'], yearMin: 2024, hp: 500 },

  // ── TOYOTA (additional / classic) ─────────────────────────────────────────
  { make: ['toyota'], model: ['celica'], trim: ['gt-s', 'gts', 'gt four'], yearMin: 2000, yearMax: 2005, hp: 180 },
  { make: ['toyota'], model: ['celica'], trim: ['all-trac', 'gt-four', 'st205'], yearMin: 1994, yearMax: 1999, hp: 255 },
  { make: ['toyota'], model: ['mr2', 'mr-2'], trim: ['turbo', 'sw20 turbo'], yearMin: 1991, yearMax: 1995, hp: 200 },
  { make: ['toyota'], model: ['mr2', 'mr-2', 'mr2 spyder'], yearMin: 2000, yearMax: 2005, hp: 138 },
  { make: ['toyota'], model: ['corolla'], trim: ['apex', 'xse'], yearMin: 2021, hp: 169 },
  { make: ['toyota'], model: ['hilux', 'hi-lux'], trim: ['gr sport', 'gr'], yearMin: 2022, hp: 224 },
  { make: ['toyota'], model: ['fj cruiser'], yearMin: 2006, yearMax: 2014, hp: 239 },
  { make: ['toyota'], model: ['prius'], trim: ['prime', 'phev'], yearMin: 2023, hp: 220 },
  { make: ['toyota'], model: ['venza'], trim: ['xle', 'limited'], yearMin: 2021, hp: 219 },
  { make: ['toyota'], model: ['crown'], trim: ['sport', 'platinum'], yearMin: 2023, hp: 340 },

  // ── LEXUS (additional) ────────────────────────────────────────────────────
  { make: ['lexus'], model: ['sc 300', 'sc300', 'sc400', 'sc 400'], yearMin: 1992, yearMax: 2000, hp: 225 },
  { make: ['lexus'], model: ['is 300', 'is300', 'altezza'], yearMin: 2001, yearMax: 2005, hp: 215 },
  { make: ['lexus'], model: ['gs 300', 'gs300', 'gs350', 'gs 350'], trim: ['f sport'], yearMin: 2006, hp: 311 },
  { make: ['lexus'], model: ['ux 300h', 'ux'], trim: ['f sport'], yearMin: 2019, hp: 181 },
  { make: ['lexus'], model: ['nx 350', 'nx'], trim: ['f sport', 'overtrail'], yearMin: 2022, hp: 275 },

  // ── BMW (additional / classic) ────────────────────────────────────────────
  { make: ['bmw'], model: ['m roadster', 'm coupe', 'z3 m'], yearMin: 1998, yearMax: 2002, hp: 315 },
  { make: ['bmw'], model: ['z4 m', 'z4m'], yearMin: 2006, yearMax: 2008, hp: 330 },
  { make: ['bmw'], model: ['z4'], trim: ['m40i', 'sdrive m40i'], yearMin: 2019, hp: 382 },
  { make: ['bmw'], model: ['z4'], trim: ['sdrive30i', '30i'], yearMin: 2019, hp: 255 },
  { make: ['bmw'], model: ['e46 m3', 'm3'], yearMin: 2001, yearMax: 2006, hp: 333 },
  { make: ['bmw'], model: ['e36 m3', 'm3'], yearMin: 1995, yearMax: 1999, hp: 240 },
  { make: ['bmw'], model: ['128i', '128', '125i'], yearMin: 2008, yearMax: 2013, hp: 230 },
  { make: ['bmw'], model: ['228i', '228', '230i', '230'], yearMin: 2014, hp: 248 },
  { make: ['bmw'], model: ['440i', '440'], yearMin: 2016, hp: 322 },
  { make: ['bmw'], model: ['550i', '550'], yearMin: 2011, hp: 400 },
  { make: ['bmw'], model: ['650i', '650'], yearMin: 2012, hp: 445 },
  { make: ['bmw'], model: ['750i', '750'], yearMin: 2016, hp: 445 },
  { make: ['bmw'], model: ['x3m', 'x4m'], trim: ['competition'], yearMin: 2020, hp: 503 },
  { make: ['bmw'], model: ['x3m', 'x4m'], yearMin: 2020, hp: 473 },
  { make: ['bmw'], model: ['x3', 'x4'], trim: ['m40i', 'xdrive m40i'], yearMin: 2019, hp: 382 },
  { make: ['bmw'], model: ['ix m60', 'ix'], trim: ['m60', 'xdrive50'], yearMin: 2022, hp: 610 },

  // ── MERCEDES-BENZ (additional) ────────────────────────────────────────────
  { make: ['mercedes', 'mercedes-benz'], model: ['slk 55', 'slk55', 'slk 55 amg'], yearMin: 2005, hp: 355 },
  { make: ['mercedes', 'mercedes-benz'], model: ['sl 63', 'sl63', 'sl 63 amg'], yearMin: 2012, hp: 537 },
  { make: ['mercedes', 'mercedes-benz'], model: ['cls 63', 'cls63', 'cls 63 amg'], yearMin: 2012, hp: 550 },
  { make: ['mercedes', 'mercedes-benz'], model: ['c55', 'c 55 amg', 'c55 amg'], yearMin: 2005, yearMax: 2007, hp: 362 },
  { make: ['mercedes', 'mercedes-benz'], model: ['c36', 'c 36 amg', 'c36 amg'], yearMin: 1995, yearMax: 1997, hp: 276 },
  { make: ['mercedes', 'mercedes-benz'], model: ['gle 63', 'gle63', 'gle 63 amg'], yearMin: 2016, hp: 550 },
  { make: ['mercedes', 'mercedes-benz'], model: ['ml 63', 'ml63', 'ml 63 amg'], yearMin: 2007, hp: 503 },
  { make: ['mercedes', 'mercedes-benz'], model: ['gls 63', 'gls63 amg'], yearMin: 2021, hp: 603 },
  { make: ['mercedes', 'mercedes-benz'], model: ['s63', 's 63 amg'], yearMin: 2018, hp: 603 },
  { make: ['mercedes', 'mercedes-benz'], model: ['cla 45', 'cla45'], trim: ['s amg', 'amg'], yearMin: 2020, hp: 416 },
  { make: ['mercedes', 'mercedes-benz'], model: ['eqe amg', 'eqe 53'], trim: ['53 amg+'], yearMin: 2023, hp: 677 },

  // ── AUDI (additional / classic) ───────────────────────────────────────────
  { make: ['audi'], model: ['rs2', 'rs 2'], yearMin: 1994, yearMax: 1995, hp: 311 },
  { make: ['audi'], model: ['s2', 's 2', 'coupe s2'], yearMin: 1991, yearMax: 1995, hp: 217 },
  { make: ['audi'], model: ['rs4', 'rs 4', 'b5 rs4'], yearMin: 2000, yearMax: 2001, hp: 380 },
  { make: ['audi'], model: ['quattro', 'ur-quattro', 'ur quattro'], yearMin: 1980, yearMax: 1991, hp: 220 },
  { make: ['audi'], model: ['e-tron gt', 'etron gt'], yearMin: 2022, hp: 522 },
  { make: ['audi'], model: ['sq7', 'sq 7', 'sq8', 'sq 8'], yearMin: 2021, hp: 500 },
  { make: ['audi'], model: ['rs q8', 'rsq8'], yearMin: 2020, hp: 591 },
  { make: ['audi'], model: ['s5 sportback', 's5'], trim: ['sportback'], yearMin: 2018, hp: 349 },
  { make: ['audi'], model: ['allroad', 'a6 allroad'], yearMin: 2020, hp: 335 },

  // ── VOLKSWAGEN (additional) ───────────────────────────────────────────────
  { make: ['volkswagen', 'vw'], model: ['scirocco r', 'scirocco'], trim: ['r'], yearMin: 2010, hp: 265 },
  { make: ['volkswagen', 'vw'], model: ['golf', 'mk4 golf', 'mk5 golf'], trim: ['r32'], yearMin: 2004, hp: 237 },
  { make: ['volkswagen', 'vw'], model: ['passat', 'b5 passat'], trim: ['w8', '4motion'], yearMin: 2002, yearMax: 2004, hp: 270 },
  { make: ['volkswagen', 'vw'], model: ['tiguan'], trim: ['r-line', 'sel premium'], yearMin: 2018, hp: 184 },
  { make: ['volkswagen', 'vw'], model: ['id.4', 'id4'], trim: ['awd pro s', 'pro s'], yearMin: 2022, hp: 295 },
  { make: ['volkswagen', 'vw'], model: ['touareg'], trim: ['r'], yearMin: 2020, hp: 456 },
  { make: ['volkswagen', 'vw'], model: ['polo gti', 'polo'], trim: ['gti'], yearMin: 2018, hp: 207 },

  // ── PORSCHE (additional) ──────────────────────────────────────────────────
  { make: ['porsche'], model: ['taycan'], trim: ['turbo s cross turismo', 'turbo s'], yearMin: 2021, hp: 750 },
  { make: ['porsche'], model: ['taycan'], trim: ['turbo', '4s'], yearMin: 2020, hp: 616 },
  { make: ['porsche'], model: ['macan'], trim: ['turbo'], yearMin: 2015, yearMax: 2019, hp: 400 },
  { make: ['porsche'], model: ['panamera'], trim: ['turbo s e-hybrid'], yearMin: 2018, hp: 680 },
  { make: ['porsche'], model: ['panamera'], trim: ['gts'], yearMin: 2018, hp: 453 },
  { make: ['porsche'], model: ['718 boxster', 'boxster'], trim: ['spyder rs', 'spyder'], yearMin: 2020, hp: 414 },
  { make: ['porsche'], model: ['718 boxster', 'boxster'], trim: ['s', 'gts'], yearMin: 2017, hp: 350 },
  { make: ['porsche'], model: ['944'], trim: ['turbo', 'turbo s'], yearMin: 1985, yearMax: 1991, hp: 250 },
  { make: ['porsche'], model: ['993', '911'], trim: ['turbo', 'turbo s'], yearMin: 1994, yearMax: 1998, hp: 408 },
  { make: ['porsche'], model: ['996', '911'], trim: ['turbo', 'turbo s', 'gt2'], yearMin: 1999, yearMax: 2004, hp: 415 },

  // ── NISSAN (additional / classic) ─────────────────────────────────────────
  { make: ['nissan'], model: ['skyline', 'r33', 'bnr33'], trim: ['gt-r', 'gtr', 'v-spec'], yearMin: 1995, yearMax: 1998, hp: 276 },
  { make: ['nissan'], model: ['skyline', 'r32', 'bnr32'], trim: ['gt-r', 'gtr', 'v-spec'], yearMin: 1989, yearMax: 1994, hp: 276 },
  { make: ['nissan'], model: ['silvia', 's15'], trim: ['spec r', 'varietta'], yearMin: 1999, yearMax: 2002, hp: 247 },
  { make: ['nissan'], model: ['silvia', 's14'], trim: ['kouki', 'zenki', 'spec s', 'spec r'], yearMin: 1994, yearMax: 1999, hp: 220 },
  { make: ['nissan'], model: ['silvia', 's13', '240sx'], trim: ['k\'s', 'q\'s'], yearMin: 1989, yearMax: 1994, hp: 205 },
  { make: ['nissan'], model: ['240sx'], yearMin: 1989, yearMax: 1998, hp: 155 },
  { make: ['nissan'], model: ['maxima'], trim: ['sr', 'sr midnight edition'], yearMin: 2016, hp: 300 },
  { make: ['nissan'], model: ['sentra'], trim: ['se-r spec v', 'spec v'], yearMin: 2007, yearMax: 2012, hp: 200 },
  { make: ['nissan'], model: ['frontier'], trim: ['pro-4x', 'midnight edition'], yearMin: 2022, hp: 310 },
  { make: ['nissan'], model: ['pathfinder'], trim: ['rock creek', 'platinum'], yearMin: 2022, hp: 284 },
  { make: ['nissan'], model: ['armada'], trim: ['platinum', 'sl'], yearMin: 2017, hp: 390 },
  { make: ['nissan'], model: ['juke'], trim: ['nismo', 'nismo rs'], yearMin: 2013, yearMax: 2017, hp: 211 },

  // ── INFINITI (additional) ─────────────────────────────────────────────────
  { make: ['infiniti'], model: ['g35', 'g35x'], trim: ['sport', 'sedan', 'coupe'], yearMin: 2003, yearMax: 2007, hp: 298 },
  { make: ['infiniti'], model: ['g37', 'g37x', 'g37s'], yearMin: 2008, yearMax: 2013, hp: 330 },
  { make: ['infiniti'], model: ['q70', 'q70l', 'm37', 'm56'], trim: ['sport', 's hybrid'], yearMin: 2011, hp: 330 },
  { make: ['infiniti'], model: ['fx50', 'qx70'], trim: ['s premium', 'sport'], yearMin: 2009, hp: 390 },
  { make: ['infiniti'], model: ['qx80'], trim: ['sensory', 'luxe', 'autograph'], yearMin: 2018, hp: 400 },

  // ── MAZDA (additional) ────────────────────────────────────────────────────
  { make: ['mazda'], model: ['3', 'mazda3', 'mazda 3'], trim: ['turbo', 'premium plus turbo'], yearMin: 2021, hp: 250 },
  { make: ['mazda'], model: ['6', 'mazda6', 'mazda 6'], trim: ['grand touring', 'signature'], yearMin: 2014, hp: 184 },
  { make: ['mazda'], model: ['cx-30', 'cx30'], trim: ['turbo'], yearMin: 2021, hp: 250 },
  { make: ['mazda'], model: ['cx-9', 'cx9'], trim: ['carbon edition', 'signature'], yearMin: 2016, hp: 250 },
  { make: ['mazda'], model: ['cx-50', 'cx50'], trim: ['turbo', 'meridian edition'], yearMin: 2023, hp: 256 },
  { make: ['mazda'], model: ['speed3', 'mazdaspeed3', 'mazdaspeed 3'], yearMin: 2007, yearMax: 2013, hp: 263 },
  { make: ['mazda'], model: ['323', 'familia', '323 turbo', 'bp6d'], trim: ['gt-r', 'gtr', 'astina'], yearMin: 1992, yearMax: 1994, hp: 210 },
  { make: ['mazda'], model: ['rotary', 'rx-4', 'rx-3', 'rx-2'], yearMin: 1969, yearMax: 1977, hp: 130 },

  // ── MITSUBISHI (additional) ───────────────────────────────────────────────
  { make: ['mitsubishi'], model: ['galant vr-4', 'galant'], trim: ['vr-4', 'vr4'], yearMin: 1991, yearMax: 1998, hp: 230 },
  { make: ['mitsubishi'], model: ['eclipse'], trim: ['gst', 'gsx', 'spyder gst'], yearMin: 2000, yearMax: 2005, hp: 210 },
  { make: ['mitsubishi'], model: ['eclipse cross'], trim: ['se', 'sel'], yearMin: 2018, hp: 152 },
  { make: ['mitsubishi'], model: ['outlander sport', 'rvr'], trim: ['se', 'gt'], yearMin: 2020, hp: 148 },
  { make: ['mitsubishi'], model: ['starion turbo', 'starion'], yearMin: 1983, yearMax: 1989, hp: 175 },

  // ── SUBARU (additional) ───────────────────────────────────────────────────
  { make: ['subaru'], model: ['impreza'], trim: ['sti', 'wrx sti'], yearMin: 2004, yearMax: 2007, hp: 293 },
  { make: ['subaru'], model: ['impreza'], trim: ['wrx', '2.5rs', '2.5 rs'], yearMin: 2002, yearMax: 2007, hp: 227 },
  { make: ['subaru'], model: ['baja'], trim: ['turbo'], yearMin: 2003, yearMax: 2006, hp: 210 },
  { make: ['subaru'], model: ['solterra'], yearMin: 2023, hp: 215 },
  { make: ['subaru'], model: ['crosstrek'], trim: ['limited', 'sport hybrid'], yearMin: 2021, hp: 152 },

  // ── HYUNDAI (additional) ──────────────────────────────────────────────────
  { make: ['hyundai'], model: ['ioniq 5 n', 'ioniq 5'], trim: ['n', 'awd'], yearMin: 2024, hp: 641 },
  { make: ['hyundai'], model: ['ioniq 6'], trim: ['se standard range', 'awd'], yearMin: 2023, hp: 320 },
  { make: ['hyundai'], model: ['kona n', 'kona'], trim: ['n', 'n line'], yearMin: 2022, hp: 276 },
  { make: ['hyundai'], model: ['santa fe'], trim: ['xrt', 'calligraphy'], yearMin: 2021, hp: 277 },
  { make: ['hyundai'], model: ['palisade'], trim: ['xrt', 'calligraphy'], yearMin: 2020, hp: 291 },
  { make: ['hyundai'], model: ['tucson'], trim: ['hybrid', 'phev'], yearMin: 2022, hp: 261 },
  { make: ['hyundai'], model: ['accent'], trim: ['sport'], yearMin: 2018, hp: 130 },

  // ── KIA (additional) ──────────────────────────────────────────────────────
  { make: ['kia'], model: ['ev6 gt', 'ev6'], trim: ['gt', 'gt-line awd'], yearMin: 2023, hp: 576 },
  { make: ['kia'], model: ['k5'], trim: ['gt', 'gt-line'], yearMin: 2021, hp: 290 },
  { make: ['kia'], model: ['sportage'], trim: ['x-line', 'plug-in hybrid'], yearMin: 2023, hp: 261 },
  { make: ['kia'], model: ['sorento'], trim: ['sx', 'x-line'], yearMin: 2021, hp: 281 },
  { make: ['kia'], model: ['telluride'], trim: ['x-pro', 'nightfall'], yearMin: 2020, hp: 291 },
  { make: ['kia'], model: ['forte'], trim: ['gt', 'gt-line'], yearMin: 2019, hp: 201 },
  { make: ['kia'], model: ['soul'], trim: ['gt-line', 'exclaim'], yearMin: 2020, hp: 147 },

  // ── GENESIS (additional) ──────────────────────────────────────────────────
  { make: ['genesis'], model: ['g90'], trim: ['5.0 ultimate', '3.3t awd'], yearMin: 2017, hp: 420 },
  { make: ['genesis'], model: ['g80'], trim: ['sport 3.5t'], yearMin: 2021, hp: 375 },
  { make: ['genesis'], model: ['gv80'], trim: ['prestige 3.5t'], yearMin: 2021, hp: 375 },
  { make: ['genesis'], model: ['gv70'], trim: ['sport 2.5t', 'electrified'], yearMin: 2022, hp: 300 },

  // ── ALFA ROMEO (additional) ───────────────────────────────────────────────
  { make: ['alfa romeo', 'alfa'], model: ['4c'], trim: ['launch edition', 'spider'], yearMin: 2015, hp: 237 },
  { make: ['alfa romeo', 'alfa'], model: ['33 stradale'], yearMin: 2023, hp: 620 },
  { make: ['alfa romeo', 'alfa'], model: ['mito'], trim: ['veloce', 'cloverleaf'], yearMin: 2013, hp: 170 },
  { make: ['alfa romeo', 'alfa'], model: ['156'], trim: ['gta'], yearMin: 2002, yearMax: 2005, hp: 250 },
  { make: ['alfa romeo', 'alfa'], model: ['147'], trim: ['gta'], yearMin: 2003, yearMax: 2005, hp: 247 },

  // ── FERRARI ───────────────────────────────────────────────────────────────
  { make: ['ferrari'], model: ['sf90 stradale', 'sf90'], trim: ['assetto fiorano'], yearMin: 2021, hp: 986 },
  { make: ['ferrari'], model: ['sf90 stradale', 'sf90'], yearMin: 2020, hp: 986 },
  { make: ['ferrari'], model: ['296 gtb', '296'], yearMin: 2022, hp: 819 },
  { make: ['ferrari'], model: ['f8 tributo', 'f8'], yearMin: 2020, hp: 710 },
  { make: ['ferrari'], model: ['812 superfast', '812', '812 gts'], yearMin: 2017, hp: 789 },
  { make: ['ferrari'], model: ['roma'], yearMin: 2021, hp: 612 },
  { make: ['ferrari'], model: ['488 gtb', '488', '488 spider', '488 pista'], yearMin: 2015, hp: 660 },
  { make: ['ferrari'], model: ['458 italia', '458', '458 spider', '458 speciale'], yearMin: 2010, hp: 562 },
  { make: ['ferrari'], model: ['california t', 'california'], yearMin: 2012, hp: 552 },
  { make: ['ferrari'], model: ['f430', 'f 430'], trim: ['scuderia', '16m'], yearMin: 2007, hp: 503 },
  { make: ['ferrari'], model: ['f430', 'f 430'], yearMin: 2005, yearMax: 2009, hp: 483 },
  { make: ['ferrari'], model: ['360 modena', '360', '360 spider'], yearMin: 1999, yearMax: 2005, hp: 395 },

  // ── LAMBORGHINI ───────────────────────────────────────────────────────────
  { make: ['lamborghini', 'lambo'], model: ['revuelto', 'countach lpi 800-4'], yearMin: 2023, hp: 1001 },
  { make: ['lamborghini', 'lambo'], model: ['urus'], trim: ['performante', 's'], yearMin: 2023, hp: 657 },
  { make: ['lamborghini', 'lambo'], model: ['urus'], yearMin: 2019, hp: 641 },
  { make: ['lamborghini', 'lambo'], model: ['huracán', 'huracan'], trim: ['sto', 'performante', 'super trofeo'], yearMin: 2018, hp: 630 },
  { make: ['lamborghini', 'lambo'], model: ['huracán', 'huracan'], yearMin: 2014, hp: 610 },
  { make: ['lamborghini', 'lambo'], model: ['aventador', 'aventador s', 'aventador svj'], trim: ['svj'], yearMin: 2018, hp: 759 },
  { make: ['lamborghini', 'lambo'], model: ['aventador', 'aventador s'], yearMin: 2011, hp: 700 },
  { make: ['lamborghini', 'lambo'], model: ['gallardo'], trim: ['superleggera', 'squadra corse'], yearMin: 2007, hp: 562 },
  { make: ['lamborghini', 'lambo'], model: ['gallardo'], yearMin: 2003, yearMax: 2013, hp: 493 },

  // ── McLAREN ───────────────────────────────────────────────────────────────
  { make: ['mclaren'], model: ['p1'], yearMin: 2014, yearMax: 2015, hp: 903 },
  { make: ['mclaren'], model: ['765lt', '765 lt'], yearMin: 2021, hp: 755 },
  { make: ['mclaren'], model: ['720s', '720 s'], yearMin: 2017, hp: 710 },
  { make: ['mclaren'], model: ['600lt', '600 lt'], yearMin: 2019, hp: 592 },
  { make: ['mclaren'], model: ['570s', '570 s', '570gt', '570 gt'], yearMin: 2016, hp: 562 },
  { make: ['mclaren'], model: ['artura'], yearMin: 2023, hp: 671 },
  { make: ['mclaren'], model: ['mp4-12c', '12c'], yearMin: 2012, yearMax: 2014, hp: 616 },

  // ── ASTON MARTIN ──────────────────────────────────────────────────────────
  { make: ['aston martin'], model: ['vantage'], trim: ['f1 edition', 'amr'], yearMin: 2021, hp: 528 },
  { make: ['aston martin'], model: ['vantage'], yearMin: 2018, hp: 503 },
  { make: ['aston martin'], model: ['db11'], trim: ['amr'], yearMin: 2018, hp: 630 },
  { make: ['aston martin'], model: ['db11'], yearMin: 2017, hp: 503 },
  { make: ['aston martin'], model: ['dbs superleggera', 'dbs'], yearMin: 2019, hp: 715 },
  { make: ['aston martin'], model: ['v12 vantage', 'v8 vantage'], trim: ['s', 'rs'], yearMin: 2012, hp: 430 },

  // ── BENTLEY ───────────────────────────────────────────────────────────────
  { make: ['bentley'], model: ['continental gt', 'continental gtc'], trim: ['speed', 'w12'], yearMin: 2018, hp: 635 },
  { make: ['bentley'], model: ['continental gt', 'continental gtc'], yearMin: 2018, hp: 542 },
  { make: ['bentley'], model: ['bentayga'], trim: ['speed', 'w12 speed'], yearMin: 2020, hp: 626 },

  // ── ROLLS-ROYCE ───────────────────────────────────────────────────────────
  { make: ['rolls-royce', 'rolls royce'], model: ['black badge ghost', 'ghost'], trim: ['black badge'], yearMin: 2021, hp: 591 },
  { make: ['rolls-royce', 'rolls royce'], model: ['ghost'], yearMin: 2021, hp: 563 },
  { make: ['rolls-royce', 'rolls royce'], model: ['wraith', 'dawn'], trim: ['black badge'], yearMin: 2015, hp: 624 },

  // ── LAND ROVER / RANGE ROVER (additional) ─────────────────────────────────
  { make: ['land rover'], model: ['defender 130', 'defender 110', 'defender 90'], trim: ['v8', 'carpathian edition'], yearMin: 2022, hp: 518 },
  { make: ['land rover'], model: ['discovery'], trim: ['r-dynamic hse', 'metropolitan edition'], yearMin: 2021, hp: 355 },
  { make: ['land rover'], model: ['range rover'], trim: ['sv autobiography', 'autobiography long'], yearMin: 2023, hp: 523 },
  { make: ['land rover'], model: ['range rover sport'], trim: ['p530 first edition', 'p400e'], yearMin: 2023, hp: 523 },
  { make: ['land rover'], model: ['range rover velar'], trim: ['r-dynamic black', 'p380 hse'], yearMin: 2018, hp: 380 },

  // ── JAGUAR (additional) ───────────────────────────────────────────────────
  { make: ['jaguar'], model: ['xe'], trim: ['300 sport', 'r-dynamic black'], yearMin: 2017, hp: 296 },
  { make: ['jaguar'], model: ['xe'], trim: ['sv project 8'], yearMin: 2018, hp: 592 },
  { make: ['jaguar'], model: ['xf'], trim: ['sport', 'r-sport'], yearMin: 2016, hp: 296 },
  { make: ['jaguar'], model: ['xj'], trim: ['xjl portfolio', 'supercharged'], yearMin: 2011, hp: 470 },
  { make: ['jaguar'], model: ['e-pace'], trim: ['r-dynamic hse', 's'], yearMin: 2018, hp: 296 },

  // ── MASERATI (additional) ─────────────────────────────────────────────────
  { make: ['maserati'], model: ['mc20'], yearMin: 2022, hp: 621 },
  { make: ['maserati'], model: ['grancabrio'], trim: ['sport'], yearMin: 2011, hp: 444 },
  { make: ['maserati'], model: ['levante'], trim: ['trofeo'], yearMin: 2019, hp: 580 },
  { make: ['maserati'], model: ['levante'], trim: ['gts'], yearMin: 2017, hp: 424 },

  // ── GMC ───────────────────────────────────────────────────────────────────
  { make: ['gmc'], model: ['typhoon'], yearMin: 1992, yearMax: 1993, hp: 280 },
  { make: ['gmc'], model: ['syclone'], yearMin: 1991, yearMax: 1991, hp: 280 },
  { make: ['gmc'], model: ['sierra'], trim: ['denali ultimate', 'at4x aev'], yearMin: 2022, hp: 420 },
  { make: ['gmc'], model: ['yukon'], trim: ['denali ultimate', 'at4'], yearMin: 2021, hp: 420 },
  { make: ['gmc'], model: ['canyon'], trim: ['at4x', 'denali'], yearMin: 2023, hp: 310 },
  { make: ['gmc'], model: ['hummer ev', 'hummer'], trim: ['edition 1', '3x'], yearMin: 2022, hp: 1000 },

  // ── BUICK ─────────────────────────────────────────────────────────────────
  { make: ['buick'], model: ['grand national', 'regal'], trim: ['grand national', 'gnx'], yearMin: 1987, yearMax: 1987, hp: 245 },
  { make: ['buick'], model: ['regal gs', 'regal'], trim: ['gs', 'sportback gs'], yearMin: 2018, hp: 310 },

  // ── CADILLAC ──────────────────────────────────────────────────────────────
  { make: ['cadillac'], model: ['cts-v', 'cts v'], trim: ['coupe', 'wagon', 'sedan'], yearMin: 2016, hp: 640 },
  { make: ['cadillac'], model: ['cts-v', 'cts v'], yearMin: 2009, yearMax: 2015, hp: 556 },
  { make: ['cadillac'], model: ['ct5-v', 'ct5 v'], trim: ['blackwing'], yearMin: 2022, hp: 668 },
  { make: ['cadillac'], model: ['ct5-v', 'ct5 v'], yearMin: 2020, hp: 360 },
  { make: ['cadillac'], model: ['ct4-v', 'ct4 v'], trim: ['blackwing'], yearMin: 2022, hp: 472 },
  { make: ['cadillac'], model: ['ct4-v', 'ct4 v'], yearMin: 2020, hp: 325 },
  { make: ['cadillac'], model: ['ats-v', 'ats v'], yearMin: 2016, hp: 464 },
  { make: ['cadillac'], model: ['escalade v', 'escalade-v'], trim: ['v'], yearMin: 2023, hp: 682 },
  { make: ['cadillac'], model: ['escalade'], trim: ['platinum', 'sport platinum'], yearMin: 2021, hp: 420 },
  { make: ['cadillac'], model: ['xlr-v', 'xlr v', 'xlr'], yearMin: 2006, yearMax: 2009, hp: 443 },

  // ── LINCOLN ───────────────────────────────────────────────────────────────
  { make: ['lincoln'], model: ['navigator'], trim: ['black label', 'reserve'], yearMin: 2018, hp: 450 },
  { make: ['lincoln'], model: ['aviator'], trim: ['grand touring', 'black label'], yearMin: 2020, hp: 494 },
  { make: ['lincoln'], model: ['mark viii', 'mark 8', 'marklt'], yearMin: 1993, yearMax: 1998, hp: 290 },

  // ── PONTIAC (classic) ─────────────────────────────────────────────────────
  { make: ['pontiac'], model: ['gto'], yearMin: 2004, yearMax: 2006, hp: 400 },
  { make: ['pontiac'], model: ['firebird', 'trans am'], trim: ['trans am', 'ws6', 'ram air'], yearMin: 1998, yearMax: 2002, hp: 325 },
  { make: ['pontiac'], model: ['firebird', 'formula', 'trans am'], trim: ['formula', 'firehawk'], yearMin: 1998, yearMax: 2002, hp: 305 },
  { make: ['pontiac'], model: ['g8'], trim: ['gxp', 'gt'], yearMin: 2008, yearMax: 2009, hp: 415 },
  { make: ['pontiac'], model: ['g8'], yearMin: 2008, yearMax: 2009, hp: 361 },
  { make: ['pontiac'], model: ['solstice gxp', 'solstice'], trim: ['gxp'], yearMin: 2007, hp: 260 },
  { make: ['pontiac'], model: ['vibe'], trim: ['gt', 'gxp'], yearMin: 2003, hp: 164 },

  // ── SATURN ────────────────────────────────────────────────────────────────
  { make: ['saturn'], model: ['sky redline', 'sky'], trim: ['red line', 'redline'], yearMin: 2007, hp: 260 },

  // ── SAAB ──────────────────────────────────────────────────────────────────
  { make: ['saab'], model: ['9-3', '9-3 aero'], trim: ['viggen', 'aero xs'], yearMin: 2003, yearMax: 2011, hp: 250 },
  { make: ['saab'], model: ['9-5 aero', '9-5'], trim: ['aero', 'hirsch'], yearMin: 2000, yearMax: 2011, hp: 260 },

  // ── VOLVO ─────────────────────────────────────────────────────────────────
  { make: ['volvo'], model: ['c30'], trim: ['r-design', 'polestar'], yearMin: 2010, yearMax: 2013, hp: 227 },
  { make: ['volvo'], model: ['s60'], trim: ['polestar', 'r-design t6'], yearMin: 2012, hp: 345 },
  { make: ['volvo'], model: ['v60'], trim: ['polestar'], yearMin: 2015, hp: 362 },
  { make: ['volvo'], model: ['xc40 recharge', 'xc40'], trim: ['recharge'], yearMin: 2021, hp: 402 },
  { make: ['volvo'], model: ['c40 recharge', 'c40'], yearMin: 2022, hp: 402 },

  // ── POLESTAR ──────────────────────────────────────────────────────────────
  { make: ['polestar'], model: ['1'], yearMin: 2020, hp: 619 },
  { make: ['polestar'], model: ['2'], trim: ['long range dual motor', 'performance pack'], yearMin: 2021, hp: 476 },
  { make: ['polestar'], model: ['3'], trim: ['long range dual motor performance'], yearMin: 2024, hp: 510 },

  // ── RIVIAN ────────────────────────────────────────────────────────────────
  { make: ['rivian'], model: ['r1t', 'r1s'], trim: ['launch edition', 'performance'], yearMin: 2022, hp: 835 },
  { make: ['rivian'], model: ['r1t', 'r1s'], trim: ['standard', 'adventure'], yearMin: 2022, hp: 533 },

  // ── LOTUS ─────────────────────────────────────────────────────────────────
  { make: ['lotus'], model: ['emira'], trim: ['v6 first edition', 'i4 first edition'], yearMin: 2023, hp: 400 },
  { make: ['lotus'], model: ['exige'], trim: ['cup 430', 'sport 410'], yearMin: 2017, hp: 430 },
  { make: ['lotus'], model: ['elise'], trim: ['cup 250', 'sport 220'], yearMin: 2015, hp: 250 },
  { make: ['lotus'], model: ['evija'], yearMin: 2021, hp: 1973 },

  // ── PAGANI ────────────────────────────────────────────────────────────────
  { make: ['pagani'], model: ['huayra'], trim: ['roadster bc', 'imola'], yearMin: 2016, hp: 791 },
  { make: ['pagani'], model: ['zonda'], trim: ['r', 'revolucion'], yearMin: 2009, hp: 750 },

  // ── BUGATTI ───────────────────────────────────────────────────────────────
  { make: ['bugatti'], model: ['chiron'], trim: ['super sport 300+', 'pur sport'], yearMin: 2019, hp: 1578 },
  { make: ['bugatti'], model: ['chiron'], yearMin: 2017, hp: 1479 },
  { make: ['bugatti'], model: ['veyron'], trim: ['super sport'], yearMin: 2010, hp: 1200 },
  { make: ['bugatti'], model: ['veyron'], yearMin: 2005, hp: 1001 },

  // ── KOENIGSEGG ────────────────────────────────────────────────────────────
  { make: ['koenigsegg'], model: ['jesko'], trim: ['absolut'], yearMin: 2022, hp: 1600 },
  { make: ['koenigsegg'], model: ['jesko'], yearMin: 2020, hp: 1280 },
  { make: ['koenigsegg'], model: ['agera'], trim: ['rs', 'final'], yearMin: 2016, hp: 1360 },
  { make: ['koenigsegg'], model: ['cc8s', 'ccr', 'ccx'], yearMin: 2002, hp: 806 },

]

function lookupStockHp(year: string, make: string, model: string, trim: string): number | null {
  const y = parseInt(year) || 0
  const mkL = make.toLowerCase()
  const mdBase = model.toLowerCase()
  const mdFull = (model + ' ' + trim).toLowerCase()

  let best: { score: number; hp: number } | null = null

  for (const row of STOCK_HP_TABLE) {
    if (!row.make.some(m => mkL.includes(m))) continue
    if (row.yearMin && y < row.yearMin) continue
    if (row.yearMax && y > row.yearMax) continue

    const modelMatch = row.model.some(m => mdBase.includes(m) || mdFull.includes(m))
    if (!modelMatch) continue

    let score = 1
    if (row.yearMin || row.yearMax) score++

    if (row.trim) {
      const trimMatch = row.trim.some(t => mdFull.includes(t))
      if (!trimMatch) continue
      score += 2
    }

    if (!best || score > best.score) best = { score, hp: row.hp }
  }

  return best?.hp ?? null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  parts: Part[]
  checked: Set<string>
  vehicle: { year: string; make: string; model: string; trim?: string; engine?: string }
}

function isTurboEngine(engine: string | undefined): boolean {
  if (!engine) return false
  return /\d+\.\d+[tT]\b/.test(engine) || engine.toLowerCase().includes('turbo')
}

export default function HpEstimator({ parts, checked, vehicle }: Props) {
  const guessed = useMemo(
    () => lookupStockHp(vehicle.year, vehicle.make, vehicle.model, vehicle.trim ?? ''),
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
  )

  const [stockHp, setStockHp] = useState<number | null>(guessed)
  const [editing, setEditing] = useState(guessed === null)
  const inputRef = useRef<HTMLInputElement>(null)

  const vehicleIsAlreadyTurbo = isTurboEngine(vehicle.engine)

  const hpParts = parts
    .filter(p => HP_PART_IDS.has(p.id) && parseGain(p.gainEstimate))
    .filter(p => !(p.id === 'turbo-kit' && vehicleIsAlreadyTurbo))
  const installedParts = hpParts.filter(p => checked.has(p.id))
  const plannedParts   = hpParts.filter(p => !checked.has(p.id))

  const base = stockHp ?? 0

  const iMin = installedParts.reduce((s, p) => s + (parseGain(p.gainEstimate)?.min ?? 0), 0)
  const iMax = installedParts.reduce((s, p) => s + (parseGain(p.gainEstimate)?.max ?? 0), 0)
  const pMin = plannedParts.reduce((s, p) => s + (parseGain(p.gainEstimate)?.min ?? 0), 0)
  const pMax = plannedParts.reduce((s, p) => s + (parseGain(p.gainEstimate)?.max ?? 0), 0)

  const totalMin = base + iMin + pMin
  const totalMax = base + iMax + pMax
  const barMax   = Math.max(totalMax * 1.06, base + 1)

  const stockPct    = (base / barMax) * 100
  const installedPct = (iMax / barMax) * 100
  const plannedPct   = (pMax / barMax) * 100

  const hasAnyGain = installedParts.length > 0 || plannedParts.length > 0

  function commitHp() {
    const val = parseInt(inputRef.current?.value ?? '')
    if (val > 0) { setStockHp(val); setEditing(false) }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f14 0%, #141420 100%)',
      border: '1px solid #2a2a38',
      borderRadius: 20,
      padding: '24px 28px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 160, height: 160, borderRadius: '50%',
        background: '#22c55e18', filter: 'blur(48px)',
        pointerEvents: 'none',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#52525b', margin: '0 0 4px' }}>
            Power Estimate
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            Horsepower Estimator
          </h3>
        </div>

        {stockHp !== null && !editing && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: hasAnyGain ? '#22c55e' : '#71717a', lineHeight: 1 }}>
              {hasAnyGain
                ? (totalMin === totalMax ? totalMin : `${totalMin}–${totalMax}`)
                : base}
            </div>
            <div style={{ fontSize: 10, color: '#52525b', marginTop: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {hasAnyGain ? 'est. whp w/ mods' : 'stock hp'}
            </div>
          </div>
        )}
      </div>

      {/* Stock HP entry form */}
      {editing && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#71717a', margin: '0 0 10px' }}>
            {guessed
              ? `We guessed ${guessed} hp from your vehicle — confirm or correct it:`
              : `We couldn't find stock HP for your ${vehicle.year} ${vehicle.make} ${vehicle.model}. Enter it below:`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="number"
              defaultValue={guessed ?? ''}
              min={50}
              max={2000}
              placeholder="e.g. 460"
              onKeyDown={e => e.key === 'Enter' && commitHp()}
              style={{
                flex: 1,
                background: '#0d0d12',
                border: '1px solid #2a2a38',
                borderRadius: 10,
                padding: '9px 14px',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <button
              onClick={commitHp}
              style={{
                background: '#7c3aed',
                border: 'none',
                borderRadius: 10,
                padding: '9px 20px',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Set HP
            </button>
          </div>
        </div>
      )}

      {/* Bar + breakdown */}
      {stockHp !== null && !editing && (
        <>
          {/* Stacked HP bar */}
          <div style={{ height: 36, borderRadius: 10, background: '#0a0a0e', overflow: 'hidden', display: 'flex', marginBottom: 14, position: 'relative' }}>
            {/* Stock */}
            <div style={{ width: `${stockPct}%`, background: '#3f3f46', flexShrink: 0, transition: 'width 0.5s ease' }} />
            {/* Installed */}
            {iMax > 0 && (
              <div style={{ width: `${installedPct}%`, background: 'linear-gradient(90deg,#15803d,#22c55e)', flexShrink: 0, transition: 'width 0.5s ease' }} />
            )}
            {/* Planned */}
            {pMax > 0 && (
              <div style={{
                width: `${plannedPct}%`, flexShrink: 0, transition: 'width 0.5s ease',
                backgroundImage: 'repeating-linear-gradient(55deg,#7c3aed 0,#7c3aed 5px,#4c1d95 5px,#4c1d95 10px)',
              }} />
            )}
            {/* Center label */}
            <span style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              pointerEvents: 'none',
            }}>
              {base} stock
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: hasAnyGain ? 16 : 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#71717a' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3f3f46', display: 'inline-block' }} />
              Stock ({base} hp)
            </span>
            {iMax > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#71717a' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
                Installed gains (+{iMin}–{iMax} hp)
              </span>
            )}
            {pMax > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#71717a' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#7c3aed', display: 'inline-block' }} />
                Planned gains (+{pMin}–{pMax} hp)
              </span>
            )}
          </div>

          {/* Per-part breakdown */}
          {hasAnyGain && (
            <div style={{
              background: '#0a0a0e', border: '1px solid #1f1f28',
              borderRadius: 12, padding: '12px 16px',
            }}>
              {[
                ...installedParts.map(p => ({ p, installed: true })),
                ...plannedParts.map(p => ({ p, installed: false })),
              ].map(({ p, installed }) => {
                const g = parseGain(p.gainEstimate)!
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: installed ? '#22c55e' : '#7c3aed', flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 13, color: installed ? '#d4d4d8' : '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      {!installed && <span style={{ fontSize: 10, color: '#3f3f46', letterSpacing: '0.1em' }}>PLANNED</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: installed ? '#22c55e' : '#9333ea', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      +{g.min}–{g.max} hp
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {!hasAnyGain && (
            <p style={{ fontSize: 12, color: '#3f3f46', margin: 0 }}>
              Check off power mods in your plan to see estimated gains here.
            </p>
          )}

          {vehicleIsAlreadyTurbo && parts.some(p => p.id === 'turbo-kit') && (
            <p style={{ fontSize: 11, color: '#52525b', margin: '8px 0 0' }}>
              Turbo kit estimate excluded — your engine already has forced induction. Upgrade gains vary significantly by platform.
            </p>
          )}

          {/* Footer */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 10, color: '#3f3f46', margin: 0 }}>
              Estimates based on typical dyno results. Actual gains vary.
            </p>
            <button
              onClick={() => setEditing(true)}
              style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Edit stock HP
            </button>
          </div>
        </>
      )}
    </div>
  )
}

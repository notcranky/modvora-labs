"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { loadVehicles, saveVehicle } from "@/lib/garage";

const services = [
  "Free Tier",
  "Premium Membership",
  "Premium Membership + 1 Extra Car Slot",
  "Expert Consultation",
  "Not sure yet",
];
const drivetrains = ["FWD", "RWD", "AWD", "4WD", "Unknown"];
const budgetRanges = ["Under $500", "$500–$1,000", "$1,000–$2,500", "$2,500–$5,000", "$5,000–$10,000", "$10,000+"];
const focusOptions = ["Performance", "Style", "Both", "Not sure yet"];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 36 }, (_, i) => String(currentYear - i));

const makeModels: Record<string, string[]> = {
  Acura: ["ILX", "Integra", "MDX", "NSX", "RDX", "RSX", "TL", "TLX", "TSX"],
  "Alfa Romeo": ["4C", "Giulia", "Giulia Quadrifoglio", "Stelvio", "Tonale"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "TT"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "M2", "M3", "M4", "M5", "M8", "X3", "X5", "X6", "Z4"],
  Buick: ["Enclave", "Encore", "Encore GX", "Envision", "LaCrosse", "Regal", "Regal GS"],
  Cadillac: ["ATS", "CT4", "CT5", "CTS", "Escalade", "Escalade ESV", "XT4", "XT5", "XT6"],
  Chevrolet: ["Blazer", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado 1500", "Silverado 2500HD", "Suburban", "Tahoe", "Traverse", "Trailblazer"],
  Chrysler: ["300", "Pacifica"],
  Dodge: ["Challenger", "Charger", "Dart", "Durango", "Journey", "Viper"],
  Ford: ["Bronco", "Bronco Sport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "F-350", "Fusion", "Maverick", "Mustang", "Ranger"],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Sierra 1500", "Sierra 2500HD", "Terrain", "Yukon", "Yukon XL"],
  Honda: ["Accord", "Civic", "Civic Type R", "CR-V", "CR-Z", "Fit", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline", "S2000"],
  Hyundai: ["Elantra", "Elantra N", "Genesis Coupe", "Kona", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Tucson", "Veloster", "Veloster N"],
  Infiniti: ["G35", "G37", "Q50", "Q60", "QX50", "QX60", "QX80"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L", "Renegade", "Wrangler"],
  Kia: ["Forte", "K5", "Seltos", "Soul", "Sportage", "Stinger", "Telluride"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "GS", "GX", "IS", "IS F", "LC", "LS", "LX", "NX", "RC", "RC F", "RX"],
  Mazda: ["CX-5", "CX-9", "Mazda3", "Mazda6", "Miata MX-5", "RX-7", "RX-8"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "C-Class", "CLA", "E-Class", "G-Class", "GLC", "GLE", "S-Class", "SL"],
  Mitsubishi: ["Eclipse Cross", "Galant", "Lancer", "Lancer Evolution", "Outlander"],
  Nissan: ["350Z", "370Z", "Altima", "Armada", "Frontier", "GT-R", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Z"],
  Porsche: ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera"],
  RAM: ["1500", "2500", "3500"],
  Scion: ["FR-S", "tC", "xB"],
  Subaru: ["BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX", "WRX STI"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["4Runner", "Avalon", "Camry", "Corolla", "FJ Cruiser", "GR86", "GR Corolla", "GR Supra", "Highlander", "Land Cruiser", "RAV4", "Sequoia", "Tacoma", "Tundra"],
  Volkswagen: ["Arteon", "Atlas", "Golf", "Golf GTI", "Golf R", "Jetta", "Passat", "Tiguan"],
  Volvo: ["S60", "S90", "V60", "XC40", "XC60", "XC90"],
};

const OTHER = "Other / Not Listed";

const trimData: Record<string, Record<string, string[]>> = {
  Acura: {
    RSX: ["Base", "Type-S"],
    TSX: ["Base", "V6", "Special Edition", "Tech Package"],
    TL: ["Base", "SH-AWD", "Type-S"],
    TLX: ["Base", "Technology", "A-Spec", "Type S", "Type S PMC Edition"],
    ILX: ["Base", "Premium", "Technology", "A-Spec"],
    NSX: ["Base", "Type S"],
    RDX: ["Base", "Technology", "A-Spec", "Advance", "PMC Edition"],
    MDX: ["Base", "Technology", "A-Spec", "Advance", "Type S", "Type S Advance"],
    Integra: ["Base", "A-Spec", "A-Spec Technology", "Type S"],
  },
  Audi: {
    R8: ["V10", "V10 Plus", "V10 Performance", "V10 Decennium"],
    RS5: ["Coupe", "Sportback"],
    RS4: ["Avant"],
    RS3: ["Sedan"],
    RS6: ["Avant"],
    RS7: ["Sportback"],
    S4: ["Premium", "Premium Plus", "Prestige"],
    S5: ["Premium", "Premium Plus", "Prestige", "Sportback"],
    S3: ["Premium", "Premium Plus", "Prestige"],
    A3: ["Premium", "Premium Plus", "Prestige"],
    A4: ["Premium", "Premium Plus", "Prestige"],
    A5: ["Premium", "Premium Plus", "Prestige"],
    A6: ["Premium", "Premium Plus", "Prestige", "Competition"],
    TT: ["S", "RS"],
    Q3: ["Premium", "Premium Plus", "S Line Premium", "S Line Premium Plus"],
    Q5: ["Premium", "Premium Plus", "Prestige", "SQ5 Premium", "SQ5 Premium Plus"],
    Q7: ["Premium", "Premium Plus", "Prestige", "SQ7 Premium", "SQ7 Premium Plus"],
  },
  BMW: {
    M3: ["Base", "Competition", "Competition xDrive", "CS", "CSL", "Touring"],
    M4: ["Base", "Competition", "Competition xDrive", "CS", "CSL", "GTS"],
    M2: ["Base", "Competition", "CS", "CSL"],
    M5: ["Base", "Competition", "CS"],
    M8: ["Base", "Competition", "Gran Coupe", "Gran Coupe Competition"],
    "2 Series": ["228i", "230i", "M235i", "M240i", "M240i xDrive"],
    "3 Series": ["320i", "330i", "330i xDrive", "330e", "340i", "340i xDrive", "M340i", "M340i xDrive"],
    "4 Series": ["430i", "430i xDrive", "430i Gran Coupe", "440i", "440i xDrive", "M440i", "M440i xDrive"],
    "5 Series": ["530i", "530i xDrive", "540i", "540i xDrive", "M550i xDrive"],
    "7 Series": ["740i", "740i xDrive", "750i xDrive", "760i xDrive"],
    Z4: ["sDrive20i", "sDrive30i", "M40i"],
    X3: ["sDrive30i", "xDrive30i", "M40i", "X3 M", "X3 M Competition"],
    X5: ["sDrive40i", "xDrive40i", "xDrive45e", "M60i", "X5 M", "X5 M Competition"],
    X6: ["sDrive40i", "xDrive40i", "M60i", "X6 M", "X6 M Competition"],
  },
  Buick: {
    Enclave: ["Preferred", "Essence", "Premium", "Avenir"],
    Encore: ["Preferred", "Sport Touring", "Essence", "Premium"],
    "Encore GX": ["Preferred", "Select", "Essence", "Sport Touring"],
    Envision: ["Preferred", "Essence", "Premium", "Avenir"],
    LaCrosse: ["Base", "Leather", "Premium", "Sport Touring"],
    Regal: ["Preferred", "Preferred II", "GS", "Sportback Preferred", "TourX Preferred"],
    "Regal GS": ["Base"],
  },
  Cadillac: {
    CT4: ["Luxury", "Premium Luxury", "Sport", "V", "Blackwing"],
    CT5: ["Luxury", "Premium Luxury", "Sport", "V", "Blackwing"],
    ATS: ["Luxury", "Performance", "Premium", "V"],
    CTS: ["Luxury", "Premium", "Performance", "Vsport", "V", "V Wagon"],
    Escalade: ["Luxury", "Premium Luxury", "Sport", "Platinum", "V"],
    "Escalade ESV": ["Luxury", "Premium Luxury", "Platinum"],
    XT4: ["Luxury", "Premium Luxury", "Sport"],
    XT5: ["Luxury", "Premium Luxury", "Sport", "Platinum"],
    XT6: ["Premium Luxury", "Sport", "Platinum"],
  },
  Chevrolet: {
    Camaro: ["LS", "LT", "LT1", "SS", "SS 1LE", "ZL1", "ZL1 1LE", "COPO"],
    Corvette: ["Stingray", "Stingray Z51", "Grand Sport", "Z06", "ZR1"],
    "Silverado 1500": ["WT", "Custom", "Custom Trail Boss", "LT", "LT Trail Boss", "RST", "LTZ", "High Country", "ZR2", "Silverado"],
    "Silverado 2500HD": ["WT", "Custom", "LT", "LTZ", "High Country"],
    Colorado: ["WT", "LT", "Z71", "ZR2", "Trail Boss"],
    Malibu: ["L", "LS", "RS", "LT", "Premier"],
    Blazer: ["L", "2LT", "3LT", "RS", "Premier"],
    Tahoe: ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
    Suburban: ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
    Traverse: ["L", "LS", "LT", "RS", "Premier", "High Country"],
    Trailblazer: ["LS", "LT", "ACTIV", "RS"],
    Equinox: ["L", "LS", "LT", "RS", "Premier"],
  },
  Chrysler: {
    "300": ["Touring", "Touring L", "S", "300C", "300C Platinum", "SRT8"],
    Pacifica: ["Touring", "Touring L", "Limited", "Pinnacle", "Hybrid Touring", "Hybrid Limited", "Hybrid Pinnacle"],
  },
  Dodge: {
    Challenger: ["SXT", "SXT Plus", "GT", "GT AWD", "R/T", "R/T Plus", "R/T Scat Pack", "R/T Scat Pack Widebody", "R/T Scat Pack 392", "SRT 392", "SRT Hellcat", "SRT Hellcat Widebody", "SRT Hellcat Redeye", "SRT Hellcat Redeye Widebody", "SRT Super Stock", "SRT Demon", "SRT Demon 170", "Shakedown", "Jailbreak", "Last Call"],
    Charger: ["SXT", "SXT Plus", "GT", "GT AWD", "R/T", "R/T Plus", "R/T Scat Pack", "R/T Scat Pack Widebody", "SRT 392", "SRT Hellcat", "SRT Hellcat Widebody", "SRT Hellcat Redeye", "SRT Hellcat Redeye Widebody", "Jailbreak", "Last Call", "Daytona"],
    Durango: ["Express", "SXT", "SXT Plus", "SXT AWD", "GT", "GT Plus", "GT AWD", "Limited", "Limited Plus", "Limited AWD", "Citadel", "Citadel Anodized Platinum", "R/T", "R/T Plus", "R/T AWD", "Blacktop", "SRT 392", "SRT Hellcat"],
    Dart: ["SE", "SXT", "Aero", "SXT Sport", "Limited", "GT", "GT Sport", "R/T"],
    Journey: ["SE", "SXT", "SXT Plus", "Crossroad", "Crossroad Plus", "GT", "Limited", "R/T"],
    Viper: ["SRT", "GTS", "ACR", "GT", "GTC", "GTSR", "ACR Extreme"],
  },
  Ford: {
    Mustang: ["EcoBoost", "EcoBoost Premium", "EcoBoost High Performance", "GT", "GT Premium", "GT350", "GT350R", "GT500", "GT500 Carbon Fiber Track Pack", "Mach 1", "Mach 1 Premium", "Dark Horse", "Dark Horse Premium", "California Special"],
    "F-150": ["Regular Cab", "XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Tremor", "Raptor", "Raptor R"],
    "F-250": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Tremor"],
    "F-350": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited"],
    Bronco: ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Everglades", "Raptor", "Heritage", "Heritage Limited", "First Edition"],
    Explorer: ["Base", "XLT", "Limited", "Limited Hybrid", "Platinum", "ST", "Timberline", "King Ranch"],
    Edge: ["SE", "SEL", "Titanium", "ST"],
    Escape: ["S", "SE", "SEL", "Titanium", "ST-Line", "Plug-In Hybrid SE", "Plug-In Hybrid Titanium"],
    Expedition: ["XL", "XLT", "Limited", "Platinum", "Timberline", "King Ranch", "Max XL", "Max XLT", "Max Limited", "Max Platinum"],
    Fusion: ["S", "SE", "SE Sport", "Titanium", "Energi SE", "Energi Titanium", "Sport", "Platinum"],
    Maverick: ["XL", "XLT", "Lariat", "Tremor"],
    Ranger: ["XL", "XLT", "Lariat", "Tremor", "Raptor"],
    "Bronco Sport": ["Base", "Big Bend", "Outer Banks", "Badlands", "First Edition"],
  },
  Genesis: {
    G70: ["2.0T", "2.0T Sport", "3.3T Sport", "3.3T Sport Advanced"],
    G80: ["2.5T", "2.5T Advanced", "3.5T", "3.5T Advanced", "Electrified"],
    G90: ["Premium", "Premium AWD", "3.3T AWD", "5.0 Ultimate"],
    GV70: ["2.5T", "2.5T Sport Prestige", "3.5T", "3.5T Sport Prestige", "Electrified"],
    GV80: ["2.5T", "3.5T", "3.5T Advanced", "3.5T Prestige"],
  },
  GMC: {
    "Sierra 1500": ["Pro", "SLE", "Elevation", "SLT", "AT4", "AT4X", "Denali", "Denali Ultimate"],
    "Sierra 2500HD": ["Pro", "SLE", "SLT", "AT4", "AT4X", "Denali", "Denali Ultimate"],
    Yukon: ["SLE", "SLT", "AT4", "Denali", "Denali Ultimate"],
    "Yukon XL": ["SLE", "SLT", "AT4", "Denali", "Denali Ultimate"],
    Canyon: ["Elevation", "AT4", "AT4X", "Denali"],
    Acadia: ["SLE", "SLE-1", "SLE-2", "SLT-1", "SLT-2", "AT4", "Denali"],
    Terrain: ["SLE", "SLT", "AT4", "Denali"],
  },
  Honda: {
    Civic: ["LX", "Sport", "EX", "EX-L", "Sport Touring", "Touring", "Si", "Type R"],
    "Civic Type R": ["Base", "Limited Edition"],
    Accord: ["LX", "Sport", "EX", "EX-L", "Sport-L", "Touring", "Sport 2.0T", "Touring 2.0T"],
    "CR-V": ["LX", "Sport", "EX", "EX-L", "Touring", "Hybrid LX", "Hybrid Sport", "Hybrid EX-L", "Hybrid Touring"],
    S2000: ["Base", "CR"],
    Pilot: ["LX", "Sport", "EX-L", "TrailSport", "Touring", "Elite", "Black Edition"],
    Ridgeline: ["Sport", "RTL", "RTL-E", "Black Edition"],
    Fit: ["LX", "Sport", "EX", "EX-L"],
    "CR-Z": ["Base", "EX", "EX Navigation"],
    Odyssey: ["LX", "EX", "EX-L", "Touring", "Touring Elite", "Elite"],
    Passport: ["Sport", "EX-L", "TrailSport", "Touring", "Elite"],
    "HR-V": ["LX", "Sport", "EX", "EX-L", "Touring"],
  },
  Hyundai: {
    "Elantra N": ["Base", "N Line"],
    "Veloster N": ["Base", "Performance Package"],
    Veloster: ["Base", "Value Edition", "Turbo", "Turbo R-Spec", "Turbo Rally Edition", "Turbo Ultimate"],
    "Genesis Coupe": ["2.0T", "2.0T Premium", "2.0T R-Spec", "2.0T Track", "3.8", "3.8 R-Spec", "3.8 Track", "3.8 Ultimate"],
    Sonata: ["SE", "SEL", "SEL Plus", "N Line", "Limited", "N Line Ultimate"],
    Elantra: ["SE", "SEL", "N Line", "Limited", "N Line Ultimate"],
    Tucson: ["SE", "SEL", "N Line", "XRT", "Limited", "Limited Hybrid"],
    "Santa Fe": ["SE", "SEL", "SEL Premium", "XRT", "Limited", "Calligraphy"],
    Kona: ["SE", "SEL", "N Line", "Limited", "N", "Ultimate"],
    Palisade: ["SE", "SEL", "SEL Convenience", "XRT", "Limited", "Calligraphy"],
    "Santa Cruz": ["SE", "SEL", "SEL Premium", "XRT", "Limited"],
  },
  Infiniti: {
    G35: ["Base", "X AWD", "Journey", "Sport", "Sport 6MT", "Coupe Base", "Coupe Sport"],
    G37: ["Journey", "Sport", "x AWD", "IPL", "Coupe Journey", "Coupe Sport", "Convertible Base", "Convertible Sport"],
    Q50: ["Pure", "Luxe", "Sport", "Red Sport 400", "Sensory", "Signature Edition"],
    Q60: ["Pure", "Luxe", "Sport", "Red Sport 400", "Red Sport 400 AWD"],
    QX50: ["Pure", "Luxe", "Essential", "Sensory", "Autograph"],
    QX60: ["Pure", "Luxe", "Sensory", "Autograph"],
    QX80: ["Luxe", "Premium Select", "Sensory", "Autograph"],
  },
  Jaguar: {
    "F-Type": ["Base", "P300 R-Dynamic", "P380 R-Dynamic", "P450 R", "P575 SVR", "ZP Edition"],
    "F-Pace": ["S", "SE", "SVR", "R-Dynamic SE", "R-Dynamic HSE"],
    "E-Pace": ["S", "SE", "HSE", "R-Dynamic SE"],
    XE: ["S", "SE", "HSE", "R-Dynamic SE", "R-Dynamic HSE", "SV Project 8"],
    XF: ["S", "SE", "HSE", "R-Dynamic SE", "R-Dynamic HSE", "SV8"],
  },
  Jeep: {
    Wrangler: ["Sport", "Sport S", "Freedom Edition", "Islander", "Sahara", "Sahara 4xe", "Sahara High Altitude", "Rubicon", "Rubicon 4xe", "Rubicon 392", "Willys", "Willys Sport", "High Altitude", "Altitude", "Black and Tan", "Xtreme Recon"],
    "Grand Cherokee": ["Laredo", "Laredo X", "Altitude", "Limited", "Limited X", "80th Anniversary", "Overland", "Summit", "Summit Reserve", "Trackhawk", "4xe", "SRT"],
    "Grand Cherokee L": ["Laredo", "Altitude", "Limited", "Limited X", "Overland", "Summit", "Summit Reserve"],
    Gladiator: ["Sport", "Sport S", "Willys", "Willys Sport", "Overland", "Mojave", "High Altitude", "Rubicon", "Farout", "Farout High Altitude"],
    Cherokee: ["Sport", "Latitude", "Latitude Plus", "Altitude", "Limited", "Trailhawk", "Overland", "High Altitude"],
    Renegade: ["Sport", "Latitude", "Limited", "Altitude", "Upland", "Trailhawk"],
    Compass: ["Sport", "Latitude", "Latitude Lux", "Limited", "Altitude", "Trailhawk", "High Altitude"],
  },
  Lexus: {
    IS: ["IS 200t", "IS 250", "IS 300", "IS 300 AWD", "IS 350", "IS 350 AWD", "IS 350 F Sport", "IS 350 F Sport Performance", "IS 500 F Sport Performance"],
    "IS F": ["Base"],
    GS: ["GS 200t", "GS 300", "GS 350", "GS 350 AWD", "GS 350 F Sport", "GS 450h", "GS 460", "GS F"],
    RC: ["RC 200t", "RC 300", "RC 300 AWD", "RC 350", "RC 350 AWD", "RC 350 F Sport"],
    "RC F": ["Base", "Track Edition"],
    LC: ["LC 500", "LC 500 Convertible", "LC 500h"],
    ES: ["ES 250", "ES 300h", "ES 350", "ES 350 F Sport"],
    GX: ["GX 460 Base", "GX 460 Premium", "GX 460 Luxury", "GX 550 Premium Plus", "GX 550 Overtrail Plus"],
    LX: ["LX 470", "LX 570 Base", "LX 570 Three-Row", "LX 600 Premium", "LX 600 Luxury", "LX 600 F Sport"],
    NX: ["NX 200t", "NX 250", "NX 300", "NX 300h", "NX 300 F Sport", "NX 350", "NX 350h", "NX 450h+"],
    RX: ["RX 300", "RX 330", "RX 350", "RX 350 AWD", "RX 350 F Sport", "RX 350h", "RX 400h", "RX 450h", "RX 450h+", "RX 500h F Sport"],
    LS: ["LS 400", "LS 430", "LS 460", "LS 500", "LS 500 AWD", "LS 500h", "LS 600hL"],
  },
  Mazda: {
    "Miata MX-5": ["Sport", "Club", "Grand Touring", "RF Club", "RF Grand Touring", "30th Anniversary", "100th Anniversary"],
    "RX-7": ["Base", "GXL", "GTUs", "Turbo II", "R2", "Touring X"],
    "RX-8": ["Sport", "Touring", "Grand Touring", "R3", "Shinka Special Edition"],
    Mazda3: ["Sport 2.0", "Sport 2.5", "Select", "Preferred", "Premium", "Premium Plus", "2.5 Turbo Premium", "2.5 Turbo Premium Plus"],
    Mazda6: ["Sport", "Touring", "Grand Touring", "Grand Touring Reserve", "Signature"],
    "CX-5": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Grand Touring Reserve", "Signature", "2.5 Turbo", "2.5 Turbo Premium"],
    "CX-9": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Grand Touring Reserve", "Signature"],
  },
  "Mercedes-Benz": {
    "AMG GT": ["AMG GT", "AMG GT S", "AMG GT C", "AMG GT R", "AMG GT R Pro", "AMG GT Black Series"],
    "C-Class": ["C 300", "C 300 4MATIC", "AMG C 43", "AMG C 43 4MATIC", "AMG C 63", "AMG C 63 S"],
    "E-Class": ["E 350", "E 350 4MATIC", "E 450", "E 450 4MATIC", "AMG E 53", "AMG E 63 S", "AMG E 63 S+"],
    "S-Class": ["S 500", "S 500 4MATIC", "S 580", "S 580 4MATIC", "AMG S 63", "Maybach S 580", "Maybach S 680"],
    "G-Class": ["G 550", "G 550 4x4 Squared", "AMG G 63"],
    GLC: ["GLC 300", "GLC 300 4MATIC", "GLC 350e 4MATIC", "AMG GLC 43", "AMG GLC 63", "AMG GLC 63 S"],
    GLE: ["GLE 350", "GLE 350 4MATIC", "GLE 450 4MATIC", "GLE 580 4MATIC", "AMG GLE 53", "AMG GLE 63 S"],
    CLA: ["CLA 250", "CLA 250 4MATIC", "AMG CLA 35", "AMG CLA 45", "AMG CLA 45 S"],
    "A-Class": ["A 220", "A 220 4MATIC", "AMG A 35"],
    SL: ["SL 43", "SL 55", "SL 55 4MATIC+", "SL 63", "SL 63 4MATIC+"],
  },
  Mitsubishi: {
    "Lancer Evolution": ["GSR", "MR", "SE", "Final Edition"],
    Lancer: ["ES", "DE", "GTS", "SE", "GT", "Ralliart", "SPORTBACK ES", "SPORTBACK GT"],
    Galant: ["ES", "LS", "GTS", "Ralliart"],
    Outlander: ["ES", "SE", "SEL", "SEL Touring", "GT", "PHEV SE", "PHEV SEL", "PHEV GT"],
    "Eclipse Cross": ["ES", "SE", "SEL", "SEL S-AWC", "LE"],
  },
  Nissan: {
    "370Z": ["Base", "Sport", "Sport Touring", "Touring", "NISMO", "NISMO Tech", "Heritage Edition", "50th Anniversary"],
    "350Z": ["Base", "Enthusiast", "Touring", "Performance", "Track", "Grand Touring", "NISMO"],
    "GT-R": ["Premium", "Track", "Black Edition", "NISMO", "NISMO Special Edition", "T-spec", "50th Anniversary"],
    Z: ["Sport", "Performance", "Proto Spec"],
    Altima: ["S", "SR", "SV", "SL", "Platinum", "SR VC-Turbo", "SL VC-Turbo"],
    Maxima: ["S", "SV", "SR", "SL", "Platinum", "40th Anniversary"],
    Titan: ["S", "SV", "Pro-4X", "SL", "Platinum", "XD S", "XD SV", "XD Pro-4X", "XD SL", "XD Platinum"],
    Frontier: ["S", "SV", "Pro-4X", "Pro-X", "SL", "Desert Runner"],
    Rogue: ["S", "SV", "SL", "Platinum", "Sport S", "Sport SV", "Sport SL"],
    Murano: ["S", "SV", "SL", "Platinum"],
    Pathfinder: ["S", "SV", "SL", "Rock Creek", "Platinum"],
    Armada: ["SV", "SL", "Platinum"],
    Sentra: ["S", "SV", "SR", "SR Turbo", "Nismo"],
  },
  Porsche: {
    "911": ["Carrera", "Carrera S", "Carrera 4", "Carrera 4S", "Carrera T", "Carrera GTS", "Carrera 4 GTS", "Targa 4", "Targa 4S", "Targa 4 GTS", "GT3", "GT3 Touring", "GT3 RS", "GT3 RS Weissach", "Turbo", "Turbo S", "Sport Classic"],
    "718 Cayman": ["Base", "S", "T", "GTS 4.0", "GT4", "GT4 RS", "GT4 RS Weissach"],
    "718 Boxster": ["Base", "S", "T", "GTS 4.0", "Spyder", "Spyder RS"],
    Cayenne: ["Base", "S", "GTS", "GTS Coupe", "Turbo", "Turbo S", "Turbo S E-Hybrid", "Turbo GT", "E-Hybrid", "Coupe S"],
    Panamera: ["Base", "4", "4S", "4 E-Hybrid", "4S E-Hybrid", "GTS", "4 GTS", "Turbo", "Turbo S", "Turbo S E-Hybrid", "Sport Turismo"],
    Macan: ["Base", "S", "GTS", "Turbo"],
  },
  RAM: {
    "1500": ["Tradesman", "Classic Tradesman", "Classic Express", "Classic SLT", "Classic Warlock", "Big Horn", "Lone Star", "Laramie", "Rebel", "Laramie Longhorn", "Limited", "Limited Longhorn", "Tungsten", "TRX"],
    "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Limited", "Laramie Longhorn", "Tungsten"],
    "3500": ["Tradesman", "Big Horn", "Laramie", "Limited", "Laramie Longhorn", "Tungsten"],
  },
  Scion: {
    "FR-S": ["Base", "Release Series 1.0", "Release Series 2.0"],
    tC: ["Base", "Release Series"],
    xB: ["Base", "Release Series"],
  },
  Subaru: {
    WRX: ["Base", "Premium", "Limited", "TR", "GT", "Series.White", "Series.Gray", "STI (legacy)"],
    "WRX STI": ["Base", "Limited", "Series.White", "Series.Gray", "Series.Yellow", "S209", "Final Edition"],
    BRZ: ["Premium", "Limited", "tS", "Series.Gray", "Series.Yellow", "Series.White", "10th Anniversary"],
    Forester: ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness"],
    Outback: ["Base", "Premium", "Limited", "Limited XT", "Touring", "Touring XT", "Onyx Edition XT", "Wilderness"],
    Impreza: ["Base", "Premium", "Sport", "Limited", "Sport Limited", "RS"],
    Crosstrek: ["Base", "Premium", "Limited", "Sport", "Hybrid", "Wilderness", "XV"],
    Legacy: ["Base", "Premium", "Sport", "Limited", "Limited XT", "Touring XT"],
  },
  Toyota: {
    "GR Supra": ["2.0", "3.0", "3.0 Premium", "A91-CF Edition", "A91-MT Edition", "45th Anniversary Edition"],
    "GR Corolla": ["Core", "Circuit Edition", "Morizo Edition", "MATTE Edition"],
    GR86: ["Base", "Premium", "10th Anniversary"],
    Camry: ["L", "LE", "LE Hybrid", "SE", "SE Nightshade", "SE AWD", "XLE", "XLE V6", "XSE", "XSE V6", "XSE Hybrid", "TRD", "XLE Hybrid"],
    Corolla: ["L", "LE", "LE Eco", "SE", "SE Apex Edition", "XLE", "XSE", "Hybrid LE", "Hybrid SE", "Hybrid XSE", "Hatchback SE", "Hatchback XSE", "Hatchback XSE Special Edition"],
    "4Runner": ["SR5", "SR5 Premium", "TRD Sport", "TRD Off-Road", "TRD Off-Road Premium", "Limited", "TRD Pro", "Venture", "40th Anniversary"],
    Tacoma: ["SR", "SR5", "SR5 Double Cab V6", "TRD Sport", "TRD Sport Premium", "TRD Off-Road", "TRD Off-Road Premium", "Limited", "TRD Pro", "Trail", "Trailhunter"],
    Tundra: ["SR", "SR5", "SR5 TRD Sport", "Limited", "Limited TRD Off-Road", "1794 Edition", "Platinum", "TRD Pro", "Capstone"],
    Highlander: ["L", "LE", "LE Plus", "XLE", "XLE AWD", "SE", "Limited", "Limited AWD", "Platinum", "XSE", "Bronze Edition", "Hybrid LE", "Hybrid XLE", "Hybrid Limited", "Hybrid Platinum"],
    RAV4: ["LE", "XLE", "XLE Premium", "TRD Off-Road", "Adventure", "Limited", "Hybrid LE", "Hybrid XLE", "Hybrid XSE", "Hybrid Limited", "Hybrid Platinum", "Prime SE", "Prime XSE", "Prime XSE Premium", "Woodland Edition"],
    "FJ Cruiser": ["Base", "Trail Teams", "Trail Teams Ultimate"],
    Avalon: ["XLE", "XSE", "XLE Hybrid", "XSE Hybrid", "Limited", "Limited Hybrid", "Touring"],
    "Land Cruiser": ["Base", "Heritage Edition", "1958 Edition", "GX", "GXR"],
    Sequoia: ["SR5", "Limited", "Platinum", "TRD Pro", "Capstone"],
  },
  Volkswagen: {
    "Golf GTI": ["S", "SE", "Autobahn", "Rabbit Edition", "Clubsport", "Clubsport Edition 45"],
    "Golf R": ["Base", "20th Anniversary", "Cabriolet"],
    Golf: ["S", "SE", "SEL", "Alltrack S", "Alltrack SE", "Alltrack SEL"],
    Jetta: ["S", "Sport", "SE", "SEL", "GLI S", "GLI Autobahn", "GLI 35th Anniversary"],
    Passat: ["S", "R-Line", "SE", "SE R-Line", "SEL Premium"],
    Arteon: ["SE", "SEL", "SEL R-Line", "SEL Premium", "SEL Premium R-Line", "Shooting Brake SEL"],
    Tiguan: ["S", "SE", "SE R-Line Black", "SE R-Line", "SEL", "SEL R-Line", "SEL Premium", "SEL Premium R-Line"],
    Atlas: ["S", "SE", "SE Technology", "SE Technology R-Line", "SEL", "SEL Premium", "SEL R-Line", "Cross Sport S", "Cross Sport SE", "Cross Sport SEL"],
  },
  Volvo: {
    XC60: ["Momentum", "R-Design", "Inscription", "Polestar Engineered", "T8 Inscription", "T8 R-Design", "T8 Polestar", "Recharge"],
    XC90: ["Momentum", "R-Design", "Inscription", "T8 Inscription", "T8 R-Design", "T8 Excellence", "Recharge"],
    XC40: ["Momentum", "R-Design", "Inscription", "Recharge Pure Electric"],
    S60: ["Momentum", "R-Design", "Inscription", "Polestar Engineered", "T8 Polestar", "Recharge"],
    S90: ["Momentum", "R-Design", "Inscription", "T8 Inscription", "T8 R-Design"],
    V60: ["Momentum", "R-Design", "Inscription", "Polestar Engineered", "Cross Country"],
  },
  Kia: {
    Stinger: ["GT-Line", "GT", "GT1", "GT2", "Scorpion Special Edition"],
    Forte: ["FE", "LXS", "GT-Line", "GT", "GT-Line ADAS", "Nightfall Edition"],
    K5: ["LX", "GT-Line", "EX", "GT"],
    Soul: ["LX", "S", "EX", "GT-Line", "Turbo", "Turbo!", "X-Line"],
    Sportage: ["LX", "S", "EX", "SX", "X-Line", "SX Prestige", "Hybrid EX", "Hybrid SX", "Plug-In Hybrid EX"],
    Seltos: ["LX", "S", "EX", "SX", "X-Line", "Nightfall Edition"],
    Telluride: ["LX", "S", "EX", "SX", "X-Line", "SX Prestige", "SX-Prestige X-Line", "Nightfall Edition"],
  },
};

const engineData: Record<string, Record<string, string[]>> = {
  Dodge: {
    Challenger: ["3.6L Pentastar V6 (305 hp)", "5.7L HEMI V8 (375 hp)", "6.4L 392 HEMI V8 (485 hp)", "6.2L Supercharged HEMI Hellcat V8 (717 hp)", "6.2L Supercharged HEMI Hellcat Redeye V8 (797 hp)", "6.2L Supercharged HEMI Demon V8 (808 hp)", "6.2L Supercharged HEMI Demon 170 V8 (1025 hp)"],
    Charger: ["3.6L Pentastar V6 (292 hp)", "5.7L HEMI V8 (370 hp)", "6.4L 392 HEMI V8 (485 hp)", "6.2L Supercharged HEMI Hellcat V8 (717 hp)", "6.2L Supercharged HEMI Hellcat Redeye V8 (797 hp)"],
    Durango: ["3.6L Pentastar V6 (293 hp)", "5.7L HEMI V8 (360 hp)", "6.4L 392 HEMI V8 (475 hp)", "6.2L Supercharged HEMI Hellcat V8 (710 hp)"],
    Dart: ["1.4L MultiAir Turbo I4 (160 hp)", "2.0L Tigershark I4 (160 hp)", "2.4L Tigershark I4 (184 hp)"],
    Viper: ["8.4L V10 (640 hp)", "8.4L V10 ACR (645 hp)"],
  },
  Ford: {
    Mustang: ["2.3L EcoBoost I4 (310 hp)", "5.0L Coyote V8 (450 hp)", "5.2L Flat-Plane V8 GT350 (526 hp)", "5.2L Supercharged V8 GT500 (760 hp)", "5.0L Coyote V8 Mach 1 (480 hp)", "5.0L Coyote V8 Dark Horse (500 hp)"],
    "F-150": ["2.7L EcoBoost V6 (325 hp)", "3.3L Ti-VCT V6 (290 hp)", "3.5L EcoBoost V6 (400 hp)", "3.5L PowerBoost Hybrid V6 (430 hp)", "5.0L Coyote V8 (400 hp)", "3.5L High Output EcoBoost Raptor (450 hp)", "3.5L High Output EcoBoost Raptor R (700 hp)"],
    "F-250": ["6.2L V8 (385 hp)", "7.3L Godzilla V8 (430 hp)", "6.7L Power Stroke Diesel V8 (475 hp)"],
    Bronco: ["1.5L EcoBoost I3 (181 hp)", "2.3L EcoBoost I4 (300 hp)", "2.7L EcoBoost V6 (330 hp)"],
    Ranger: ["2.3L EcoBoost I4 (270 hp)", "2.7L EcoBoost V6 (315 hp)"],
    Explorer: ["2.3L EcoBoost I4 (300 hp)", "3.0L EcoBoost V6 ST (400 hp)", "3.3L Hybrid V6 (318 hp)"],
    Fusion: ["1.5L EcoBoost I4 (181 hp)", "2.0L EcoBoost I4 (245 hp)", "2.7L EcoBoost V6 (325 hp)", "2.5L Hybrid I4 (188 hp)"],
  },
  Chevrolet: {
    Camaro: ["2.0L Turbo I4 (275 hp)", "3.6L V6 (335 hp)", "6.2L LT1 V8 (455 hp)", "6.2L Supercharged LT4 V8 ZL1 (650 hp)"],
    Corvette: ["6.2L LT1 V8 (495 hp)", "6.2L LT2 V8 (490 hp)", "5.5L LT6 V8 Z06 (670 hp)", "6.2L Supercharged LT5 V8 ZR1 (755 hp)"],
    "Silverado 1500": ["2.7L Turbo I4 (310 hp)", "4.3L EcoTec3 V6 (285 hp)", "5.3L EcoTec3 V8 (355 hp)", "6.2L EcoTec3 V8 (420 hp)", "3.0L Duramax Diesel I6 (277 hp)"],
    Colorado: ["2.5L I4 (200 hp)", "3.6L V6 (308 hp)", "2.8L Duramax Diesel I4 (186 hp)", "2.7L Turbo I4 (310 hp)"],
    Tahoe: ["5.3L EcoTec3 V8 (355 hp)", "6.2L EcoTec3 V8 (420 hp)", "3.0L Duramax Diesel I6 (277 hp)"],
  },
  Toyota: {
    "GR Supra": ["2.0L B48 Turbo I4 (255 hp)", "3.0L B58 Turbo I6 (382 hp)"],
    "GR Corolla": ["1.6L G16E-GTS Turbo I3 (300 hp)"],
    GR86: ["2.4L FA24D H4 (228 hp)"],
    Camry: ["2.5L I4 (203 hp)", "3.5L V6 (301 hp)", "2.5L Hybrid I4 (208 hp)"],
    Corolla: ["1.8L I4 (139 hp)", "2.0L I4 (169 hp)", "1.8L Hybrid I4 (138 hp)"],
    Tacoma: ["2.7L I4 (159 hp)", "3.5L V6 (278 hp)", "2.4L Turbo I4 (228 hp)", "2.4L Turbo Hybrid I4 (326 hp)"],
    Tundra: ["3.5L Twin-Turbo V6 (389 hp)", "3.5L Twin-Turbo Hybrid V6 (437 hp)", "5.7L V8 (381 hp)", "4.6L V8 (310 hp)"],
    "4Runner": ["4.0L V6 (270 hp)", "4.7L V8 (235 hp)"],
    RAV4: ["2.5L I4 (203 hp)", "2.5L Hybrid I4 (219 hp)", "2.5L Plug-in Hybrid I4 (302 hp)"],
    Highlander: ["2.4L Turbo I4 (265 hp)", "2.5L Hybrid I4 (243 hp)", "3.5L V6 (295 hp)"],
    "FJ Cruiser": ["4.0L V6 (239 hp)"],
    Sequoia: ["3.5L Twin-Turbo Hybrid V6 (437 hp)", "5.7L V8 (381 hp)"],
    Avalon: ["3.5L V6 (301 hp)", "2.5L Hybrid I4 (215 hp)"],
  },
  Honda: {
    Civic: ["1.5L VTEC Turbo I4 (158 hp)", "2.0L DOHC I4 (158 hp)", "1.5L Turbo Si I4 (200 hp)", "2.0L VTEC Turbo Type R I4 (315 hp)"],
    "Civic Type R": ["2.0L DOHC VTEC Turbo I4 (315 hp)"],
    Accord: ["1.5L Turbo I4 (192 hp)", "2.0L Turbo I4 (252 hp)", "2.0L Hybrid I4 (204 hp)"],
    S2000: ["2.0L F20C1 I4 (240 hp)", "2.2L F22C1 I4 (237 hp)"],
    "CR-V": ["1.5L Turbo I4 (190 hp)", "2.0L Hybrid I4 (212 hp)"],
    Pilot: ["3.5L V6 (285 hp)"],
    Ridgeline: ["3.5L V6 (280 hp)"],
  },
  Subaru: {
    WRX: ["2.0L EJ20 Turbo H4 (268 hp)", "2.4L FA24F Turbo H4 (271 hp)"],
    "WRX STI": ["2.5L EJ25 Turbo H4 (310 hp)"],
    BRZ: ["2.0L FA20D H4 (205 hp)", "2.4L FA24D H4 (228 hp)"],
    Forester: ["2.5L FB25 H4 (182 hp)", "2.0L FA20DIT Turbo XT H4 (250 hp)"],
    Outback: ["2.5L FB25 H4 (182 hp)", "2.4L FA24F Turbo H4 (260 hp)"],
    Impreza: ["2.0L FB20 H4 (152 hp)", "2.5L FB25 H4 (182 hp)"],
    Crosstrek: ["2.0L FB20 H4 (152 hp)", "2.5L FB25 H4 (182 hp)"],
    Legacy: ["2.5L FB25 H4 (182 hp)", "2.4L FA24F Turbo H4 (260 hp)"],
  },
  Nissan: {
    "370Z": ["3.7L VQ37VHR V6 (332 hp)", "3.7L NISMO VQ37VHR V6 (350 hp)"],
    "350Z": ["3.5L VQ35DE V6 (287 hp)", "3.5L VQ35HR V6 (306 hp)"],
    "GT-R": ["3.8L VR38DETT Twin-Turbo V6 (565 hp)", "3.8L NISMO VR38DETT V6 (600 hp)", "3.8L VR38DETT T-spec V6 (600 hp)"],
    Z: ["3.0L Twin-Turbo V6 (400 hp)"],
    Altima: ["2.5L QR25DE I4 (182 hp)", "2.0L KR20DDET Turbo I4 (248 hp)", "3.5L VQ35DE V6 (270 hp)"],
    Maxima: ["3.5L VQ35DE V6 (300 hp)"],
    Titan: ["5.6L Endurance V8 (400 hp)"],
    Frontier: ["2.5L QR25DE I4 (152 hp)", "4.0L VQ40DE V6 (261 hp)", "3.8L V6 (310 hp)"],
    Pathfinder: ["3.5L VQ35DD V6 (284 hp)", "4.0L VQ40DE V6 (266 hp)"],
    Murano: ["3.5L VQ35DE V6 (260 hp)", "3.5L VQ35DD V6 (260 hp)"],
    Armada: ["5.6L Endurance V8 (400 hp)"],
    Rogue: ["2.0L QR20DE I4 (141 hp)", "2.5L QR25DE I4 (170 hp)", "1.5L Turbo I3 (201 hp)"],
    Sentra: ["1.8L MR18DE I4 (124 hp)", "2.0L MR20DE I4 (140 hp)", "1.6L SR16VE Turbo I4 (188 hp)"],
  },
  BMW: {
    M3: ["3.0L S55 Twin-Turbo I6 (425 hp)", "3.0L S58 Twin-Turbo I6 (503 hp)", "3.0L S58 CS I6 (543 hp)"],
    M4: ["3.0L S55 Twin-Turbo I6 (425 hp)", "3.0L S58 Twin-Turbo I6 (503 hp)", "3.0L S58 CS I6 (543 hp)"],
    M2: ["3.0L N55 Twin-Turbo I6 (365 hp)", "3.0L S55 Twin-Turbo I6 (405 hp)", "3.0L S58 Twin-Turbo I6 (453 hp)"],
    M5: ["4.4L S63 Twin-Turbo V8 (560 hp)", "4.4L S63 Competition V8 (617 hp)", "4.4L S63 CS V8 (627 hp)"],
    "3 Series": ["2.0L B46 Turbo I4 (248 hp)", "3.0L B58 Turbo I6 (382 hp)", "3.0L N55 Turbo I6 (320 hp)", "2.0L N20 Turbo I4 (240 hp)"],
    "4 Series": ["2.0L B46 Turbo I4 (255 hp)", "3.0L B58 Turbo I6 (382 hp)", "3.0L N55 Turbo I6 (322 hp)"],
    Z4: ["2.0L B48 Turbo I4 (255 hp)", "3.0L B58 Turbo I6 (382 hp)"],
    X5: ["3.0L B58 Turbo I6 (335 hp)", "4.4L N63 Twin-Turbo V8 (523 hp)", "4.4L S63 M Competition V8 (617 hp)"],
  },
  "Mercedes-Benz": {
    "AMG GT": ["4.0L M178 Twin-Turbo V8 (469 hp)", "4.0L M178 S V8 (522 hp)", "4.0L V8 R (577 hp)", "4.0L V8 Black Series (720 hp)"],
    "C-Class": ["2.0L M256 Turbo I4 (255 hp)", "3.0L M256 I6 AMG 43 (362 hp)", "2.0L M139 Turbo AMG 63 (469 hp)", "2.0L M139L Turbo AMG 63 S E-Performance (671 hp)"],
    "G-Class": ["4.0L M176 Twin-Turbo AMG G 63 V8 (577 hp)", "4.0L M177 G 550 V8 (416 hp)"],
  },
  Porsche: {
    "911": ["3.0L Twin-Turbo H6 Carrera (379 hp)", "3.0L Twin-Turbo H6 Carrera S (443 hp)", "4.0L H6 GT3 (502 hp)", "3.8L Twin-Turbo H6 Turbo (572 hp)", "3.8L Twin-Turbo H6 Turbo S (640 hp)"],
    "718 Cayman": ["2.0L Turbo H4 (300 hp)", "2.5L Turbo H4 S (350 hp)", "4.0L H6 GT4 (414 hp)", "4.0L H6 RS Spyder (500 hp)"],
    Cayenne: ["3.0L Turbo V6 (335 hp)", "2.9L Twin-Turbo V6 S (434 hp)", "4.0L Twin-Turbo V8 (541 hp)", "4.0L Twin-Turbo V8 Turbo GT (631 hp)"],
  },
  Lexus: {
    IS: ["2.0L Turbo I4 IS 200t (241 hp)", "2.5L V6 IS 250 (204 hp)", "2.0L Turbo I4 IS 300 (241 hp)", "3.5L V6 IS 350 (311 hp)", "5.0L V8 IS 500 (472 hp)"],
    "IS F": ["5.0L 2UR-GSE V8 (416 hp)"],
    GS: ["3.5L V6 GS 350 (306 hp)", "4.6L V8 GS 460 (342 hp)", "5.0L V8 GS F (467 hp)", "3.5L Hybrid GS 450h (338 hp)"],
    RC: ["2.0L Turbo I4 RC 200t (241 hp)", "3.5L V6 RC 350 (306 hp)"],
    "RC F": ["5.0L V8 (472 hp)"],
    LC: ["5.0L V8 LC 500 (471 hp)", "3.5L Hybrid V6 LC 500h (354 hp)"],
    LX: ["5.7L V8 LX 570 (383 hp)", "3.5L Twin-Turbo V6 LX 600 (409 hp)"],
  },
  Mazda: {
    "Miata MX-5": ["1.5L P5-VP I4 (132 hp)", "2.0L PE-VPS I4 (181 hp)"],
    "RX-7": ["1.3L 13B-REW Twin-Turbo Rotary (255 hp)", "1.3L 13B-T Turbo Rotary (200 hp)"],
    "RX-8": ["1.3L RENESIS 13B-MSP Rotary (212 hp)", "1.3L RENESIS 6-speed Rotary (232 hp)"],
    Mazda3: ["2.0L I4 (155 hp)", "2.5L I4 (191 hp)", "2.5L Turbo I4 (227 hp)"],
    Mazda6: ["2.5L I4 (187 hp)", "2.5L Turbo I4 (227 hp)"],
    "CX-5": ["2.5L I4 (187 hp)", "2.5L Turbo I4 (227 hp)"],
  },
  Mitsubishi: {
    "Lancer Evolution": ["2.0L 4B11T Turbo I4 (291 hp)"],
    Lancer: ["2.0L 4B11 I4 (148 hp)", "2.4L 4B12 I4 (168 hp)", "2.0L Ralliart Turbo I4 (237 hp)"],
  },
  Hyundai: {
    "Elantra N": ["2.0L Turbo I4 (276 hp)"],
    "Veloster N": ["2.0L Turbo I4 (250 hp)", "2.0L Turbo Performance I4 (275 hp)"],
    Veloster: ["1.6L GDI I4 (132 hp)", "1.6L T-GDI Turbo I4 (201 hp)"],
    "Genesis Coupe": ["2.0L Theta II Turbo I4 (210 hp)", "3.8L Lambda V6 (348 hp)"],
    Sonata: ["1.6L Turbo I4 (180 hp)", "2.5L I4 (191 hp)", "2.5L Turbo I4 N Line (290 hp)", "2.4L I4 (185 hp)"],
    Elantra: ["2.0L MPi I4 (147 hp)", "1.6L Turbo I4 N Line (201 hp)", "1.8L I4 (145 hp)"],
    Tucson: ["2.0L I4 (161 hp)", "1.6L Turbo I4 (181 hp)", "2.5L I4 (187 hp)", "1.6L PHEV Turbo I4 (261 hp)"],
  },
  Kia: {
    Stinger: ["2.0L Turbo I4 (255 hp)", "3.3L Twin-Turbo V6 (365 hp)"],
    Forte: ["2.0L MPi I4 (147 hp)", "1.6L Turbo I4 GT (201 hp)"],
    K5: ["1.6L Turbo I4 (180 hp)", "2.5L Turbo I4 GT (290 hp)"],
    Soul: ["1.6L MPi I4 (147 hp)", "1.6L Turbo I4 (201 hp)", "2.0L I4 (147 hp)"],
  },
  Infiniti: {
    G35: ["3.5L VQ35DE V6 (280 hp)", "3.5L VQ35DE Rev-Up V6 (298 hp)"],
    G37: ["3.7L VQ37VHR V6 (328 hp)", "3.7L VQ37VHR IPL V6 (348 hp)"],
    Q50: ["2.0L M274 Turbo I4 (208 hp)", "3.0L VR30DDTT Twin-Turbo V6 (300 hp)", "3.0L VR30DDTT Red Sport V6 (400 hp)"],
    Q60: ["2.0L M274 Turbo I4 (208 hp)", "3.0L VR30DDTT Twin-Turbo V6 (300 hp)", "3.0L VR30DDTT Red Sport V6 (400 hp)"],
  },
  Audi: {
    R8: ["5.2L FSI V10 (532 hp)", "5.2L FSI V10 Plus (602 hp)", "5.2L FSI V10 Performance (562 hp)"],
    RS5: ["2.9L TFSI V6 (444 hp)"],
    RS3: ["2.5L TFSI I5 (394 hp)"],
    S4: ["3.0L TFSI Supercharged V6 (333 hp)", "3.0L TFSI Turbo V6 (349 hp)"],
    S5: ["3.0L TFSI Supercharged V6 (333 hp)", "3.0L TFSI Turbo V6 (349 hp)"],
    TT: ["2.0L TFSI I4 (220 hp)", "2.0L TFSI TTS I4 (292 hp)", "2.5L TFSI RS I5 (394 hp)"],
    A4: ["2.0L TFSI I4 (201 hp)", "2.0L TFSI I4 (248 hp)"],
    Q5: ["2.0L TFSI I4 (248 hp)", "3.0L TFSI V6 SQ5 (354 hp)"],
  },
  RAM: {
    "1500": ["3.6L Pentastar V6 (305 hp)", "5.7L HEMI V8 (395 hp)", "6.2L Supercharged HEMI TRX V8 (702 hp)", "3.0L EcoDiesel V6 (260 hp)", "3.5L eTorque Mild Hybrid V6 (305 hp)", "5.7L HEMI eTorque V8 (395 hp)"],
    "2500": ["6.4L HEMI V8 (410 hp)", "6.7L Cummins Turbo Diesel I6 (370 hp)", "6.7L Cummins Turbo Diesel High Output I6 (400 hp)"],
    "3500": ["6.4L HEMI V8 (410 hp)", "6.7L Cummins Turbo Diesel I6 (370 hp)", "6.7L Cummins Turbo Diesel High Output I6 (420 hp)"],
  },
  Scion: {
    "FR-S": ["2.0L FA20D H4 (200 hp)"],
    tC: ["2.5L 2AR-FE I4 (180 hp)"],
    xB: ["2.4L 2AZ-FE I4 (158 hp)"],
  },
  Jeep: {
    Wrangler: ["2.0L Turbo I4 (270 hp)", "3.6L Pentastar V6 (285 hp)", "6.4L 392 HEMI V8 (470 hp)", "3.0L EcoDiesel V6 (260 hp)", "3.6L 4xe Plug-in Hybrid V6 (375 hp)"],
    "Grand Cherokee": ["3.6L Pentastar V6 (293 hp)", "5.7L HEMI V8 (357 hp)", "6.4L 392 HEMI V8 (475 hp)", "6.2L Supercharged Trackhawk HEMI V8 (707 hp)", "2.0L Turbo 4xe I4 (375 hp)", "3.6L V6 (295 hp)"],
    "Grand Cherokee L": ["3.6L Pentastar V6 (293 hp)", "5.7L HEMI V8 (357 hp)"],
    Gladiator: ["3.6L Pentastar V6 (285 hp)", "3.0L EcoDiesel V6 (260 hp)"],
    Cherokee: ["2.4L Tigershark I4 (180 hp)", "3.2L Pentastar V6 (271 hp)", "2.0L Turbo I4 (270 hp)"],
    Renegade: ["1.3L Turbo I4 (177 hp)", "2.4L Tigershark I4 (180 hp)"],
  },
  Volkswagen: {
    "Golf GTI": ["2.0L TSI I4 (228 hp)", "2.0L TSI Clubsport I4 (241 hp)"],
    "Golf R": ["2.0L TSI I4 (315 hp)"],
    Golf: ["1.4L TSI I4 (170 hp)", "2.0L TDI Diesel I4 (150 hp)", "1.8L TSI I4 (170 hp)"],
    Jetta: ["1.4L TSI I4 (147 hp)", "1.4L GLI TSI I4 (228 hp)", "1.8L TSI I4 (170 hp)"],
    Arteon: ["2.0L TSI I4 (300 hp)"],
    Tiguan: ["2.0L TSI I4 (184 hp)", "2.0L TSI I4 (228 hp)"],
    Atlas: ["2.0L TSI I4 (235 hp)", "3.6L VR6 V6 (276 hp)"],
    Passat: ["1.8L TSI I4 (170 hp)", "2.0L TSI I4 (174 hp)", "3.6L VR6 V6 (280 hp)"],
  },
  Chrysler: {
    "300": ["3.6L Pentastar V6 (292 hp)", "5.7L HEMI V8 (363 hp)", "6.4L SRT8 HEMI V8 (470 hp)"],
  },
  GMC: {
    "Sierra 1500": ["2.7L Turbo I4 (310 hp)", "4.3L EcoTec3 V6 (285 hp)", "5.3L EcoTec3 V8 (355 hp)", "6.2L EcoTec3 V8 (420 hp)", "3.0L Duramax Diesel I6 (277 hp)"],
    "Sierra 2500HD": ["6.6L V8 (401 hp)", "6.6L Duramax Diesel V8 (470 hp)"],
    Yukon: ["5.3L EcoTec3 V8 (355 hp)", "6.2L EcoTec3 V8 (420 hp)", "3.0L Duramax Diesel I6 (277 hp)"],
    Canyon: ["2.5L I4 (200 hp)", "3.6L V6 (308 hp)", "2.8L Duramax Diesel I4 (186 hp)", "2.7L Turbo I4 (310 hp)"],
  },
  Cadillac: {
    CT5: ["2.0L Turbo I4 (237 hp)", "3.0L Twin-Turbo V6 (360 hp)", "6.2L Supercharged V8 Blackwing (668 hp)"],
    CT4: ["2.0L Turbo I4 (237 hp)", "2.7L Turbo I4 (325 hp)", "3.6L Twin-Turbo V6 Blackwing (472 hp)"],
    CTS: ["2.0L Turbo I4 (272 hp)", "3.6L V6 (335 hp)", "3.6L Twin-Turbo V6 Vsport (420 hp)", "6.2L Supercharged V8 V (640 hp)"],
    Escalade: ["6.2L V8 (420 hp)", "3.0L Duramax Diesel I6 (277 hp)", "6.2L Supercharged V8 V (682 hp)"],
  },
};

const makes = Object.keys(makeModels).sort();
const INTAKE_DRAFT_KEY = "modvora_intake_draft_v1";

interface FormData {
  name: string; email: string; service: string;
  year: string; make: string; model: string; trim: string;
  engine: string; drivetrain: string; transmission: string; mileage: string;
  budget: string; goals: string; focus: string;
  currentMods: string; notes: string;
}

const initialForm: FormData = {
  name: "", email: "", service: "", year: "", make: "",
  model: "", trim: "", engine: "", drivetrain: "", transmission: "", mileage: "",
  budget: "", goals: "", focus: "", currentMods: "", notes: "",
};

export default function IntakeForm() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const editingVehicleId = searchParams.get("vehicle");
  const isNewVehicleFlow = searchParams.get("new") === "1";

  const isKnownTrim = (make: string, model: string, trim: string) => {
    if (!trim) return false;
    return (trimData[make]?.[model] ?? []).includes(trim);
  };

  const isKnownEngine = (make: string, model: string, engine: string) => {
    if (!engine) return false;
    return (engineData[make]?.[model] ?? []).includes(engine);
  };

  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [trimOther, setTrimOther] = useState(false);
  const [engineOther, setEngineOther] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  useEffect(() => {
    if (isNewVehicleFlow) {
      setForm({ ...initialForm, email: user?.email ?? "" });
      setIsEditingVehicle(false);
      setTrimOther(false);
      setEngineOther(false);
      return;
    }

    if (!editingVehicleId) {
      let restoredDraft: FormData | null = null;

      try {
        const raw = window.localStorage.getItem(INTAKE_DRAFT_KEY);
        restoredDraft = raw ? (JSON.parse(raw) as FormData) : null;
      } catch {
        restoredDraft = null;
      }

      setForm((prev) => ({
        ...prev,
        ...(restoredDraft ?? {}),
        email: restoredDraft?.email || prev.email || user?.email || "",
      }));
      setTrimOther(Boolean(restoredDraft?.trim) && !isKnownTrim(restoredDraft?.make ?? "", restoredDraft?.model ?? "", restoredDraft?.trim ?? ""));
      setEngineOther(Boolean(restoredDraft?.engine) && !isKnownEngine(restoredDraft?.make ?? "", restoredDraft?.model ?? "", restoredDraft?.engine ?? ""));
      setIsEditingVehicle(false);
      return;
    }

    const vehicle = loadVehicles().find((entry) => entry.id === editingVehicleId);
    if (!vehicle) {
      setIsEditingVehicle(false);
      return;
    }

    setForm({
      name: vehicle.name,
      email: vehicle.email,
      service: vehicle.service,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      engine: vehicle.engine,
      drivetrain: vehicle.drivetrain,
      transmission: vehicle.transmission ?? '',
      mileage: vehicle.mileage,
      budget: vehicle.budget,
      goals: vehicle.goals,
      focus: vehicle.focus,
      currentMods: vehicle.currentMods,
      notes: vehicle.notes,
    });
    setTrimOther(Boolean(vehicle.trim) && !isKnownTrim(vehicle.make, vehicle.model, vehicle.trim));
    setEngineOther(Boolean(vehicle.engine) && !isKnownEngine(vehicle.make, vehicle.model, vehicle.engine));
    setIsEditingVehicle(true);
  }, [editingVehicleId, isNewVehicleFlow, user?.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "make") {
      setTrimOther(false); setEngineOther(false);
      setForm(prev => ({ ...prev, make: value, model: "", trim: "", engine: "" }));
    } else if (name === "model") {
      setTrimOther(false); setEngineOther(false);
      setForm(prev => ({ ...prev, model: value, trim: "", engine: "" }));
    } else if (name === "trim_select") {
      if (value === OTHER) { setTrimOther(true); setForm(prev => ({ ...prev, trim: "" })); }
      else { setTrimOther(false); setForm(prev => ({ ...prev, trim: value })); }
    } else if (name === "engine_select") {
      if (value === OTHER) { setEngineOther(true); setForm(prev => ({ ...prev, engine: "" })); }
      else { setEngineOther(false); setForm(prev => ({ ...prev, engine: value })); }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (isEditingVehicle || editingVehicleId) return;

    try {
      window.localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [editingVehicleId, form, isEditingVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    saveVehicle(form, editingVehicleId ?? undefined);

    try {
      window.localStorage.removeItem(INTAKE_DRAFT_KEY);
    } catch {}

    const isOwner = user?.role === "owner";
    await new Promise(r => setTimeout(r, isOwner ? 200 : 600));
    setLoading(false);
    window.location.href = isOwner ? "/dashboard" : "/checkout";
  };

  const inputClass = "w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors";
  const selectClass = "w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-zinc-400 text-sm font-medium mb-1.5";
  const disabledSelectClass = "opacity-50 cursor-not-allowed";

  const arrow = (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  const availableModels = form.make ? (makeModels[form.make] ?? []) : [];
  const availableTrims = (form.make && form.model) ? (trimData[form.make]?.[form.model] ?? []) : [];
  const availableEngines = (form.make && form.model) ? (engineData[form.make]?.[form.model] ?? []) : [];

  // Current dropdown value for trim/engine selects
  const trimSelectValue = trimOther ? OTHER : (form.trim || "");
  const engineSelectValue = engineOther ? OTHER : (form.engine || "");

  const completedFields = [form.name, form.email, form.service, form.year, form.make, form.model, form.budget, form.focus, form.goals]
    .filter((value) => value.trim().length > 0).length;
  const completionPercent = Math.round((completedFields / 9) * 100);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-8 md:p-10 space-y-8">
        <div className="rounded-xl border border-purple-500/20 bg-purple-600/5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-white font-semibold">You&apos;re setting up the planner</p>
              <p className="text-zinc-400 text-sm mt-1">Modvora uses your engine, transmission, drivetrain, and goals to filter and rank parts specifically for your build.</p>
            </div>
            <div className="text-sm text-purple-300 font-medium">{completionPercent}% complete</div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#221a2c]">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
          </div>
          {!isEditingVehicle && (
            <p className="text-zinc-500 text-xs mt-3">
              Progress is saved on this device while you fill this out, so a refresh won&apos;t wipe the form.
            </p>
          )}
        </div>

        {/* 1 — Contact */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">1</span>
            Your Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input name="name" required value={form.name} onChange={handleChange} className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="you@email.com" />
            </div>
          </div>
        </div>

        {/* 2 — Service */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">2</span>
            Plan Selection
          </h2>
          <label className={labelClass}>How do you want to start? *</label>
          <div className="relative">
            <select name="service" required value={form.service} onChange={handleChange} className={selectClass}>
              <option value="">Select a plan...</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {arrow}
          </div>
          <p className="text-zinc-500 text-xs mt-2">
            Free is enough to explore a build. Premium adds deeper planning, saved progress, and room for more than one active project.
          </p>
        </div>

        {/* 3 — Vehicle */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">3</span>
            Vehicle Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Year */}
            <div>
              <label className={labelClass}>Year *</label>
              <div className="relative">
                <select name="year" required value={form.year} onChange={handleChange} className={selectClass}>
                  <option value="">Select year...</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {arrow}
              </div>
            </div>

            {/* Make */}
            <div>
              <label className={labelClass}>Make *</label>
              <div className="relative">
                <select name="make" required value={form.make} onChange={handleChange} className={selectClass}>
                  <option value="">Select make...</option>
                  {makes.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {arrow}
              </div>
            </div>

            {/* Model */}
            <div>
              <label className={labelClass}>Model *</label>
              <div className="relative">
                <select name="model" required value={form.model} onChange={handleChange}
                  className={`${selectClass} ${!form.make ? disabledSelectClass : ""}`}
                  disabled={!form.make}>
                  <option value="">{form.make ? "Select model..." : "Select a make first"}</option>
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {arrow}
              </div>
            </div>

            {/* Trim */}
            <div>
              <label className={labelClass}>Trim</label>
              {availableTrims.length > 0 && !trimOther ? (
                <div className="relative">
                  <select name="trim_select" value={trimSelectValue} onChange={handleChange} className={selectClass}>
                    <option value="">Select trim...</option>
                    {availableTrims.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value={OTHER}>{OTHER}</option>
                  </select>
                  {arrow}
                </div>
              ) : trimOther ? (
                <div className="flex gap-2">
                  <input name="trim" value={form.trim} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="Type your trim..." autoFocus />
                  <button type="button" onClick={() => { setTrimOther(false); setForm(p => ({ ...p, trim: "" })); }}
                    className="text-zinc-500 hover:text-white text-xs border border-[#2a2a30] rounded-lg px-3 py-2 whitespace-nowrap transition-colors">
                    ← Back
                  </button>
                </div>
              ) : (
                <input name="trim" value={form.trim} onChange={handleChange}
                  className={`${inputClass} ${!form.model ? disabledSelectClass : ""}`}
                  placeholder={form.model ? "e.g. Sport, Limited, GT" : "Select model first"}
                  disabled={!form.model} />
              )}
            </div>

            {/* Engine */}
            <div>
              <label className={labelClass}>Engine</label>
              {availableEngines.length > 0 && !engineOther ? (
                <div className="relative">
                  <select name="engine_select" value={engineSelectValue} onChange={handleChange} className={selectClass}>
                    <option value="">Select engine...</option>
                    {availableEngines.map(eng => <option key={eng} value={eng}>{eng}</option>)}
                    <option value={OTHER}>{OTHER}</option>
                  </select>
                  {arrow}
                </div>
              ) : engineOther ? (
                <div className="flex gap-2">
                  <input name="engine" value={form.engine} onChange={handleChange} className={`${inputClass} flex-1`} placeholder="e.g. 5.7L HEMI V8" autoFocus />
                  <button type="button" onClick={() => { setEngineOther(false); setForm(p => ({ ...p, engine: "" })); }}
                    className="text-zinc-500 hover:text-white text-xs border border-[#2a2a30] rounded-lg px-3 py-2 whitespace-nowrap transition-colors">
                    ← Back
                  </button>
                </div>
              ) : (
                <input name="engine" value={form.engine} onChange={handleChange}
                  className={`${inputClass} ${!form.model ? disabledSelectClass : ""}`}
                  placeholder={form.model ? "e.g. 5.7L HEMI V8, 2.0T" : "Select model first"}
                  disabled={!form.model} />
              )}
            </div>

            {/* Drivetrain */}
            <div>
              <label className={labelClass}>Drivetrain</label>
              <div className="relative">
                <select name="drivetrain" value={form.drivetrain} onChange={handleChange} className={selectClass}>
                  <option value="">Select...</option>
                  {drivetrains.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {arrow}
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className={labelClass}>Transmission</label>
              <div className="relative">
                <select name="transmission" value={form.transmission} onChange={handleChange} className={selectClass}>
                  <option value="">Select...</option>
                  <option value="Manual">Manual (MT)</option>
                  <option value="Automatic">Automatic (AT)</option>
                  <option value="DCT">Dual-Clutch (DCT)</option>
                  <option value="CVT">CVT</option>
                </select>
                {arrow}
              </div>
            </div>

            {/* Mileage */}
            <div className="md:col-span-2">
              <label className={labelClass}>Mileage</label>
              <input name="mileage" value={form.mileage} onChange={handleChange} className={inputClass} placeholder="e.g. 45,000 miles" />
            </div>
          </div>
        </div>

        {/* 4 — Goals */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">4</span>
            Goals & Budget
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Total Modification Budget *</label>
              <div className="relative">
                <select name="budget" required value={form.budget} onChange={handleChange} className={selectClass}>
                  <option value="">Select budget range...</option>
                  {budgetRanges.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                {arrow}
              </div>
            </div>
            <div>
              <label className={labelClass}>Primary Focus *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {focusOptions.map((opt, index) => (
                  <label key={opt} className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 text-sm cursor-pointer transition-all ${form.focus === opt ? "border-purple-500 bg-purple-600/10 text-purple-400" : "border-[#2a2a30] text-zinc-500 hover:border-zinc-600"}`}>
                    <input type="radio" name="focus" value={opt} checked={form.focus === opt} onChange={handleChange} className="sr-only" required={index === 0} />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Your Goals *</label>
              <textarea name="goals" required value={form.goals} onChange={handleChange} rows={4} className={inputClass}
                placeholder="Describe what you want to achieve. More power? Better handling? Turning heads? Racing? Daily drivability?" />
            </div>
          </div>
        </div>

        {/* 5 — Additional */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">5</span>
            Additional Info
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Current Modifications</label>
              <textarea name="currentMods" value={form.currentMods} onChange={handleChange} rows={3} className={inputClass}
                placeholder="List any mods you've already done — intake, exhaust, suspension, wheels, tune, etc." />
            </div>
            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className={inputClass}
                placeholder="Anything else that matters? Daily driver constraints, winter use, track plans, reliability concerns, desired brands, install limits, or aesthetic preferences." />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" size="lg" disabled={loading} className="w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : isEditingVehicle ? "Save Vehicle & Refresh Build Plan" : "Continue to My Build Options"}
          </Button>
          <p className="text-center text-zinc-600 text-xs mt-4">
            Your information is kept private and never sold to third parties.
          </p>
        </div>
      </div>
    </form>
  );
}


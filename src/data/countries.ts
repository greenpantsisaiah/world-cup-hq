import { Country } from "@/lib/types";

export const WORLD_CUP_COUNTRIES: Country[] = [
  // Group A
  { code: "US", name: "United States", flag: "🇺🇸", group: "A", fifaRanking: 11, tier: "contender" },
  { code: "MA", name: "Morocco", flag: "🇲🇦", group: "A", fifaRanking: 14, tier: "contender" },
  { code: "CL", name: "Chile", flag: "🇨🇱", group: "A", fifaRanking: 34, tier: "underdog" },
  { code: "TBD_A4", name: "Playoff Winner A4", flag: "🏳️", group: "A", fifaRanking: 99, tier: "underdog" },

  // Group B
  { code: "FR", name: "France", flag: "🇫🇷", group: "B", fifaRanking: 2, tier: "elite" },
  { code: "DK", name: "Denmark", flag: "🇩🇰", group: "B", fifaRanking: 21, tier: "dark_horse" },
  { code: "CN", name: "China", flag: "🇨🇳", group: "B", fifaRanking: 88, tier: "underdog" },
  { code: "TBD_B4", name: "Playoff Winner B4", flag: "🏳️", group: "B", fifaRanking: 99, tier: "underdog" },

  // Group C
  { code: "AR", name: "Argentina", flag: "🇦🇷", group: "C", fifaRanking: 1, tier: "elite" },
  { code: "PE", name: "Peru", flag: "🇵🇪", group: "C", fifaRanking: 33, tier: "underdog" },
  { code: "EG", name: "Egypt", flag: "🇪🇬", group: "C", fifaRanking: 38, tier: "underdog" },
  { code: "TBD_C4", name: "Playoff Winner C4", flag: "🏳️", group: "C", fifaRanking: 99, tier: "underdog" },

  // Group D
  { code: "JP", name: "Japan", flag: "🇯🇵", group: "D", fifaRanking: 15, tier: "dark_horse" },
  { code: "AU", name: "Australia", flag: "🇦🇺", group: "D", fifaRanking: 24, tier: "dark_horse" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", group: "D", fifaRanking: 89, tier: "underdog" },
  { code: "TBD_D4", name: "Playoff Winner D4", flag: "🏳️", group: "D", fifaRanking: 99, tier: "underdog" },

  // Group E
  { code: "BR", name: "Brazil", flag: "🇧🇷", group: "E", fifaRanking: 5, tier: "elite" },
  { code: "CO", name: "Colombia", flag: "🇨🇴", group: "E", fifaRanking: 12, tier: "contender" },
  { code: "SN", name: "Senegal", flag: "🇸🇳", group: "E", fifaRanking: 20, tier: "dark_horse" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", group: "E", fifaRanking: 80, tier: "underdog" },

  // Group F
  { code: "DE", name: "Germany", flag: "🇩🇪", group: "F", fifaRanking: 3, tier: "elite" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", group: "F", fifaRanking: 9, tier: "contender" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", group: "F", fifaRanking: 22, tier: "dark_horse" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", group: "F", fifaRanking: 79, tier: "underdog" },

  // Group G
  { code: "ES", name: "Spain", flag: "🇪🇸", group: "G", fifaRanking: 4, tier: "elite" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", group: "G", fifaRanking: 28, tier: "dark_horse" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", group: "G", fifaRanking: 36, tier: "dark_horse" },
  { code: "TBD_G4", name: "Playoff Winner G4", flag: "🏳️", group: "G", fifaRanking: 99, tier: "underdog" },

  // Group H
  { code: "PT", name: "Portugal", flag: "🇵🇹", group: "H", fifaRanking: 6, tier: "elite" },
  { code: "IR", name: "Iran", flag: "🇮🇷", group: "H", fifaRanking: 18, tier: "dark_horse" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", group: "H", fifaRanking: 16, tier: "contender" },
  { code: "QA", name: "Qatar", flag: "🇶🇦", group: "H", fifaRanking: 44, tier: "underdog" },

  // Group I
  { code: "GB-ENG", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "I", fifaRanking: 7, tier: "elite" },
  { code: "RS", name: "Serbia", flag: "🇷🇸", group: "I", fifaRanking: 32, tier: "dark_horse" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", group: "I", fifaRanking: 50, tier: "underdog" },
  { code: "TBD_I4", name: "Playoff Winner I4", flag: "🏳️", group: "I", fifaRanking: 99, tier: "underdog" },

  // Group J
  { code: "NL", name: "Netherlands", flag: "🇳🇱", group: "J", fifaRanking: 8, tier: "elite" },
  { code: "CA", name: "Canada", flag: "🇨🇦", group: "J", fifaRanking: 27, tier: "dark_horse" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", group: "J", fifaRanking: 52, tier: "underdog" },
  { code: "TBD_J4", name: "Playoff Winner J4", flag: "🏳️", group: "J", fifaRanking: 99, tier: "underdog" },

  // Group K
  { code: "IT", name: "Italy", flag: "🇮🇹", group: "K", fifaRanking: 10, tier: "contender" },
  { code: "AT", name: "Austria", flag: "🇦🇹", group: "K", fifaRanking: 19, tier: "dark_horse" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", group: "K", fifaRanking: 56, tier: "underdog" },
  { code: "TBD_K4", name: "Playoff Winner K4", flag: "🏳️", group: "K", fifaRanking: 99, tier: "underdog" },

  // Group L
  { code: "BE", name: "Belgium", flag: "🇧🇪", group: "L", fifaRanking: 13, tier: "contender" },
  { code: "HR", name: "Croatia", flag: "🇭🇷", group: "L", fifaRanking: 17, tier: "contender" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", group: "L", fifaRanking: 49, tier: "underdog" },
  { code: "TBD_L4", name: "Playoff Winner L4", flag: "🏳️", group: "L", fifaRanking: 99, tier: "underdog" },
];

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export function getCountryByCode(code: string): Country | undefined {
  return WORLD_CUP_COUNTRIES.find((c) => c.code === code);
}

export function getCountriesByGroup(group: string): Country[] {
  return WORLD_CUP_COUNTRIES.filter((c) => c.group === group);
}

export function getCountriesByTier(tier: Country["tier"]): Country[] {
  return WORLD_CUP_COUNTRIES.filter((c) => c.tier === tier);
}

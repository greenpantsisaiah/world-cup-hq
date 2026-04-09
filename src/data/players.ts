import { Player } from "@/lib/types";

export const PLAYER_POOL: Player[] = [
  // Argentina
  { id: "messi", name: "Lionel Messi", country: "Argentina", countryCode: "AR", position: "FWD", rating: 91 },
  { id: "alvarez", name: "Julián Álvarez", country: "Argentina", countryCode: "AR", position: "FWD", rating: 86 },
  { id: "e-martinez", name: "Emiliano Martínez", country: "Argentina", countryCode: "AR", position: "GK", rating: 88 },
  { id: "de-paul", name: "Rodrigo De Paul", country: "Argentina", countryCode: "AR", position: "MID", rating: 84 },

  // France
  { id: "mbappe", name: "Kylian Mbappé", country: "France", countryCode: "FR", position: "FWD", rating: 93 },
  { id: "griezmann", name: "Antoine Griezmann", country: "France", countryCode: "FR", position: "FWD", rating: 86 },
  { id: "tchouameni", name: "Aurélien Tchouaméni", country: "France", countryCode: "FR", position: "MID", rating: 86 },
  { id: "saliba", name: "William Saliba", country: "France", countryCode: "FR", position: "DEF", rating: 87 },

  // Brazil
  { id: "vinicius", name: "Vinícius Jr.", country: "Brazil", countryCode: "BR", position: "FWD", rating: 93 },
  { id: "rodrygo", name: "Rodrygo", country: "Brazil", countryCode: "BR", position: "FWD", rating: 86 },
  { id: "casemiro", name: "Casemiro", country: "Brazil", countryCode: "BR", position: "MID", rating: 85 },
  { id: "alisson", name: "Alisson", country: "Brazil", countryCode: "BR", position: "GK", rating: 89 },

  // England
  { id: "bellingham", name: "Jude Bellingham", country: "England", countryCode: "GB-ENG", position: "MID", rating: 91 },
  { id: "saka", name: "Bukayo Saka", country: "England", countryCode: "GB-ENG", position: "FWD", rating: 88 },
  { id: "rice", name: "Declan Rice", country: "England", countryCode: "GB-ENG", position: "MID", rating: 87 },
  { id: "kane", name: "Harry Kane", country: "England", countryCode: "GB-ENG", position: "FWD", rating: 89 },

  // Spain
  { id: "yamal", name: "Lamine Yamal", country: "Spain", countryCode: "ES", position: "FWD", rating: 88 },
  { id: "pedri", name: "Pedri", country: "Spain", countryCode: "ES", position: "MID", rating: 88 },
  { id: "rodri", name: "Rodri", country: "Spain", countryCode: "ES", position: "MID", rating: 91 },
  { id: "carvajal", name: "Dani Carvajal", country: "Spain", countryCode: "ES", position: "DEF", rating: 87 },

  // Germany
  { id: "musiala", name: "Jamal Musiala", country: "Germany", countryCode: "DE", position: "MID", rating: 88 },
  { id: "wirtz", name: "Florian Wirtz", country: "Germany", countryCode: "DE", position: "MID", rating: 88 },
  { id: "havertz", name: "Kai Havertz", country: "Germany", countryCode: "DE", position: "FWD", rating: 84 },
  { id: "neuer", name: "Manuel Neuer", country: "Germany", countryCode: "DE", position: "GK", rating: 86 },

  // Portugal
  { id: "ronaldo", name: "Cristiano Ronaldo", country: "Portugal", countryCode: "PT", position: "FWD", rating: 84 },
  { id: "b-silva", name: "Bernardo Silva", country: "Portugal", countryCode: "PT", position: "MID", rating: 88 },
  { id: "r-dias", name: "Rúben Dias", country: "Portugal", countryCode: "PT", position: "DEF", rating: 87 },
  { id: "b-fernandes", name: "Bruno Fernandes", country: "Portugal", countryCode: "PT", position: "MID", rating: 87 },

  // Netherlands
  { id: "gakpo", name: "Cody Gakpo", country: "Netherlands", countryCode: "NL", position: "FWD", rating: 84 },
  { id: "de-jong", name: "Frenkie de Jong", country: "Netherlands", countryCode: "NL", position: "MID", rating: 85 },
  { id: "van-dijk", name: "Virgil van Dijk", country: "Netherlands", countryCode: "NL", position: "DEF", rating: 88 },

  // Italy
  { id: "donnarumma", name: "Gianluigi Donnarumma", country: "Italy", countryCode: "IT", position: "GK", rating: 87 },
  { id: "barella", name: "Nicolò Barella", country: "Italy", countryCode: "IT", position: "MID", rating: 86 },
  { id: "chiesa", name: "Federico Chiesa", country: "Italy", countryCode: "IT", position: "FWD", rating: 82 },

  // Belgium
  { id: "de-bruyne", name: "Kevin De Bruyne", country: "Belgium", countryCode: "BE", position: "MID", rating: 89 },
  { id: "lukaku", name: "Romelu Lukaku", country: "Belgium", countryCode: "BE", position: "FWD", rating: 84 },
  { id: "doku", name: "Jérémy Doku", country: "Belgium", countryCode: "BE", position: "FWD", rating: 83 },

  // Croatia
  { id: "modric", name: "Luka Modrić", country: "Croatia", countryCode: "HR", position: "MID", rating: 85 },
  { id: "gvardiol", name: "Josko Gvardiol", country: "Croatia", countryCode: "HR", position: "DEF", rating: 86 },

  // Uruguay
  { id: "nunez", name: "Darwin Núñez", country: "Uruguay", countryCode: "UY", position: "FWD", rating: 84 },
  { id: "valverde", name: "Federico Valverde", country: "Uruguay", countryCode: "UY", position: "MID", rating: 88 },

  // Colombia
  { id: "l-diaz", name: "Luis Díaz", country: "Colombia", countryCode: "CO", position: "FWD", rating: 85 },
  { id: "james", name: "James Rodríguez", country: "Colombia", countryCode: "CO", position: "MID", rating: 80 },

  // United States
  { id: "pulisic", name: "Christian Pulisic", country: "United States", countryCode: "US", position: "FWD", rating: 84 },
  { id: "mckennie", name: "Weston McKennie", country: "United States", countryCode: "US", position: "MID", rating: 79 },
  { id: "reyna", name: "Gio Reyna", country: "United States", countryCode: "US", position: "MID", rating: 78 },
  { id: "weah", name: "Timothy Weah", country: "United States", countryCode: "US", position: "FWD", rating: 78 },

  // Mexico
  { id: "lozano", name: "Hirving Lozano", country: "Mexico", countryCode: "MX", position: "FWD", rating: 79 },
  { id: "edson", name: "Edson Álvarez", country: "Mexico", countryCode: "MX", position: "MID", rating: 82 },

  // Japan
  { id: "mitoma", name: "Kaoru Mitoma", country: "Japan", countryCode: "JP", position: "FWD", rating: 82 },
  { id: "kubo", name: "Takefusa Kubo", country: "Japan", countryCode: "JP", position: "FWD", rating: 81 },
  { id: "kamada", name: "Daichi Kamada", country: "Japan", countryCode: "JP", position: "MID", rating: 80 },

  // South Korea
  { id: "son", name: "Son Heung-min", country: "South Korea", countryCode: "KR", position: "FWD", rating: 87 },

  // Morocco
  { id: "hakimi", name: "Achraf Hakimi", country: "Morocco", countryCode: "MA", position: "DEF", rating: 86 },
  { id: "en-nesyri", name: "Youssef En-Nesyri", country: "Morocco", countryCode: "MA", position: "FWD", rating: 79 },

  // Senegal
  { id: "mane", name: "Sadio Mané", country: "Senegal", countryCode: "SN", position: "FWD", rating: 82 },

  // Egypt
  { id: "salah", name: "Mohamed Salah", country: "Egypt", countryCode: "EG", position: "FWD", rating: 89 },

  // Canada
  { id: "david", name: "Jonathan David", country: "Canada", countryCode: "CA", position: "FWD", rating: 82 },
  { id: "davies", name: "Alphonso Davies", country: "Canada", countryCode: "CA", position: "DEF", rating: 84 },

  // Austria
  { id: "alaba", name: "David Alaba", country: "Austria", countryCode: "AT", position: "DEF", rating: 82 },

  // Denmark
  { id: "hojlund", name: "Rasmus Højlund", country: "Denmark", countryCode: "DK", position: "FWD", rating: 80 },
  { id: "eriksen", name: "Christian Eriksen", country: "Denmark", countryCode: "DK", position: "MID", rating: 80 },

  // Ecuador
  { id: "valencia", name: "Enner Valencia", country: "Ecuador", countryCode: "EC", position: "FWD", rating: 77 },

  // Serbia
  { id: "vlahovic", name: "Dušan Vlahović", country: "Serbia", countryCode: "RS", position: "FWD", rating: 83 },
];

export function getPlayerById(id: string): Player | undefined {
  return PLAYER_POOL.find((p) => p.id === id);
}

export function getPlayersByCountry(countryCode: string): Player[] {
  return PLAYER_POOL.filter((p) => p.countryCode === countryCode);
}

export function getPlayersByPosition(position: Player["position"]): Player[] {
  return PLAYER_POOL.filter((p) => p.position === position);
}

/**
 * Country dial-code data for phone inputs (shared by the lead-capture modal;
 * the paid /checkout keeps its own inline copy). `minLen`/`maxLen` = expected
 * subscriber-digit count excluding the dial code. India first, then A–Z.
 */
export type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  minLen: number;
  maxLen: number;
  placeholder: string;
};

export const COUNTRIES: Country[] = [
  { iso: "IN", name: "India",                dial: "+91",  flag: "🇮🇳", minLen: 10, maxLen: 10, placeholder: "98765 43210" },
  { iso: "AF", name: "Afghanistan",          dial: "+93",  flag: "🇦🇫", minLen: 9,  maxLen: 9,  placeholder: "70 123 4567" },
  { iso: "AL", name: "Albania",              dial: "+355", flag: "🇦🇱", minLen: 8,  maxLen: 9,  placeholder: "66 123 4567" },
  { iso: "DZ", name: "Algeria",              dial: "+213", flag: "🇩🇿", minLen: 9,  maxLen: 9,  placeholder: "551 23 45 67" },
  { iso: "AR", name: "Argentina",            dial: "+54",  flag: "🇦🇷", minLen: 10, maxLen: 11, placeholder: "11 1234 5678" },
  { iso: "AM", name: "Armenia",              dial: "+374", flag: "🇦🇲", minLen: 8,  maxLen: 8,  placeholder: "77 123456" },
  { iso: "AU", name: "Australia",            dial: "+61",  flag: "🇦🇺", minLen: 9,  maxLen: 9,  placeholder: "412 345 678" },
  { iso: "AT", name: "Austria",              dial: "+43",  flag: "🇦🇹", minLen: 10, maxLen: 11, placeholder: "664 1234567" },
  { iso: "AZ", name: "Azerbaijan",           dial: "+994", flag: "🇦🇿", minLen: 9,  maxLen: 9,  placeholder: "40 123 45 67" },
  { iso: "BH", name: "Bahrain",              dial: "+973", flag: "🇧🇭", minLen: 8,  maxLen: 8,  placeholder: "3600 1234" },
  { iso: "BD", name: "Bangladesh",           dial: "+880", flag: "🇧🇩", minLen: 10, maxLen: 10, placeholder: "1812-345678" },
  { iso: "BE", name: "Belgium",              dial: "+32",  flag: "🇧🇪", minLen: 8,  maxLen: 9,  placeholder: "470 12 34 56" },
  { iso: "BR", name: "Brazil",               dial: "+55",  flag: "🇧🇷", minLen: 10, maxLen: 11, placeholder: "11 91234-5678" },
  { iso: "BG", name: "Bulgaria",             dial: "+359", flag: "🇧🇬", minLen: 8,  maxLen: 9,  placeholder: "87 123 4567" },
  { iso: "KH", name: "Cambodia",             dial: "+855", flag: "🇰🇭", minLen: 8,  maxLen: 9,  placeholder: "91 234 567" },
  { iso: "CA", name: "Canada",               dial: "+1",   flag: "🇨🇦", minLen: 10, maxLen: 10, placeholder: "(416) 555-0123" },
  { iso: "CL", name: "Chile",                dial: "+56",  flag: "🇨🇱", minLen: 8,  maxLen: 9,  placeholder: "2 2123 4567" },
  { iso: "CN", name: "China",                dial: "+86",  flag: "🇨🇳", minLen: 11, maxLen: 11, placeholder: "131 2345 6789" },
  { iso: "CO", name: "Colombia",             dial: "+57",  flag: "🇨🇴", minLen: 10, maxLen: 10, placeholder: "321 1234567" },
  { iso: "CR", name: "Costa Rica",           dial: "+506", flag: "🇨🇷", minLen: 8,  maxLen: 8,  placeholder: "8312 3456" },
  { iso: "HR", name: "Croatia",              dial: "+385", flag: "🇭🇷", minLen: 8,  maxLen: 9,  placeholder: "91 234 5678" },
  { iso: "CY", name: "Cyprus",               dial: "+357", flag: "🇨🇾", minLen: 8,  maxLen: 8,  placeholder: "96 123456" },
  { iso: "CZ", name: "Czech Republic",       dial: "+420", flag: "🇨🇿", minLen: 9,  maxLen: 9,  placeholder: "601 123 456" },
  { iso: "DK", name: "Denmark",              dial: "+45",  flag: "🇩🇰", minLen: 8,  maxLen: 8,  placeholder: "20 12 34 56" },
  { iso: "DO", name: "Dominican Republic",   dial: "+1",   flag: "🇩🇴", minLen: 10, maxLen: 10, placeholder: "809 234 5678" },
  { iso: "EC", name: "Ecuador",              dial: "+593", flag: "🇪🇨", minLen: 8,  maxLen: 9,  placeholder: "99 123 4567" },
  { iso: "EG", name: "Egypt",                dial: "+20",  flag: "🇪🇬", minLen: 10, maxLen: 10, placeholder: "100 123 4567" },
  { iso: "EE", name: "Estonia",              dial: "+372", flag: "🇪🇪", minLen: 7,  maxLen: 8,  placeholder: "5123 4567" },
  { iso: "ET", name: "Ethiopia",             dial: "+251", flag: "🇪🇹", minLen: 9,  maxLen: 9,  placeholder: "91 123 4567" },
  { iso: "FI", name: "Finland",              dial: "+358", flag: "🇫🇮", minLen: 9,  maxLen: 10, placeholder: "41 234 5678" },
  { iso: "FR", name: "France",               dial: "+33",  flag: "🇫🇷", minLen: 9,  maxLen: 9,  placeholder: "6 12 34 56 78" },
  { iso: "GE", name: "Georgia",              dial: "+995", flag: "🇬🇪", minLen: 9,  maxLen: 9,  placeholder: "555 12 34 56" },
  { iso: "DE", name: "Germany",              dial: "+49",  flag: "🇩🇪", minLen: 10, maxLen: 11, placeholder: "151 23456789" },
  { iso: "GH", name: "Ghana",                dial: "+233", flag: "🇬🇭", minLen: 9,  maxLen: 9,  placeholder: "24 123 4567" },
  { iso: "GR", name: "Greece",               dial: "+30",  flag: "🇬🇷", minLen: 10, maxLen: 10, placeholder: "691 234 5678" },
  { iso: "HK", name: "Hong Kong",            dial: "+852", flag: "🇭🇰", minLen: 8,  maxLen: 8,  placeholder: "5123 4567" },
  { iso: "HU", name: "Hungary",              dial: "+36",  flag: "🇭🇺", minLen: 8,  maxLen: 9,  placeholder: "20 123 4567" },
  { iso: "IS", name: "Iceland",              dial: "+354", flag: "🇮🇸", minLen: 7,  maxLen: 7,  placeholder: "611 1234" },
  { iso: "ID", name: "Indonesia",            dial: "+62",  flag: "🇮🇩", minLen: 9,  maxLen: 12, placeholder: "812-3456-7890" },
  { iso: "IR", name: "Iran",                 dial: "+98",  flag: "🇮🇷", minLen: 10, maxLen: 10, placeholder: "912 345 6789" },
  { iso: "IQ", name: "Iraq",                 dial: "+964", flag: "🇮🇶", minLen: 10, maxLen: 10, placeholder: "791 234 5678" },
  { iso: "IE", name: "Ireland",              dial: "+353", flag: "🇮🇪", minLen: 9,  maxLen: 9,  placeholder: "85 123 4567" },
  { iso: "IL", name: "Israel",               dial: "+972", flag: "🇮🇱", minLen: 9,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "IT", name: "Italy",                dial: "+39",  flag: "🇮🇹", minLen: 9,  maxLen: 11, placeholder: "312 345 6789" },
  { iso: "JP", name: "Japan",                dial: "+81",  flag: "🇯🇵", minLen: 10, maxLen: 11, placeholder: "90-1234-5678" },
  { iso: "JO", name: "Jordan",               dial: "+962", flag: "🇯🇴", minLen: 9,  maxLen: 9,  placeholder: "7 9012 3456" },
  { iso: "KZ", name: "Kazakhstan",           dial: "+7",   flag: "🇰🇿", minLen: 10, maxLen: 10, placeholder: "771 234 5678" },
  { iso: "KE", name: "Kenya",                dial: "+254", flag: "🇰🇪", minLen: 9,  maxLen: 9,  placeholder: "712 123456" },
  { iso: "KW", name: "Kuwait",               dial: "+965", flag: "🇰🇼", minLen: 8,  maxLen: 8,  placeholder: "500 12345" },
  { iso: "LV", name: "Latvia",               dial: "+371", flag: "🇱🇻", minLen: 8,  maxLen: 8,  placeholder: "2 123 4567" },
  { iso: "LB", name: "Lebanon",              dial: "+961", flag: "🇱🇧", minLen: 7,  maxLen: 8,  placeholder: "71 123 456" },
  { iso: "LT", name: "Lithuania",            dial: "+370", flag: "🇱🇹", minLen: 8,  maxLen: 8,  placeholder: "612 34567" },
  { iso: "LU", name: "Luxembourg",           dial: "+352", flag: "🇱🇺", minLen: 8,  maxLen: 9,  placeholder: "628 123 456" },
  { iso: "MY", name: "Malaysia",             dial: "+60",  flag: "🇲🇾", minLen: 9,  maxLen: 10, placeholder: "12-345 6789" },
  { iso: "MV", name: "Maldives",             dial: "+960", flag: "🇲🇻", minLen: 7,  maxLen: 7,  placeholder: "771 2345" },
  { iso: "MT", name: "Malta",                dial: "+356", flag: "🇲🇹", minLen: 8,  maxLen: 8,  placeholder: "9696 1234" },
  { iso: "MX", name: "Mexico",               dial: "+52",  flag: "🇲🇽", minLen: 10, maxLen: 10, placeholder: "55 1234 5678" },
  { iso: "MA", name: "Morocco",              dial: "+212", flag: "🇲🇦", minLen: 9,  maxLen: 9,  placeholder: "650-123456" },
  { iso: "NP", name: "Nepal",                dial: "+977", flag: "🇳🇵", minLen: 10, maxLen: 10, placeholder: "984-1234567" },
  { iso: "NL", name: "Netherlands",          dial: "+31",  flag: "🇳🇱", minLen: 9,  maxLen: 9,  placeholder: "6 12345678" },
  { iso: "NZ", name: "New Zealand",          dial: "+64",  flag: "🇳🇿", minLen: 9,  maxLen: 10, placeholder: "21 123 4567" },
  { iso: "NG", name: "Nigeria",              dial: "+234", flag: "🇳🇬", minLen: 10, maxLen: 10, placeholder: "802 123 4567" },
  { iso: "NO", name: "Norway",               dial: "+47",  flag: "🇳🇴", minLen: 8,  maxLen: 8,  placeholder: "406 12 345" },
  { iso: "OM", name: "Oman",                 dial: "+968", flag: "🇴🇲", minLen: 8,  maxLen: 8,  placeholder: "9212 3456" },
  { iso: "PK", name: "Pakistan",             dial: "+92",  flag: "🇵🇰", minLen: 10, maxLen: 10, placeholder: "301 2345678" },
  { iso: "PA", name: "Panama",               dial: "+507", flag: "🇵🇦", minLen: 7,  maxLen: 8,  placeholder: "6123-4567" },
  { iso: "PE", name: "Peru",                 dial: "+51",  flag: "🇵🇪", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "PH", name: "Philippines",          dial: "+63",  flag: "🇵🇭", minLen: 10, maxLen: 10, placeholder: "905 123 4567" },
  { iso: "PL", name: "Poland",               dial: "+48",  flag: "🇵🇱", minLen: 9,  maxLen: 9,  placeholder: "501 234 567" },
  { iso: "PT", name: "Portugal",             dial: "+351", flag: "🇵🇹", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "QA", name: "Qatar",                dial: "+974", flag: "🇶🇦", minLen: 8,  maxLen: 8,  placeholder: "3312 3456" },
  { iso: "RO", name: "Romania",              dial: "+40",  flag: "🇷🇴", minLen: 9,  maxLen: 9,  placeholder: "712 034 567" },
  { iso: "RU", name: "Russia",               dial: "+7",   flag: "🇷🇺", minLen: 10, maxLen: 10, placeholder: "912 345-67-89" },
  { iso: "SA", name: "Saudi Arabia",         dial: "+966", flag: "🇸🇦", minLen: 9,  maxLen: 9,  placeholder: "51 234 5678" },
  { iso: "RS", name: "Serbia",               dial: "+381", flag: "🇷🇸", minLen: 8,  maxLen: 9,  placeholder: "60 1234567" },
  { iso: "SG", name: "Singapore",            dial: "+65",  flag: "🇸🇬", minLen: 8,  maxLen: 8,  placeholder: "8123 4567" },
  { iso: "SK", name: "Slovakia",             dial: "+421", flag: "🇸🇰", minLen: 9,  maxLen: 9,  placeholder: "912 123 456" },
  { iso: "SI", name: "Slovenia",             dial: "+386", flag: "🇸🇮", minLen: 8,  maxLen: 8,  placeholder: "31 234 567" },
  { iso: "ZA", name: "South Africa",         dial: "+27",  flag: "🇿🇦", minLen: 9,  maxLen: 9,  placeholder: "71 123 4567" },
  { iso: "KR", name: "South Korea",          dial: "+82",  flag: "🇰🇷", minLen: 9,  maxLen: 10, placeholder: "10-1234-5678" },
  { iso: "ES", name: "Spain",                dial: "+34",  flag: "🇪🇸", minLen: 9,  maxLen: 9,  placeholder: "612 34 56 78" },
  { iso: "LK", name: "Sri Lanka",            dial: "+94",  flag: "🇱🇰", minLen: 9,  maxLen: 9,  placeholder: "71 234 5678" },
  { iso: "SE", name: "Sweden",               dial: "+46",  flag: "🇸🇪", minLen: 9,  maxLen: 9,  placeholder: "70 123 45 67" },
  { iso: "CH", name: "Switzerland",          dial: "+41",  flag: "🇨🇭", minLen: 9,  maxLen: 9,  placeholder: "78 123 45 67" },
  { iso: "TW", name: "Taiwan",               dial: "+886", flag: "🇹🇼", minLen: 9,  maxLen: 9,  placeholder: "912 345 678" },
  { iso: "TZ", name: "Tanzania",             dial: "+255", flag: "🇹🇿", minLen: 9,  maxLen: 9,  placeholder: "621 234 567" },
  { iso: "TH", name: "Thailand",             dial: "+66",  flag: "🇹🇭", minLen: 9,  maxLen: 9,  placeholder: "812 345 678" },
  { iso: "TR", name: "Turkey",               dial: "+90",  flag: "🇹🇷", minLen: 10, maxLen: 10, placeholder: "532 123 4567" },
  { iso: "UG", name: "Uganda",               dial: "+256", flag: "🇺🇬", minLen: 9,  maxLen: 9,  placeholder: "712 345 678" },
  { iso: "UA", name: "Ukraine",              dial: "+380", flag: "🇺🇦", minLen: 9,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "AE", name: "UAE",                  dial: "+971", flag: "🇦🇪", minLen: 8,  maxLen: 9,  placeholder: "50 123 4567" },
  { iso: "GB", name: "United Kingdom",       dial: "+44",  flag: "🇬🇧", minLen: 10, maxLen: 10, placeholder: "7700 900000" },
  { iso: "US", name: "United States",        dial: "+1",   flag: "🇺🇸", minLen: 10, maxLen: 10, placeholder: "(415) 555-0123" },
  { iso: "UY", name: "Uruguay",              dial: "+598", flag: "🇺🇾", minLen: 8,  maxLen: 8,  placeholder: "94 231 234" },
  { iso: "UZ", name: "Uzbekistan",           dial: "+998", flag: "🇺🇿", minLen: 9,  maxLen: 9,  placeholder: "91 123 45 67" },
  { iso: "VE", name: "Venezuela",            dial: "+58",  flag: "🇻🇪", minLen: 10, maxLen: 10, placeholder: "412 1234567" },
  { iso: "VN", name: "Vietnam",              dial: "+84",  flag: "🇻🇳", minLen: 9,  maxLen: 10, placeholder: "91 234 56 78" },
  { iso: "YE", name: "Yemen",                dial: "+967", flag: "🇾🇪", minLen: 9,  maxLen: 9,  placeholder: "712 345 678" },
  { iso: "ZM", name: "Zambia",               dial: "+260", flag: "🇿🇲", minLen: 9,  maxLen: 9,  placeholder: "955 123 456" },
];

export const DEFAULT_COUNTRY = "IN";

export function getCountry(iso: string): Country {
  return COUNTRIES.find((c) => c.iso === iso) ?? COUNTRIES[0];
}

export function digitsOnly(s: string): string {
  return s.replace(/\D+/g, "");
}

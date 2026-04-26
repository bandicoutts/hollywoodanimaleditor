export interface PerkGroup {
  label: string;
  color: string;
  perks: string[];
}

// Human-readable labels sourced from: Buildings.json (BLDG_ perks), Presents.json (WG_/BG_),
// in-game research tree screenshots, and Perks.json dependency tree cross-reference.
// Unrecognised IDs fall back to auto-formatting in formatPerkLabel().
export const PERK_LABELS: Record<string, string> = {
  // ── Buildings ─────────────────────────────────────────────────────────────────
  BLDG_RND_II:             "Research Group 3",
  BLDG_RND_III:            "Research Group 4",
  BLDG_RND_IV:             "Research Group 5",
  BLDG_POWERPLANT_II:      "Power Plant II",
  BLDG_POWERPLANT_III:     "Power Plant III",
  BLDG_WATER_TOWER_II:     "Water Tower II",
  BLDG_WATER_TOWER_III:    "Water Tower III",
  BLDG_CONSTRUCTOR:        "Constructor",
  BLDG_FREELANCE:          "Freelance Office",
  BLDG_SUPPLY:             "Supply",
  BLDG_CASTING:            "Casting Office",
  BLDG_SCOUT:              "Scouting Office",
  BLDG_WORKSHOP:           "Sets and Props",
  BLDG_LINE_PRODUCTION:    "Line Production Office",
  BLDG_LOGISTICS:          "Production Support",
  BLDG_PAVILION_II:        "Level 2 Soundstage",
  BLDG_PAVILION_III:       "Level 3 Soundstage",
  BLDG_PAVILION_IV:        "Level 4 Soundstage",
  BLDG_SOUND:              "Sound Studio",
  BLDG_CONCERT:            "Concert Hall",
  BLDG_LAB:                "Film Lab",
  BLDG_DISTRIBUTION:       "Distribution Department",
  BLDG_ANALYTICS:          "Analytics and Statistics",
  BLDG_PRINT:              "Printing Office",
  BLDG_MARKETING:          "Marketing and Outreach",
  BLDG_SHENANIGANS:        "Offensive Operations",
  BLDG_SPIES:              "Defensive Operations",
  BLDG_ESCORT_DOMINION:    "Escort Dominion",
  BLDG_EVENTS_STAGE:       "Events Stage",
  BLDG_POWERPLANT_I:       "Power Plant",
  BLDG_WATER_TOWER_I:      "Water Tower",
  BLDG_RND_I:              "Research Group 2",

  // ── Maintenance ───────────────────────────────────────────────────────────────
  REPAIR_TEAM_1:           "Repair Crew",
  IMPROVEMENT_I:           "Medium Landscaping",

  // ── Legal Department ──────────────────────────────────────────────────────────
  LEGAL_DEFENSE_1:                "Mid-level legal protection",
  LEGAL_DEFENSE_2:                "High-level legal protection",
  LEGAL_DEFENSE_3:                "Amazing legal protection",
  CONTRACT_PAYMENTS_50_50:        "Delay contract payment",
  CONTRACT_TERMINATION_FEE_1:     "Full recuperation",
  CONTRACT_5_MOVIES:              "5 film contract",
  CONTRACT_10_MOVIES:             "10 film contract",
  CONTRACT_5_YEARS:               "5 year contract",
  CONTRACT_10_YEARS:              "10 year contract",

  // ── Financial Department ──────────────────────────────────────────────────────
  BANK_LOAN:                      "$1,000,000 loan",
  BANK_LOAN_EARLY_REPAYMENT:      "Early repayment",
  BANK_LOAN_INT_RATE_REDUCTION_1: "Loan at 18%",
  BANK_LOAN_INT_RATE_REDUCTION_2: "Loan at 14%",
  BANK_LOAN_TERM_1:               "3 year loan",
  BANK_LOAN_TERM_2:               "5 year loan",
  CASH_FLOW_1:                    "$500 cash per month",
  CASH_FLOW_2:                    "$1,500 cash per month",

  // ── HR Department ─────────────────────────────────────────────────────────────
  ETHNIC_COMPOSITION:         "Ethnic composition",
  ILLEGAL_WORKERS:            "Illegals",
  CHEAP_ILLEGALS:             "Cheap illegals",
  BUILDINGS_CONSERVATION:     "Mothball buildings",
  CONSERVATION_COOLDOWN:      "Agile mothballing",
  SALARY_CUT:                 "Cheaper while closed",
  IMPROVEMENT_0_NO_SADNESS:   "Ascetic Staff",
  HIRING_BONUSES:             "Enthusiastic newbies",
  NOMINATION_LOSS_NO_SADNESS: "Professional achievement",
  MOVIE_RELEASE_MOOD_BOOST:   "Positive attitude",
  BAD_ATTITUDE_NO_SADNESS:    "Philosophical perspective",

  // ── PR Department ─────────────────────────────────────────────────────────────
  CHARITY_TO_REP:          "Charity",
  GENERATION_IP_AND_REP:   "Generate IP or Reputation",
  GENERATION_IP_X2:        "Double IP Generation",
  GENERATION_REP_X2:       "Double Reputation Generation",
  PROFITABLE_MOVIE_REP_2:  "Double Reputation for Profitable Films",
  GOOD_ATTITUDE_REP_1:     "Reputation for Loyalty",
  GOOD_ATTITUDE_REP_2:     "Double Reputation for Loyalty",
  ICON_REP_1:              "Double Reputation for Loans",
  LEGEND_REP_1:            "Double Reputation for Idols",
  TOP1_TOP3:               "IP and Reputation for Top 3",
  TECH_SALE_PP:            "Double IP for Selling Technologies",
  SKILLED_ACTOR_REP:       "Reputation Boost for Hiring Actors",
  INITIATIVE_PP_FREE:      "Owning the Initiative",

  // ── Script Department ─────────────────────────────────────────────────────────
  SCREENPLAY_TIME_RED_1:        "Writers write 15% faster",
  SCREENPLAY_TIME_RED_2:        "Writers write 30% faster",
  SCREENPLAY_TIME_RED_3:        "Writers write twice as fast",
  NEW_SCREENPLAY_XP_BONUS_1:    "Additional 15% exp per script",
  NEW_SCREENPLAY_XP_BONUS_2:    "Additional 30% exp per script",
  NEW_SCREENPLAY_XP_BONUS_3:    "Additional 50% exp per script",
  NEW_SCREENPLAY_PP_BONUS_1:    "Double IP per script",
  NEW_SCREENPLAY_PP_BONUS_2:    "Triple IP per script",
  SCEN_IDEAS_STORAGE_1:         "Story Ideas last +6 months",
  SCEN_IDEAS_GEN_AMT_1:         "3–4 Story Ideas per month",
  SCEN_IDEAS_GEN_AMT_2:         "5–6 Story Ideas per month",
  EDITS_ON_GO:                  "Rolling edits",
  SCRIPT_DOCTORS:               "Script Doctor",
  SCRIPT_DOCTORS_FASTER:        "Faster script doctor",
  SCRIPT_DOCTORS_CHEAPER:       "Cheaper script doctor",
  SCRIPT_DOCTORS_RANGE:         "Hard working script doctor",
  SCRIPT_DOCTORS_SCORES:        "More careful script doctor",
  MOVIE_RELEASE_XP_1:           "Additional 25% exp per release",
  MOVIE_RELEASE_XP_2:           "Additional 50% exp per release",
  MOVIE_RELEASE_XP_3:           "Additional 100% exp per release",
  MOVIE_RELEASE_TOP10_ART_XP_1: "Experience for critical acclaim",
  MOVIE_RELEASE_TOP10_AUD_XP_1: "Experience for high ticket sales",
  MOVIE_RELEASE_TOP10_COM_XP_1: "Experience for recognition by the audience",
  MOVIE_SEQUEL_ORIGINALITY:     "Fresh take",
  MOVIE_SEQUEL_LEGACY:          "Worthy successor",

  // ── Pre-Production ────────────────────────────────────────────────────────────
  PREPROD_PROD_DIR_CIN_XP_1: "Exp for directors and cinematographers",
  PREPROD_PROD_DIR_CIN_XP_2: "Double exp for directors and cinematographers",
  EXTRAS_2:                  "Up to 100 extras",
  EXTRAS_3:                  "Up to 500 extras",
  EXTRAS_4:                  "Over 500 extras",
  LOCATION_QLT_1:            "High quality locations",
  LOCATION_QLT_2:            "Amazing locations",
  LOCATION_SEARCH_TIME_1:    "Scouts work 20% faster",
  LOCATION_SEARCH_TIME_2:    "Scouts work 40% faster",
  LOCATION_SEARCH_WORLD:     "International location scouting",
  SETS_QLT_2:                "High quality sets",
  SETS_QLT_3:                "Amazing quality sets",
  SETS_TIME_RED_1:           "Sets and Props staff work 10% faster",
  SETS_TIME_RED_2:           "Sets and Props staff work 20% faster",
  SETS_TIME_RED_3:           "Sets and Props staff work 30% faster",
  PROPS_QLT_2:               "High quality costumes and props",
  PROPS_QLT_3:               "Amazing quality costumes and props",

  // ── Production Department ─────────────────────────────────────────────────────
  PROD_DIR_CIN_ACT_XP_1: "Doubles for directors, actors and cinematographers",
  SECOND_UNIT:           "Auxiliary Film Crew",
  URGENT_DOUBLE_SEARCH:  "Emergency search for double",
  URGENT_EXTRAS_SEARCH:  "Emergency search for extras",
  URGENT_CREW_SEARCH:    "Emergency search for technical personnel",
  URGENT_LOCATION_SEARCH:"Emergency location search",
  FLEX_SCHEDULE:         "Flexible schedule",
  TEAM_SERVICE_1:        "High service level",
  TEAM_SERVICE_2:        "Exceptional service level",

  // ── Producers Offices ─────────────────────────────────────────────────────────
  NEGOTIATION_SCALE_50:  "50% of the request",
  NEGOTIATION_SCALE_75:  "75% of the request",
  TWO_PROJECTS:          "Two projects per producer",
  CONTRACT_WEIGHT:       "Influential producer",
  PRODUCERS_ON_FILM_2:   "Two producers per project",
  PRODUCERS_ON_FILM_3:   "Three producers per project",

  // ── Tags & Research ───────────────────────────────────────────────────────────
  TAGS_RESEARCH:              "Story element research",
  TAGS_SLOTS_6:               "Tag slot 6",
  TAGS_SLOTS_7:               "Tag slot 7",
  TAGS_SLOTS_8:               "Tag slot 8",
  TAGS_SLOTS_9:               "Tag slot 9",
  TAGS_SLOTS_10:              "Tag slot 10",
  TAGS_RESEARCH_DIRECTION:    "Research direction",
  TAGS_RESEARCH_TIME_RED_1:   "Research 25% faster",
  TAGS_RESEARCH_TIME_RED_2:   "Research 50% faster",
  TAGS_RESEARCH_TIME_RED_3:   "Research twice as fast",
  TAGS_XP_BONUS_1:            "25% more XP per story element",
  TAGS_XP_BONUS_2:            "50% more XP per story element",
  TAGS_XP_BONUS_3:            "Double XP per story element",
  TAGS_NEW_PP_BONUS:          "IP for new story elements",
  NEW_TAG_BY_LT_1:            "Lieutenant researches tags",
  NEW_TAG_BY_LT_2:            "Lieutenant researches tags faster",

  // ── Engineering ───────────────────────────────────────────────────────────────
  STUDIO_TECH:           "Technology Incentive",
  STUDIO_TECH_ADD_RND:   "Additional research groups",
  STUDIO_TECH_RED_TIME_1:"Invention speed +25%",
  STUDIO_TECH_RED_TIME_2:"Invention speed +50%",

  // ── Security ──────────────────────────────────────────────────────────────────
  SHENANIGANS_BEATING:          "Beatings",
  SHENANIGANS_KIDNAPPING:       "Kidnapping",
  SHENANIGANS_MURDER:           "Murder",
  LEAK_RISK_REDUCE_1:           "Reliable Cover",
  SPYING_SINS:                  "Compromising Information",
  SPYING_ILLEGALPREFERENCES:    "Illegal Tendencies",
  SPYING_XP_BONUS_1:            "50% more experience for information",
  SPYING_XP_BONUS_2:            "Double experience for information",
  FAIL_NO_DISCLOSURE:           "Search for information without risk of exposure",
  ACTIVE_PROTECTION:            "Enhanced Protection",
  ACTIVE_PROTECTION_XP_BONUS_1: "90% more experience for repelling an attack",
  ACTIVE_PROTECTION_XP_BONUS_2: "Double experience for repelling an attack",
  SECRETS_HIDE_EFFECT_BOOST:    "Secret keepers",
  FAIL_DISCLOSURE_NO_LEAK:      "Covering Up Traces",
  SECURITY_SCHOOL:              "Agent training",
  SECURITY_SCHOOL_FAST:         "Accelerated Training",
  SECURITY_SCHOOL_STRONG:       "Efficient Training",

  // ── Post-Production ───────────────────────────────────────────────────────────
  POST_DIR_MONT_COMP_XP_1: "Professional post-production facilities",
  LAB_INHOUSE_IMPROVED:    "Improved development",
  LAB_INHOUSE_TIME_1:      "Fast development",
  SOUND_INHOUSE_IMPROVED:  "Superior sound studio",
  SOUND_INHOUSE_TIME_1:    "Fast track studio",
  CONCERT_INHOUSE_MPROVED: "Superior concert hall",
  CONCERT_INHOUSE_TIME_1:  "Orchestral recording setup",
  PRINT_INHOUSE_QLT_1:     "Printing in 3 weeks",
  PRINT_INHOUSE_QLT_2:     "Printing in one week",
  PRINT_EMERGENCY:         "Emergency printing",

  // ── Shenanigans / Dirty Tricks ───────────────────────────────────────────────
  BM_UNLOCK:               "Dirty tricks",

  // ── Distribution / Marketing ──────────────────────────────────────────────────
  WM_HOSPICE:               "Hospice visit",
  WM_ORPHANAGE:             "Orphanage visit",
  WM_WEDDING:               "Surprise wedding appearance",
  WM_HOMELESS:              "Aid for the homeless",
  WM_DEBT:                  "Payment of debts",
  SCANDAL_COVER_UP_MONEY:   "Hush money",
  SCANDAL_COVER_UP_PP:      "Hush scandal for IP",
  ANALYSIS_GROUPS:          "Audience analytics",
  POSTRELEASE_ANALYSIS:     "Post-release analytics",
  ANALYSIS_ENTIRE_CAST:     "Competitor actors",
  ANALYSIS_SCREENPLAY:      "Competitor screenplay estimates",
  ANALYSIS_TAGS:            "Competitor Story Elements",
  ANALYSIS_BUDGET:          "Competitor budgets",
  MOVIE_THEATRE_SLOT_ADD_1: "Cinema optimization",
  MOVIE_THEATRE_SLOT_RENT:  "Cinemas for rent",

  // ── Personal services ─────────────────────────────────────────────────────────
  PERSONAL_DRIVER:         "Star Car Driver",
  PERSONAL_DRIVER_PREMIUM: "Luxury Car and Chauffeur",
  INSURANCE_PLUS:          "Extended Medical Coverage",

  // ── Luxury gifts (WG_ prefix) — sourced from Presents.json ───────────────────
  WG_WATCHES:              "Watch",
  WG_CIGARS:               "Cigars",
  WG_ALCOHOL:              "Alcohol",
  WG_HAUTE_WARDROBE:       "Couture Wardrobe",
  WG_SPORTCAR:             "European Sports Car",

  // ── Illegal gifts (BG_ prefix) — sourced from Presents.json ──────────────────
  BG_UNLOCK:               "Illegal Gifts",
  BG_NARCOTICS:            "Heroin",
  BG_METH:                 "Meth",
  BG_NARCOTICS_2:          "Cocaine",
  BG_SAFARI:               "Animal Murder",
  BG_XXX:                  "A Spicy Film Strip",
  BG_BRAINS:               "Monkey Brains",
  BG_KILLING:              "Illegal Safari",
  BG_CANNIBAL:             "Cannibal Dinner",
  BG_UNDERAGE:             "Time with a Minor",

  // ── Event perks ───────────────────────────────────────────────────────────────
  OFFICIAL_RECEPTION_1:    "Banquet",
  OFFICIAL_RECEPTION_2:    "Luxurious Banquet",
  OFFICIAL_RECEPTION_3:    "Grand Banquet",
  PARTY_1:                 "Corporate Party",
  PARTY_2:                 "Luxurious Corporate Party",
  PARTY_3:                 "Corporate Blow-Out",
};

export const PERK_GROUPS: PerkGroup[] = [
  {
    label: "Legal Department",
    color: "#7ab0e0",
    perks: [
      "LEGAL_DEFENSE_1", "LEGAL_DEFENSE_2", "LEGAL_DEFENSE_3",
      "CONTRACT_PAYMENTS_50_50",
      "CONTRACT_5_MOVIES", "CONTRACT_10_MOVIES",
      "CONTRACT_5_YEARS", "CONTRACT_10_YEARS",
      "CONTRACT_TERMINATION_FEE_1", "CONTRACT_TERMINATION_FEE_2",
    ],
  },
  {
    label: "Financial Department",
    color: "#c9a44a",
    perks: [
      "BANK_LOAN", "BANK_LOAN_EARLY_REPAYMENT",
      "BANK_LOAN_INT_RATE_REDUCTION_1", "BANK_LOAN_INT_RATE_REDUCTION_2",
      "BANK_LOAN_AMOUNT_1", "BANK_LOAN_AMOUNT_2",
      "BANK_LOAN_TERM_1", "BANK_LOAN_TERM_2",
      "CASH_FLOW_1", "CASH_FLOW_2",
    ],
  },
  {
    label: "HR Department",
    color: "#4ec9a0",
    perks: [
      "ETHNIC_COMPOSITION", "ILLEGAL_WORKERS", "CHEAP_ILLEGALS",
      "BUILDINGS_CONSERVATION", "CONSERVATION_COOLDOWN", "SALARY_CUT",
      "HIRING_BONUSES", "IMPROVEMENT_0_NO_SADNESS",
      "NOMINATION_LOSS_NO_SADNESS", "MOVIE_RELEASE_MOOD_BOOST", "BAD_ATTITUDE_NO_SADNESS",
    ],
  },
  {
    label: "PR Department",
    color: "#8fbc55",
    perks: [
      "GENERATION_IP_AND_REP", "GENERATION_REP_X2", "GENERATION_IP_X2",
      "PROFITABLE_MOVIE_REP_2", "GOOD_ATTITUDE_REP_1", "GOOD_ATTITUDE_REP_2",
      "CHARITY_TO_REP", "SKILLED_ACTOR_REP", "LEGEND_REP_1", "ICON_REP_1",
      "INITIATIVE_PP_FREE", "TECH_SALE_PP", "TOP1_TOP3",
    ],
  },
  {
    label: "Marketing and Outreach",
    color: "#8fbc55",
    perks: [
      "SCANDAL_COVER_UP_MONEY", "SCANDAL_COVER_UP_PP",
      "WM_HOSPICE", "WM_ORPHANAGE", "WM_WEDDING", "WM_HOMELESS", "WM_DEBT",
    ],
  },
  {
    label: "Producers Offices",
    color: "#a9a4e8",
    perks: [
      "NEGOTIATION_SCALE_50", "NEGOTIATION_SCALE_75",
      "TWO_PROJECTS", "CONTRACT_WEIGHT",
      "PRODUCERS_ON_FILM_2", "PRODUCERS_ON_FILM_3",
    ],
  },
  {
    label: "Pre-Production",
    color: "#7ab0e0",
    perks: [
      "EXTRAS_2", "EXTRAS_3", "EXTRAS_4",
      "PREPROD_PROD_DIR_CIN_XP_1", "PREPROD_PROD_DIR_CIN_XP_2",
      "LOCATION_SEARCH_TIME_1", "LOCATION_SEARCH_TIME_2", "LOCATION_SEARCH_WORLD",
      "LOCATION_QLT_1", "LOCATION_QLT_2",
      "SETS_TIME_RED_1", "SETS_TIME_RED_2", "SETS_TIME_RED_3",
      "SETS_QLT_2", "SETS_QLT_3",
      "PROPS_QLT_2", "PROPS_QLT_3",
    ],
  },
  {
    label: "Production Department",
    color: "#4ec9a0",
    perks: [
      "PROD_DIR_CIN_ACT_XP_1",
      "SECOND_UNIT", "FLEX_SCHEDULE",
      "URGENT_DOUBLE_SEARCH", "URGENT_EXTRAS_SEARCH",
      "URGENT_CREW_SEARCH", "URGENT_LOCATION_SEARCH",
      "TEAM_SERVICE_1", "TEAM_SERVICE_2",
    ],
  },
  {
    label: "Post-Production",
    color: "#4ec9a0",
    perks: [
      "POST_DIR_MONT_COMP_XP_1",
      "LAB_INHOUSE_IMPROVED", "LAB_INHOUSE_TIME_1",
      "SOUND_INHOUSE_IMPROVED", "SOUND_INHOUSE_TIME_1",
      "CONCERT_INHOUSE_MPROVED", "CONCERT_INHOUSE_TIME_1",
      "PRINT_INHOUSE_QLT_1", "PRINT_INHOUSE_QLT_2", "PRINT_EMERGENCY",
    ],
  },
  {
    label: "Distribution Department",
    color: "#c9a44a",
    perks: [
      "MOVIE_THEATRE_SLOT_ADD_1", "MOVIE_THEATRE_SLOT_RENT",
      "MOVIEGOERS_NUMBER_WIDE", "MOVIEGOERS_NUMBER_NARROW",
      "ANALYSIS_GROUPS", "ANALYSIS_ENTIRE_CAST", "ANALYSIS_BUDGET",
      "ANALYSIS_TAGS", "ANALYSIS_SCREENPLAY", "POSTRELEASE_ANALYSIS",
      "EDITS_ON_GO",
      "MOVIE_RELEASE_XP_1", "MOVIE_RELEASE_XP_2", "MOVIE_RELEASE_XP_3",
      "MOVIE_RELEASE_TOP10_ART_XP_1", "MOVIE_RELEASE_TOP10_AUD_XP_1", "MOVIE_RELEASE_TOP10_COM_XP_1",
    ],
  },
  {
    label: "Screenplay Department",
    color: "#a9a4e8",
    perks: [
      "SCEN_IDEAS_STORAGE_1", "SCEN_IDEAS_GEN_AMT_1", "SCEN_IDEAS_GEN_AMT_2",
      "SCREENPLAY_TIME_RED_1", "SCREENPLAY_TIME_RED_2", "SCREENPLAY_TIME_RED_3",
      "NEW_SCREENPLAY_XP_BONUS_1", "NEW_SCREENPLAY_XP_BONUS_2", "NEW_SCREENPLAY_XP_BONUS_3",
      "NEW_SCREENPLAY_PP_BONUS_1", "NEW_SCREENPLAY_PP_BONUS_2",
      "SCRIPT_DOCTORS", "SCRIPT_DOCTORS_FASTER", "SCRIPT_DOCTORS_RANGE",
      "SCRIPT_DOCTORS_SCORES", "SCRIPT_DOCTORS_CHEAPER",
    ],
  },
  {
    label: "Story Elements",
    color: "#c9a44a",
    perks: [
      "TAGS_RESEARCH",
      "TAGS_SLOTS_6", "TAGS_SLOTS_7", "TAGS_SLOTS_8", "TAGS_SLOTS_9", "TAGS_SLOTS_10",
      "TAGS_RESEARCH_TIME_RED_1", "TAGS_RESEARCH_TIME_RED_2", "TAGS_RESEARCH_TIME_RED_3",
      "TAGS_XP_BONUS_1", "TAGS_XP_BONUS_2", "TAGS_XP_BONUS_3",
      "TAGS_NEW_PP_BONUS", "TAGS_RESEARCH_DIRECTION",
      "NEW_TAG_BY_LT_1", "NEW_TAG_BY_LT_2",
      "MOVIE_SEQUEL", "MOVIE_SEQUEL_ORIGINALITY", "MOVIE_SEQUEL_LEGACY",
    ],
  },
  {
    label: "Maintenance",
    color: "#9a9280",
    perks: [
      "REPAIR_TEAM_1", "IMPROVEMENT_I",
    ],
  },
  {
    label: "Engineering",
    color: "#7ab0e0",
    perks: [
      "STUDIO_TECH", "STUDIO_TECH_ADD_RND",
      "STUDIO_TECH_RED_TIME_1", "STUDIO_TECH_RED_TIME_2",
    ],
  },
  {
    label: "Offensive Operations",
    color: "#e08080",
    perks: [
      "SHENANIGANS_BEATING", "SHENANIGANS_KIDNAPPING", "SHENANIGANS_MURDER",
      "SPYING_SINS", "SPYING_ILLEGALPREFERENCES",
      "SPYING_XP_BONUS_1", "SPYING_XP_BONUS_2",
      "FAIL_NO_DISCLOSURE", "LEAK_RISK_REDUCE_1",
      "BM_UNLOCK", "BM_DROWNING", "BM_DRUNKARD", "BM_FIGHT", "BM_CRIMINAL", "BM_HOUSE_BURN",
    ],
  },
  {
    label: "Defensive Operations",
    color: "#e09090",
    perks: [
      "ACTIVE_PROTECTION", "ACTIVE_PROTECTION_XP_BONUS_1", "ACTIVE_PROTECTION_XP_BONUS_2",
      "FAIL_DISCLOSURE_NO_LEAK", "SECRETS_HIDE_EFFECT_BOOST",
      "SECURITY_SCHOOL", "SECURITY_SCHOOL_FAST", "SECURITY_SCHOOL_STRONG",
    ],
  },
  {
    label: "Services",
    color: "#4ec9a0",
    perks: [
      "INSURANCE_PLUS", "PERSONAL_DRIVER", "PERSONAL_DRIVER_PREMIUM",
      "HOUSEMAID", "NANNY", "ASSISTANT", "CHEF", "BUTLER", "SPOUSES_ASSISTANT",
      "HOTEL_SUITE", "VILLA", "PENTHOUSE",
      "WG_WATCHES", "WG_ALCOHOL", "WG_HAUTE_WARDROBE", "WG_SPORTCAR", "WG_CIGARS",
    ],
  },
  {
    label: "Illegal Gifts",
    color: "#e08080",
    perks: [
      "BG_UNLOCK",
      "BG_NARCOTICS", "BG_METH", "BG_NARCOTICS_2", "BG_XXX",
      "BG_BRAINS", "BG_SAFARI", "BG_KILLING", "BG_CANNIBAL", "BG_UNDERAGE",
    ],
  },
  {
    label: "Events",
    color: "#e09090",
    perks: [
      "OFFICIAL_RECEPTION_1", "OFFICIAL_RECEPTION_2", "OFFICIAL_RECEPTION_3",
      "PARTY_1", "PARTY_2", "PARTY_3",
    ],
  },
  {
    label: "Buildings",
    color: "#e09090",
    perks: [
      "BLDG_FREELANCE", "BLDG_DISTRIBUTION", "BLDG_LAB",
      "BLDG_POWERPLANT_I", "BLDG_ANALYTICS", "BLDG_WATER_TOWER_I",
      "BLDG_CONSTRUCTOR", "BLDG_PRINT", "BLDG_MARKETING",
      "BLDG_SHENANIGANS", "BLDG_PAVILION_II", "BLDG_PAVILION_III", "BLDG_PAVILION_IV",
      "BLDG_CONCERT", "BLDG_WORKSHOP", "BLDG_EVENTS_STAGE",
      "BLDG_SCOUT", "BLDG_CASTING", "BLDG_SUPPLY", "BLDG_SPIES",
      "BLDG_SOUND", "BLDG_LINE_PRODUCTION", "BLDG_LOGISTICS",
      "BLDG_RND_I", "BLDG_ESCORT_DOMINION",
      "BLDG_POWERPLANT_II", "BLDG_POWERPLANT_III",
      "BLDG_WATER_TOWER_II", "BLDG_WATER_TOWER_III",
      "BLDG_RND_II", "BLDG_RND_III", "BLDG_RND_IV",
      "BLDG_COPYRIGHT", "BLDG_FOCUS",
    ],
  },
];

// Behaviour=4 perks: passive/auto-triggered, present in save files but not
// visible research nodes. Included in ALL_KNOWN_PERKS for Unlock All
// completeness, but hidden from the UI.
export const HIDDEN_PERK_IDS = new Set<string>([
  "ADDITIONAL_REHEARSAL_1", "ADDITIONAL_REHEARSAL_2",
  "BANK_LOAN_COOLDOWN_REDUCTION", "BANK_LOAN_MICROLOAN", "BANK_LOAN_REFINANCING",
  "BROADCAST_MEDIA", "CONTRACT_GROSS",
  "FOCUS_INHOUSE_RED_PRICE_1", "FOCUS_INHOUSE_RED_TIME_1", "FOCUS_OUTSOURCE",
  "FOCUS_QLT_1", "FOCUS_QLT_2",
  "IMPROVEMENT_II", "IMPROVEMENT_III",
  "IP_CONTRACT_WEIGHT", "IP_HYPE", "IP_HYPE_RED_PRICE_1", "IP_HYPE_RED_TIME_1",
  "IP_KEEPER", "IP_MOVIE_THEATRE_CHEAP", "IP_TALANTS_LNT_BONUS_XP",
  "LITERARY_WORK_RESEARCH_TIME_1", "MARKET_INTERVIEW",
  "MOVIE_PALACE", "MOVIE_PALACE_PP_1",
  "MOVIE_RELEASE_ATTITUDE_1", "MOVIE_RELEASE_MOOD_1",
  "PAVILION_RENT_1", "PAVILION_RENT_2",
  "POWERPLANT_AMT_3", "PREMIERE", "PREMIERE_REP_1",
  "PRINT_MEDIA", "PUBLIC_DOMAIN",
  "QUARTERLY_REPORT_CASH_1", "QUARTERLY_REPORT_CASH_2", "QUARTERLY_REPORT_CASH_3",
  "SCREENPLAYS_AMT_1", "SCREENPLAYS_AMT_2",
  "STAFF_LARGE1", "STAFF_LARGE2", "START_PROD_NO_ACT",
  "SUPER_PREMIERE", "SUPER_PREMIERE_PP_1", "SUPER_PREMIERE_REP_1",
  "TAX_BASE_REDUCTION_1", "TAX_BASE_REDUCTION_2", "TAX_BASE_REDUCTION_3",
  "WATER_TOWER_AMT_3",
]);

export const ALL_KNOWN_PERKS = new Set<string>([
  ...PERK_GROUPS.flatMap((g) => g.perks),
  ...HIDDEN_PERK_IDS,
]);

export function getPerkGroup(perkId: string): PerkGroup | undefined {
  return PERK_GROUPS.find((g) => g.perks.includes(perkId));
}

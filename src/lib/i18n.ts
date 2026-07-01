import { useAuth } from "./auth";

export type Lang = "en" | "hi" | "te";

type Dict = {
  roleMismatch: (email: string, existing: string, tried: string) => string;
  roleAlready: string;
  partnerPending: string;
  partnerRejected: (reason: string) => string;
  partnerBannerPending: string;
  partnerBannerRejected: string;
};

const roleName: Record<Lang, Record<string, string>> = {
  en: { farmer: "Farmer", owner: "Market Owner", partner: "Delivery Partner", admin: "Admin" },
  hi: { farmer: "किसान", owner: "दुकानदार", partner: "डिलीवरी पार्टनर", admin: "एडमिन" },
  te: { farmer: "రైతు", owner: "దుకాణదారు", partner: "డెలివరీ పార్టనర్", admin: "అడ్మిన్" },
};

const dicts: Record<Lang, Dict> = {
  en: {
    roleMismatch: (email, existing, tried) =>
      `This Google account (${email}) is already registered as a ${existing}. One Google account = one role. To use AgriConnect as a ${tried}, sign out and sign in with a different Gmail.`,
    roleAlready:
      "This Google account already has a role assigned. Sign in with a different email to choose another role.",
    partnerBannerPending: "Awaiting admin approval",
    partnerBannerRejected: "Verification rejected",
    partnerPending:
      "Your documents have been submitted. You'll be able to go online and accept trips once an admin approves them (usually within 24 hours).",
    partnerRejected: (r) => r || "Your documents were rejected. Please re-upload and resubmit.",
  },
  hi: {
    roleMismatch: (email, existing, tried) =>
      `यह Google खाता (${email}) पहले से ${existing} के रूप में पंजीकृत है। एक Google खाता = एक भूमिका। ${tried} के रूप में उपयोग करने के लिए, साइन आउट करें और दूसरी Gmail से साइन इन करें।`,
    roleAlready:
      "इस Google खाते को पहले से ही एक भूमिका सौंपी जा चुकी है। दूसरी ईमेल से साइन इन करें।",
    partnerBannerPending: "एडमिन की मंज़ूरी बाकी है",
    partnerBannerRejected: "सत्यापन अस्वीकृत",
    partnerPending:
      "आपके दस्तावेज़ जमा हो गए हैं। एडमिन के मंज़ूर करने के बाद (आमतौर पर 24 घंटे में) आप ऑनलाइन जाकर ट्रिप स्वीकार कर सकेंगे।",
    partnerRejected: (r) => r || "आपके दस्तावेज़ अस्वीकृत हो गए हैं। कृपया पुनः अपलोड करें।",
  },
  te: {
    roleMismatch: (email, existing, tried) =>
      `ఈ Google ఖాతా (${email}) ఇప్పటికే ${existing} గా నమోదైంది. ఒక Google ఖాతా = ఒక పాత్ర. ${tried} గా ఉపయోగించడానికి, సైన్ అవుట్ చేసి వేరే Gmail తో సైన్ ఇన్ చేయండి.`,
    roleAlready:
      "ఈ Google ఖాతాకు ఇప్పటికే ఒక పాత్ర కేటాయించబడింది. వేరే ఇమెయిల్ తో సైన్ ఇన్ చేయండి.",
    partnerBannerPending: "అడ్మిన్ ఆమోదం కోసం వేచి ఉంది",
    partnerBannerRejected: "ధృవీకరణ తిరస్కరించబడింది",
    partnerPending:
      "మీ పత్రాలు సమర్పించబడ్డాయి. అడ్మిన్ ఆమోదించిన తర్వాత (సాధారణంగా 24 గంటల్లో) మీరు ఆన్‌లైన్‌కి వెళ్లి ట్రిప్‌లను స్వీకరించగలరు.",
    partnerRejected: (r) => r || "మీ పత్రాలు తిరస్కరించబడ్డాయి. దయచేసి మళ్లీ అప్‌లోడ్ చేయండి.",
  },
};

export function useI18n() {
  const { user } = useAuth();
  const lang = ((user as any)?.language as Lang) || "en";
  return {
    lang,
    t: dicts[lang] ?? dicts.en,
    roleLabel: (r: string) => (roleName[lang] ?? roleName.en)[r] ?? r,
  };
}

export function getDict(lang: Lang | null | undefined) {
  return dicts[(lang as Lang) ?? "en"] ?? dicts.en;
}
export function getRoleName(lang: Lang | null | undefined, role: string) {
  return (roleName[(lang as Lang) ?? "en"] ?? roleName.en)[role] ?? role;
}

import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "fr";

  const toggleLanguage = () => {
    const nextLang = currentLang === "fr" ? "en" : "fr";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("preferredLanguage", nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-slate-200"
      aria-label="Changer la langue"
      type="button"
    >
      <Globe className="h-4 w-4" />
      <span className="uppercase">{currentLang}</span>
    </button>
  );
}

// src/components/LanguageSelector.jsx
import { useTranslation } from "react-i18next";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
  };

  return (
    <select value={i18n.language} onChange={handleChange}>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}

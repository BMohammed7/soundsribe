import { useState, useMemo, useRef, useEffect } from "react";

const LANG_MAP: Record<string, string> = {
  English: "en", english: "en",
  French: "fr", french: "fr",
  Spanish: "es", spanish: "es",
  German: "de", german: "de",
  Italian: "it", italian: "it",
  Portuguese: "pt", portuguese: "pt",
  Chinese: "zh", chinese: "zh",
  Japanese: "ja", japanese: "ja",
  Korean: "ko", korean: "ko",
};

export const useTranslationSettings = () => {
  const [targetLang, setTargetLang] = useState('French');

  const targetLangCode = useMemo(() => {
    const key = String(targetLang).trim();
    return LANG_MAP[key] || LANG_MAP[key.toLowerCase()] || targetLang; // allow fr-CA passthrough
  }, [targetLang]);

  const targetLangRef = useRef(targetLangCode);
  useEffect(() => { 
    targetLangRef.current = targetLangCode; 
  }, [targetLangCode]);

  return {
    targetLang,
    setTargetLang,
    targetLangCode,
    targetLangRef,
    LANG_MAP
  };
};
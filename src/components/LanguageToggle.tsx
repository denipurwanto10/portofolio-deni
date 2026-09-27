import { useState } from 'react'
import {
  getStoredLanguage,
  setSiteLanguage,
  type SiteLanguage,
} from '../manualTranslations'

function LanguageToggle() {
  // B9: lazy initializer — tidak ada flash indikator salah + tidak
  // balapan dengan translateDom awal.
  const [language, setLanguage] = useState<SiteLanguage>(() =>
    getStoredLanguage(),
  )

  const switchTo = (nextLanguage: SiteLanguage) => {
    if (nextLanguage === language) return
    setLanguage(nextLanguage)
    setSiteLanguage(nextLanguage)
  }

  const isIndonesian = language === 'id'

  return (
    <div
      className={`lang-toggle notranslate ${isIndonesian ? 'is-id' : 'is-en'}`}
      role="group"
      aria-label="Pilih bahasa situs"
      translate="no"
    >
      <span
        className="lang-toggle-pill"
        aria-hidden="true"
      />
      <button
        type="button"
        className={
          isIndonesian
            ? 'lang-toggle-btn active'
            : 'lang-toggle-btn'
        }
        onClick={() => switchTo('id')}
        aria-pressed={isIndonesian}
        title="Ganti ke Bahasa Indonesia"
      >
        ID
      </button>

      <button
        type="button"
        className={
          !isIndonesian
            ? 'lang-toggle-btn active'
            : 'lang-toggle-btn'
        }
        onClick={() => switchTo('en')}
        aria-pressed={!isIndonesian}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  )
}

export default LanguageToggle

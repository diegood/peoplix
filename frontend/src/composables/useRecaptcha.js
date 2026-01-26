import { ref } from 'vue';

export function useRecaptcha() {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.error('VITE_RECAPTCHA_SITE_KEY is not defined in environment variables.');
  }
  let isScriptLoaded = false;
  let scriptPromise = null;

  const loadRecaptchaScript = () => {
    if (isScriptLoaded) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
      // Check if script already exists (e.g. from previous navigations)
      if (document.querySelector('script[id="recaptcha-script"]')) {
        const existingScript = document.querySelector('script[id="recaptcha-script"]');
        if (typeof window.grecaptcha !== 'undefined') {
            isScriptLoaded = true;
            resolve();
            return;
        }
        // If script exists but grecaptcha not ready, wait for it
        existingScript.addEventListener('load', () => {
             isScriptLoaded = true;
             resolve();
        });
        existingScript.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoaded = true;
        resolve();
      };
      
      script.onerror = (error) => {
        scriptPromise = null; // Reset promise to allow retrial
        reject(error);
      };

      document.head.appendChild(script);
    });

    return scriptPromise;
  };

  /**
   * Execute ReCAPTCHA action
   * @param {string} action - The action name
   * @returns {Promise<string>} - The reCAPTCHA token
   */
  const executeRecaptcha = async (action) => {
    const isEnabled = import.meta.env.VITE_ENABLE_RECAPTCHA === 'true';
    
    if (!isEnabled) {
        console.log('ReCAPTCHA is disabled by environment variable.');
        return 'RECAPTCHA_DISABLED_TOKEN';
    }

    await loadRecaptchaScript();

    return new Promise((resolve, reject) => {
      if (typeof window.grecaptcha === 'undefined' || typeof window.grecaptcha.enterprise === 'undefined') {
        reject(new Error('ReCAPTCHA failed to load.'));
        return;
      }

      window.grecaptcha.enterprise.ready(async () => {
        try {
          const token = await window.grecaptcha.enterprise.execute(siteKey, { action });
          resolve(token);
        } catch (error) {
          console.error('ReCAPTCHA Execution Error:', error);
          reject(error);
        }
      });
    });
  };

  return {
    executeRecaptcha,
  };
}

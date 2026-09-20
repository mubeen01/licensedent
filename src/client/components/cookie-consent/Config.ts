import type { CookieConsentConfig } from 'vanilla-cookieconsent';

declare global {
  interface Window {
    dataLayer: any;
  }
}

const getConfig = () => {
  // See https://cookieconsent.orestbida.com/reference/configuration-reference.html for configuration options.
  const config: CookieConsentConfig = {
    // Default configuration for the modal.
    root: 'body',
    autoShow: true,
    disablePageInteraction: false,
    hideFromBots: import.meta.env.PROD ? true : false, // Set this to false for dev/headless tests otherwise the modal will not be visible.
    mode: 'opt-in',
    revision: 0,

    // Default configuration for the cookie.
    cookie: {
      name: 'cc_cookie',
      domain: location.hostname,
      path: '/',
      sameSite: 'Lax',
      expiresAfterDays: 365,
    },

    guiOptions: {
      consentModal: {
        // Launch-audit fix (2026-09-20): 'box'/'bottom right' rendered a
        // ~305px-tall card that overlapped vertically-centered page content
        // (confirmed via real bounding-box measurement: the card spanned
        // y:399-704 on a common 1280x720 viewport, directly on top of the
        // login/signup form's submit button at y:425-465). Its `auto`
        // pointer-events + max z-index meant it silently absorbed clicks
        // meant for the button underneath -- a real user on that viewport
        // size could not submit login/signup at all until dismissing the
        // banner first. 'bar'/'bottom' is a slim full-width strip pinned to
        // the very bottom edge, well clear of centered content.
        layout: 'bar',
        position: 'bottom',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },

    categories: {
      necessary: {
        enabled: true, // this category is enabled by default
        readOnly: true, // this category cannot be disabled
      },
      analytics: {
        autoClear: {
          cookies: [
            {
              name: /^_ga/, // regex: match all cookies starting with '_ga'
            },
            {
              name: '_gid', // string: exact cookie name
            },
          ],
        },

        // https://cookieconsent.orestbida.com/reference/configuration-reference.html#category-services
        services: {
          ga: {
            label: 'Google Analytics',
            onAccept: () => {
              try {
                const GA_ANALYTICS_ID = import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID;
                if (!GA_ANALYTICS_ID.length) {
                  throw new Error('Google Analytics ID is missing');
                }
                window.dataLayer = window.dataLayer || [];
                function gtag(..._args: unknown[]) {
                  (window.dataLayer as Array<any>).push(arguments);
                }
                gtag('js', new Date());
                gtag('config', GA_ANALYTICS_ID);

                // Adding the script tag dynamically to the DOM.
                const script = document.createElement('script');
                script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
                script.async = true;
                document.body.appendChild(script);
              } catch (error) {
                console.error(error);
              }
            },
            onReject: () => {},
          },
        },
      },
    },

    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description:
              // PRD-006 H2: previously said "learn more about our cookie
              // policy" -- no separate cookie policy page exists; cookies
              // are covered inside the Privacy Policy section below.
              'We use cookies primarily for analytics to enhance your experience. By accepting, you agree to our use of these cookies. You can manage your preferences or read our privacy policy below.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            // showPreferencesBtn: 'Manage Individual preferences', // (OPTIONAL) Activates the preferences modal
            // PRD-006 H2/M14: "Privacy Policy" previously linked to /legal,
            // which had no privacy policy on it at all -- now points at the
            // real #privacy section added there. Both links gained
            // rel="noopener noreferrer" (target="_blank" alone doesn't
            // imply noopener).
            footer: `
            <a href="/legal#privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="/legal#terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a>
                    `,
          },
          // The showPreferencesBtn activates this modal to manage individual preferences https://cookieconsent.orestbida.com/reference/configuration-reference.html#translation-preferencesmodal
          preferencesModal: {
            sections: [],
          },
        },
      },
    },
  };

  return config;
};

export default getConfig;
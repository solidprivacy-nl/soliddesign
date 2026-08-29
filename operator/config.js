window.SOLIDDESIGN_OPERATOR_CONFIG = Object.freeze({
  supabaseUrl: "https://grderdhnjkeucaaehgqy.supabase.co",
  supabasePublishableKey: "sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh",
  internalOrigin: "https://soliddesign-cms.pages.dev",
  publicProspectOrigin: "https://soliddesign-cms.pages.dev",
  publicProspectPathPrefix: "/prospect"
});

import('./prospect-link.js').catch((error) => console.error('Prospectlink module kon niet laden.', error));

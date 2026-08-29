window.SOLIDDESIGN_OPERATOR_CONFIG = Object.freeze({
  supabaseUrl: "https://grderdhnjkeucaaehgqy.supabase.co",
  supabasePublishableKey: "sb_publishable_fRXRtDIHJ98LIN3cfQHtpA_WJ0yPPRh",
  internalOrigin: "https://soliddesign-cms.pages.dev",
  publicProspectOrigin: "https://soliddesign-cms.pages.dev",
  publicProspectPathPrefix: "/prospect"
});

import('./invite-setup.js').catch((error) => console.error('Uitnodigingsflow kon niet laden.', error));
import('./prospect-link.js').catch((error) => console.error('Prospectlink module kon niet laden.', error));
import('./team-work.js').catch((error) => console.error('Teamwerk module kon niet laden.', error));
import('./dossier-tabs.js').catch((error) => console.error('Dossierweergave kon niet laden.', error));

const PR_HOST_RE = /^pr-(\d+)\.soliddesign-cms\.pages\.dev$/;

function installPreviewIndicator() {
  const match = window.location.hostname.match(PR_HOST_RE);
  if (!match) return;

  const label = `TEST · PR-${match[1]}`;
  document.documentElement.dataset.solidDesignEnvironment = 'preview';
  document.title = `[${label}] ${document.title}`;

  if (!document.getElementById('solidDesignEnvironmentStyle')) {
    const style = document.createElement('style');
    style.id = 'solidDesignEnvironmentStyle';
    style.textContent = `
      .sd-environment-badge {
        display: inline-flex;
        align-items: center;
        margin-left: 8px;
        padding: 2px 7px;
        border: 1px solid currentColor;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .05em;
        line-height: 1.4;
        vertical-align: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  document.querySelectorAll('.brand').forEach((brand) => {
    if (brand.querySelector('.sd-environment-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'sd-environment-badge';
    badge.textContent = label;
    badge.title = `Testomgeving: ${window.location.origin}`;
    brand.appendChild(badge);
  });
}

installPreviewIndicator();

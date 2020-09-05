const extraFeatures = typeof window.extraRoam42Features !== 'undefined' ? window.extraRoam42Features : [];

extraFeatures.forEach((s, i) => addScriptToPage(`extra-roam42-feature-${i}`, s));

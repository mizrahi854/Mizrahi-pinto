// Base path: GitHub Pages serves under /Mizrahi-pinto; Vercel (EXPO_BASE_URL="") serves at the root.
module.exports = ({ config }) => {
  const base = process.env.EXPO_BASE_URL;
  return { ...config, experiments: { ...config.experiments, baseUrl: base === undefined ? '/Mizrahi-pinto' : base } };
};

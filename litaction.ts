const go = async (maxTemp) => {
  return fetch('https://server.yikkai95.workers.dev/decrypt')
    .then(res => res.json())
    .then(res => res.verified)
};

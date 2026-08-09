export const getUserColor = (userId: string) => {
  const colors = [
    'text-rose-400',
    'text-amber-400',
    'text-emerald-400',
    'text-cyan-400',
    'text-fuchsia-400',
    'text-sky-400',
    'text-orange-400',
    'text-lime-400',
    'text-violet-400',
    'text-pink-400',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const formatPrice = (price: number): string => {
  if (!price && price !== 0) return "N/A";
  if (price === 0) return "$0.00";
  if (price < 0.000001) return "<$0.000001";
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 10) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(2)}`;
};

export const formatPercentChange = (change: number): string => {
  if (!change && change !== 0) return "0.00%";
  return change > 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
};

export const formatVolume = (volume: number): string => {
  if (!volume && volume !== 0) return "N/A";
  if (volume === 0) return "$0";
  if (volume < 1000) return `$${volume.toFixed(0)}`;
  if (volume < 1000000) return `$${(volume / 1000).toFixed(1)}K`;
  if (volume < 1000000000) return `$${(volume / 1000000).toFixed(1)}M`;
  return `$${(volume / 1000000000).toFixed(1)}B`;
};

export const formatHolders = (holders: number): string => {
  if (!holders && holders !== 0) return "N/A";
  if (holders === 0) return "0";
  if (holders < 1000) return holders.toString();
  if (holders < 1000000) return `${(holders / 1000).toFixed(1)}K`;
  return `${(holders / 1000000).toFixed(1)}M`;
}; 
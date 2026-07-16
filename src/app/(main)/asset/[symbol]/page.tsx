import AssetClient from './AssetClient';

export default async function AssetPage({ params }: { params: { symbol: string } }) {
  const symbol = (await params).symbol;
  
  // Decoding URL symbol if necessary (e.g., S&P 500 might have spaces)
  const decodedSymbol = decodeURIComponent(symbol);

  return <AssetClient symbol={decodedSymbol} />;
}

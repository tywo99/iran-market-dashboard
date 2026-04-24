const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const BASELINE_DATE = '2026-02-27';

export async function onRequestGet({ request }) {
    const url = new URL(request.url);
    const symbols = (url.searchParams.get('symbols') || '')
        .split(',')
        .map((symbol) => symbol.trim())
        .filter(Boolean);

    if (symbols.length === 0) {
        return json({ error: 'Missing symbols query parameter' }, 400);
    }

    const uniqueSymbols = [...new Set(symbols)].slice(0, 20);
    const results = await Promise.all(
        uniqueSymbols.map(async (symbol) => [symbol, await fetchYahooPrices(symbol)])
    );

    return json(Object.fromEntries(results), 200, {
        'Cache-Control': 'public, max-age=60'
    });
}

async function fetchYahooPrices(symbol) {
    const period1 = Math.floor(Date.parse(`${BASELINE_DATE}T00:00:00Z`) / 1000);
    const period2 = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000);
    const yahooUrl = `${YAHOO_BASE}${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`;

    try {
        const response = await fetch(yahooUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 Cloudflare Pages Function'
            }
        });

        if (!response.ok) return { current: null, baseline: null };

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result) return { current: null, baseline: null };

        const metaPrice = result.meta?.regularMarketPrice;
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];

        let current = typeof metaPrice === 'number' ? metaPrice : null;
        let baseline = null;

        for (let i = 0; i < timestamps.length; i++) {
            const timestampDate = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);

            if (timestampDate === BASELINE_DATE && typeof closes[i] === 'number') {
                baseline = closes[i];
                break;
            }
        }

        if (current === null) {
            for (let i = closes.length - 1; i >= 0; i--) {
                if (typeof closes[i] === 'number') {
                    current = closes[i];
                    break;
                }
            }
        }

        return { current, baseline };
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
        return { current: null, baseline: null };
    }
}

function json(body, status = 200, headers = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...headers
        }
    });
}

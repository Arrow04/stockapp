"""India market data via Yahoo Finance public chart API (no API key).

Faithful copy of the original ``us_stocks.py`` logic. US helper functions are
kept for the future global mode; the India universe is the active one.
"""
import asyncio

import httpx

YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; StockApp/1.0)"}
_INTERVAL_MAP = {
    "1m": ("1m", "1d"), "5m": ("5m", "1d"), "15m": ("15m", "5d"),
    "1h": ("60m", "5d"), "4h": ("60m", "1mo"), "1d": ("1d", "1mo"),
}

# US symbols retained for the global-mode klines route (unused in India mode).
US_STOCKS = []
STOCK_SYMBOLS = set()

# ---------------------------------------------------------------------------
# Indian market via Yahoo Finance - NSE (.NS) + BSE (.BO), prices in INR.
# ---------------------------------------------------------------------------
INDIA_STOCKS = [
    {"symbol": "^NSEI", "name": "NIFTY 50", "base": 25228.0, "market": "NSE INDEX", "sector": "Index"},
    {"symbol": "^NSEBANK", "name": "NIFTY Bank", "base": 62039.0, "market": "NSE INDEX", "sector": "Index"},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "base": 1363.0, "market": "NSE", "sector": "Energy"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy", "base": 2379.0, "market": "NSE", "sector": "IT"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "base": 808.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "base": 1601.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "INFY.NS", "name": "Infosys", "base": 1109.0, "market": "NSE", "sector": "IT"},
    {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "base": 2400.0, "market": "NSE", "sector": "FMCG"},
    {"symbol": "ITC.NS", "name": "ITC", "base": 480.0, "market": "NSE", "sector": "FMCG"},
    {"symbol": "SBIN.NS", "name": "State Bank of India", "base": 1135.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "base": 1175.0, "market": "NSE", "sector": "Telecom"},
    {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "base": 1750.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "LT.NS", "name": "Larsen & Toubro", "base": 3400.0, "market": "NSE", "sector": "Infra"},
    {"symbol": "AXISBANK.NS", "name": "Axis Bank", "base": 1050.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "ASIANPAINT.NS", "name": "Asian Paints", "base": 2900.0, "market": "NSE", "sector": "Paints"},
    {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "base": 12500.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "SUNPHARMA.NS", "name": "Sun Pharmaceutical", "base": 1750.0, "market": "NSE", "sector": "Pharma"},
    {"symbol": "TITAN.NS", "name": "Titan Company", "base": 3400.0, "market": "NSE", "sector": "Consumer"},
    {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "base": 9500.0, "market": "NSE", "sector": "Finance"},
    {"symbol": "HCLTECH.NS", "name": "HCL Technologies", "base": 1550.0, "market": "NSE", "sector": "IT"},
    {"symbol": "WIPRO.NS", "name": "Wipro", "base": 280.0, "market": "NSE", "sector": "IT"},
    {"symbol": "ULTRACEMCO.NS", "name": "UltraTech Cement", "base": 11000.0, "market": "NSE", "sector": "Cement"},
    {"symbol": "NESTLEIND.NS", "name": "Nestle India", "base": 2500.0, "market": "NSE", "sector": "FMCG"},
    {"symbol": "M&M.NS", "name": "Mahindra & Mahindra", "base": 2600.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "TATAMOTORS.NS", "name": "Tata Motors", "base": 950.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "ADANIENT.NS", "name": "Adani Enterprises", "base": 2400.0, "market": "NSE", "sector": "Diversified"},
    {"symbol": "ADANIPORTS.NS", "name": "Adani Ports", "base": 1400.0, "market": "NSE", "sector": "Infra"},
    {"symbol": "ONGC.NS", "name": "Oil & Natural Gas", "base": 290.0, "market": "NSE", "sector": "Oil & Gas"},
    {"symbol": "NTPC.NS", "name": "NTPC", "base": 340.0, "market": "NSE", "sector": "Power"},
    {"symbol": "POWERGRID.NS", "name": "Power Grid", "base": 290.0, "market": "NSE", "sector": "Power"},
    {"symbol": "COALINDIA.NS", "name": "Coal India", "base": 390.0, "market": "NSE", "sector": "Mining"},
    {"symbol": "JSWSTEEL.NS", "name": "JSW Steel", "base": 950.0, "market": "NSE", "sector": "Steel"},
    {"symbol": "TATASTEEL.NS", "name": "Tata Steel", "base": 170.0, "market": "NSE", "sector": "Steel"},
    {"symbol": "HINDALCO.NS", "name": "Hindalco Industries", "base": 650.0, "market": "NSE", "sector": "Metals"},
    {"symbol": "DRREDDY.NS", "name": "Dr Reddy's Labs", "base": 1150.0, "market": "NSE", "sector": "Pharma"},
    {"symbol": "CIPLA.NS", "name": "Cipla", "base": 1500.0, "market": "NSE", "sector": "Pharma"},
    {"symbol": "DIVISLAB.NS", "name": "Divi's Laboratories", "base": 5200.0, "market": "NSE", "sector": "Pharma"},
    {"symbol": "BAJAJFINSV.NS", "name": "Bajaj Finserv", "base": 1700.0, "market": "NSE", "sector": "Finance"},
    {"symbol": "SBILIFE.NS", "name": "SBI Life Insurance", "base": 1500.0, "market": "NSE", "sector": "Insurance"},
    {"symbol": "HDFCLIFE.NS", "name": "HDFC Life", "base": 700.0, "market": "NSE", "sector": "Insurance"},
    {"symbol": "GRASIM.NS", "name": "Grasim Industries", "base": 2100.0, "market": "NSE", "sector": "Textiles"},
    {"symbol": "SHREECEM.NS", "name": "Shree Cement", "base": 26000.0, "market": "NSE", "sector": "Cement"},
    {"symbol": "EICHERMOT.NS", "name": "Eicher Motors", "base": 4800.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "HEROMOTOCO.NS", "name": "Hero MotoCorp", "base": 2800.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "BAJAJ-AUTO.NS", "name": "Bajaj Auto", "base": 9200.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "TVSMOTOR.NS", "name": "TVS Motor", "base": 2300.0, "market": "NSE", "sector": "Auto"},
    {"symbol": "INDUSINDBK.NS", "name": "IndusInd Bank", "base": 1500.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "IDFCFIRSTBANK.NS", "name": "IDFC First Bank", "base": 70.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "BANKBARODA.NS", "name": "Bank of Baroda", "base": 250.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "PNB.NS", "name": "Punjab National Bank", "base": 110.0, "market": "NSE", "sector": "Banking"},
    {"symbol": "DMART.NS", "name": "Avenue Supermarts", "base": 4200.0, "market": "NSE", "sector": "Retail"},
    {"symbol": "SBICARD.NS", "name": "SBI Cards", "base": 750.0, "market": "NSE", "sector": "Finance"},
    {"symbol": "ADANIGREEN.NS", "name": "Adani Green Energy", "base": 1000.0, "market": "NSE", "sector": "Power"},
    {"symbol": "ADANITRANS.NS", "name": "Adani Transmission", "base": 500.0, "market": "NSE", "sector": "Power"},
    {"symbol": "TATAPOWER.NS", "name": "Tata Power", "base": 400.0, "market": "NSE", "sector": "Power"},
    {"symbol": "GAIL.NS", "name": "GAIL India", "base": 180.0, "market": "NSE", "sector": "Oil & Gas"},
    {"symbol": "IOC.NS", "name": "Indian Oil", "base": 150.0, "market": "NSE", "sector": "Oil & Gas"},
    {"symbol": "BPCL.NS", "name": "Bharat Petroleum", "base": 330.0, "market": "NSE", "sector": "Oil & Gas"},
    {"symbol": "HPCL.NS", "name": "Hindustan Petroleum", "base": 280.0, "market": "NSE", "sector": "Oil & Gas"},
    {"symbol": "MCDOWELL-N.NS", "name": "United Spirits", "base": 1500.0, "market": "NSE", "sector": "FMCG"},
    {"symbol": "BABCOCK.NS", "name": "Babcock & Wilcox", "base": 500.0, "market": "NSE", "sector": "Engineering"},
    {"symbol": "VOLTAS.NS", "name": "Voltas", "base": 1500.0, "market": "NSE", "sector": "Consumer"},
    {"symbol": "CROMPTON.NS", "name": "Crompton Greaves", "base": 350.0, "market": "NSE", "sector": "Consumer"},
    {"symbol": "HAVELLS.NS", "name": "Havells India", "base": 1700.0, "market": "NSE", "sector": "Consumer"},
    {"symbol": "DIXON.NS", "name": "Dixon Technologies", "base": 16000.0, "market": "NSE", "sector": "Electronics"},
    {"symbol": "KAYNES.NS", "name": "Kaynes Technology", "base": 5500.0, "market": "NSE", "sector": "Electronics"},
    {"symbol": "PERSISTENT.NS", "name": "Persistent Systems", "base": 5200.0, "market": "NSE", "sector": "IT"},
    {"symbol": "COFORGE.NS", "name": "Coforge", "base": 1800.0, "market": "NSE", "sector": "IT"},
    {"symbol": "MPHASIS.NS", "name": "Mphasis", "base": 2600.0, "market": "NSE", "sector": "IT"},
    {"symbol": "LTIM.NS", "name": "LTIMindtree", "base": 5500.0, "market": "NSE", "sector": "IT"},
    {"symbol": "TECHM.NS", "name": "Tech Mahindra", "base": 1600.0, "market": "NSE", "sector": "IT"},
    {"symbol": "IRCTC.NS", "name": "IRCTC", "base": 700.0, "market": "NSE", "sector": "Travel"},
    {"symbol": "IRFC.NS", "name": "Indian Railway Finance", "base": 140.0, "market": "NSE", "sector": "Finance"},
    {"symbol": "RVNL.NS", "name": "Rail Vikas Nigam", "base": 400.0, "market": "NSE", "sector": "Infra"},
    {"symbol": "NBCC.NS", "name": "NBCC India", "base": 140.0, "market": "NSE", "sector": "Infra"},
    {"symbol": "NHPC.NS", "name": "NHPC", "base": 95.0, "market": "NSE", "sector": "Power"},
    {"symbol": "SJVN.NS", "name": "SJVN", "base": 110.0, "market": "NSE", "sector": "Power"},
    {"symbol": "BHEL.NS", "name": "Bharat Heavy Electricals", "base": 250.0, "market": "NSE", "sector": "Engineering"},
    {"symbol": "BEML.NS", "name": "BEML", "base": 3500.0, "market": "NSE", "sector": "Engineering"},
    {"symbol": "HAL.NS", "name": "Hindustan Aeronautics", "base": 4500.0, "market": "NSE", "sector": "Defence"},
    {"symbol": "BEL.NS", "name": "Bharat Electronics", "base": 300.0, "market": "NSE", "sector": "Defence"},
    {"symbol": "MAZAGON.NS", "name": "Mazagon Dock", "base": 5000.0, "market": "NSE", "sector": "Defence"},
    {"symbol": "COCHINSHIP.NS", "name": "Cochin Shipyard", "base": 1600.0, "market": "NSE", "sector": "Defence"},
    {"symbol": "ZOMATO.NS", "name": "Zomato", "base": 230.0, "market": "NSE", "sector": "Internet"},
    {"symbol": "PAYTM.NS", "name": "Paytm", "base": 100.0, "market": "NSE", "sector": "Fintech"},
    {"symbol": "NYKAA.NS", "name": "Nykaa", "base": 170.0, "market": "NSE", "sector": "Retail"},
    {"symbol": "POLICYBZR.NS", "name": "PB Fintech", "base": 1800.0, "market": "NSE", "sector": "Fintech"},
    {"symbol": "CARATLANE.NS", "name": "Caratlane", "base": 450.0, "market": "NSE", "sector": "Retail"},
    {"symbol": "FIRSTCRY.NS", "name": "FirstCry", "base": 200.0, "market": "NSE", "sector": "Retail"},
    {"symbol": "SWIGGY.NS", "name": "Swiggy", "base": 600.0, "market": "NSE", "sector": "Internet"},
    {"symbol": "ASTRAL.NS", "name": "Astral Pipes", "base": 1900.0, "market": "NSE", "sector": "Building"},
    {"symbol": "SUPREMEIND.NS", "name": "Supreme Industries", "base": 3200.0, "market": "NSE", "sector": "Plastics"},
    {"symbol": "PIIND.NS", "name": "PI Industries", "base": 3400.0, "market": "NSE", "sector": "Chemicals"},
    {"symbol": "UPL.NS", "name": "UPL", "base": 550.0, "market": "NSE", "sector": "Chemicals"},
    {"symbol": "COROMANDEL.NS", "name": "Coromandel International", "base": 1800.0, "market": "NSE", "sector": "Fertilizer"},
    {"symbol": "CHAMBLFERT.NS", "name": "Chambal Fertilisers", "base": 140.0, "market": "NSE", "sector": "Fertilizer"},
    {"symbol": "DEEPAKNTR.NS", "name": "Deepak Nitrite", "base": 2000.0, "market": "NSE", "sector": "Chemicals"},
    {"symbol": "TATACHEM.NS", "name": "Tata Chemicals", "base": 1100.0, "market": "NSE", "sector": "Chemicals"},
    {"symbol": "SRF.NS", "name": "SRF", "base": 2600.0, "market": "NSE", "sector": "Chemicals"},
    {"symbol": "GODREJCP.NS", "name": "Godrej Consumer", "base": 1300.0, "market": "NSE", "sector": "FMCG"},
    {"symbol": "GODREJPROP.NS", "name": "Godrej Properties", "base": 1700.0, "market": "NSE", "sector": "Real Estate"},
    {"symbol": "DLF.NS", "name": "DLF", "base": 750.0, "market": "NSE", "sector": "Real Estate"},
    {"symbol": "OBEROIRLTY.NS", "name": "Oberoi Realty", "base": 1800.0, "market": "NSE", "sector": "Real Estate"},
    {"symbol": "PRESTIGE.NS", "name": "Prestige Estates", "base": 1600.0, "market": "NSE", "sector": "Real Estate"},
    {"symbol": "LODHA.NS", "name": "Lodha Developers", "base": 1600.0, "market": "NSE", "sector": "Real Estate"},
    {"symbol": "JIOFIN.NS", "name": "Jio Financial Services", "base": 280.0, "market": "NSE", "sector": "Finance"},
    {"symbol": "BSE.NS", "name": "BSE Ltd", "base": 2200.0, "market": "NSE", "sector": "Exchange"},
    {"symbol": "RELIANCE.BO", "name": "Reliance Industries", "base": 1363.0, "market": "BSE", "sector": "Energy"},
    {"symbol": "TCS.BO", "name": "Tata Consultancy", "base": 2379.0, "market": "BSE", "sector": "IT"},
    {"symbol": "HDFCBANK.BO", "name": "HDFC Bank", "base": 808.0, "market": "BSE", "sector": "Banking"},
    {"symbol": "ICICIBANK.BO", "name": "ICICI Bank", "base": 1601.0, "market": "BSE", "sector": "Banking"},
    {"symbol": "INFY.BO", "name": "Infosys", "base": 1109.0, "market": "BSE", "sector": "IT"},
    {"symbol": "SBIN.BO", "name": "State Bank of India", "base": 1135.0, "market": "BSE", "sector": "Banking"},
    {"symbol": "HINDUNILVR.BO", "name": "Hindustan Unilever", "base": 2400.0, "market": "BSE", "sector": "FMCG"},
    {"symbol": "ITC.BO", "name": "ITC", "base": 480.0, "market": "BSE", "sector": "FMCG"},
    {"symbol": "BHARTIARTL.BO", "name": "Bharti Airtel", "base": 1175.0, "market": "BSE", "sector": "Telecom"},
    {"symbol": "LT.BO", "name": "Larsen & Toubro", "base": 3400.0, "market": "BSE", "sector": "Infra"},
    {"symbol": "AXISBANK.BO", "name": "Axis Bank", "base": 1050.0, "market": "BSE", "sector": "Banking"},
    {"symbol": "MARUTI.BO", "name": "Maruti Suzuki", "base": 12500.0, "market": "BSE", "sector": "Auto"},
    {"symbol": "BAJFINANCE.BO", "name": "Bajaj Finance", "base": 9500.0, "market": "BSE", "sector": "Finance"},
    {"symbol": "TATAMOTORS.BO", "name": "Tata Motors", "base": 950.0, "market": "BSE", "sector": "Auto"},
    {"symbol": "ONGC.BO", "name": "Oil & Natural Gas", "base": 290.0, "market": "BSE", "sector": "Oil & Gas"},
    {"symbol": "NTPC.BO", "name": "NTPC", "base": 340.0, "market": "BSE", "sector": "Power"},
    {"symbol": "BHEL.BO", "name": "Bharat Heavy Electricals", "base": 250.0, "market": "BSE", "sector": "Engineering"},
    {"symbol": "GAIL.BO", "name": "GAIL India", "base": 180.0, "market": "BSE", "sector": "Oil & Gas"},
]

INDIA_SYMBOLS = {s["symbol"] for s in INDIA_STOCKS}


def _india_display(symbol):
    base = symbol.replace(".NS", "").replace(".BO", "").replace("^", "")
    suffix = "BSE" if symbol.endswith(".BO") else "NSE"
    return base if symbol.startswith("^") else f"{base} ({suffix})"


def _yahoo_for_display(disp):
    if disp in INDIA_SYMBOLS:
        return disp
    for s in INDIA_STOCKS:
        if _india_display(s["symbol"]) == disp:
            return s["symbol"]
    return disp


async def fetch_india_quotes(client):
    """Fetch quotes for all Indian symbols concurrently (INR)."""
    sem = asyncio.Semaphore(3)

    async def one(inst):
        async with sem:
            try:
                r = await client.get(
                    YAHOO_CHART + inst["symbol"],
                    params={"interval": "1m", "range": "1d"},
                    headers=HEADERS,
                )
                if r.status_code != 200:
                    return None
                m = r.json()["chart"]["result"][0]["meta"]
                ltp = float(m.get("regularMarketPrice") or 0)
                if not ltp:
                    return None
                prev = float(m.get("previousClose") or m.get("chartPreviousClose") or ltp)
                return {
                    "symbol": _india_display(inst["symbol"]), "name": inst["name"],
                    "market": inst["market"], "base": inst["base"], "ltp": ltp,
                    "open": float(m.get("regularMarketOpen") or prev),
                    "high": float(m.get("regularMarketDayHigh") or ltp),
                    "low": float(m.get("regularMarketDayLow") or ltp),
                    "close": prev,
                    "volume": float(m.get("regularMarketVolume") or 0),
                    "yahoo": inst["symbol"],
                }
            except Exception:
                return None

    res = await asyncio.gather(*(one(i) for i in INDIA_STOCKS))
    return [q for q in res if q]


async def _fetch_candles(client, ysymbol, interval, limit):
    """Fetch and normalise Yahoo chart candles for one symbol."""
    yi, rng = _INTERVAL_MAP.get(interval, ("1m", "1d"))
    r = await client.get(
        YAHOO_CHART + ysymbol,
        params={"interval": yi, "range": rng},
        headers=HEADERS,
    )
    r.raise_for_status()
    result = r.json()["chart"]["result"][0]
    ts = result.get("timestamp") or []
    q = result["indicators"]["quote"][0]
    out = []
    for i in range(len(ts)):
        o, h, l, c, v = q["open"][i], q["high"][i], q["low"][i], q["close"][i], q["volume"][i]
        if None in (o, h, l, c):
            continue
        out.append({
            "openTime": int(ts[i]) * 1000, "open": float(o), "high": float(h),
            "low": float(l), "close": float(c), "volume": float(v or 0),
        })
    return out[-limit:]


async def fetch_india_candles(client, symbol, interval, limit):
    """Fetch candles for an Indian symbol (display name or Yahoo form)."""
    ysym = _yahoo_for_display(symbol)
    return await _fetch_candles(client, ysym, interval, limit)


async def fetch_stock_quotes(client):
    """Fetch quotes for US_STOCKS (global mode; currently an empty universe)."""
    async def one(inst):
        try:
            r = await client.get(
                YAHOO_CHART + inst["symbol"],
                params={"interval": "1m", "range": "1d"},
                headers=HEADERS,
            )
            if r.status_code != 200:
                return None
            m = r.json()["chart"]["result"][0]["meta"]
            ltp = float(m.get("regularMarketPrice") or 0)
            if not ltp:
                return None
            prev = float(m.get("previousClose") or m.get("chartPreviousClose") or ltp)
            return {
                "symbol": inst["symbol"], "name": inst["name"], "market": "US",
                "base": inst["base"], "ltp": ltp,
                "open": float(m.get("regularMarketOpen") or prev),
                "high": float(m.get("regularMarketDayHigh") or ltp),
                "low": float(m.get("regularMarketDayLow") or ltp),
                "close": prev, "volume": float(m.get("regularMarketVolume") or 0),
            }
        except Exception:
            return None

    res = await asyncio.gather(*(one(i) for i in US_STOCKS))
    return [q for q in res if q]


async def fetch_stock_candles(client, symbol, interval, limit):
    """Fetch candles for a US symbol (global mode helper)."""
    return await _fetch_candles(client, symbol, interval, limit)

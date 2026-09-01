package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"decluttered/backend/config"

	"github.com/gin-gonic/gin"
)

type TickerItem struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
	Change string `json:"change"`
	IsUp   bool   `json:"is_up"`
}

type YahooFinanceResponse struct {
	Chart struct {
		Result []struct {
			Meta struct {
				RegularMarketPrice float64 `json:"regularMarketPrice"`
				PreviousClose      float64 `json:"previousClose"`
				ChartPreviousClose float64 `json:"chartPreviousClose"`
			} `json:"meta"`
		} `json:"result"`
	} `json:"chart"`
}

type CoinGeckoResponse map[string]struct {
	USD       float64 `json:"usd"`
	USDChange float64 `json:"usd_24h_change"`
}

func GetMarketData(c *gin.Context) {
	cacheKey := "market:indices"

	// 1. Check Redis Cache First
	cachedData, err := config.RDB.Get(config.Ctx, cacheKey).Result()
	if err == nil {
		var cachePayload gin.H
		if err := json.Unmarshal([]byte(cachedData), &cachePayload); err == nil {
			c.Header("X-Cache", "HIT")
			c.JSON(http.StatusOK, cachePayload)
			return
		}
	}

	var tickers []TickerItem
	httpClient := &http.Client{Timeout: 5 * time.Second}

	// 2. Fetch Yahoo Finance Stock Indices
	symbols := map[string]string{
		"^GSPC": "S&P 500",
		"^IXIC": "NASDAQ",
		"NVDA":  "NVIDIA",
		"AAPL":  "Apple",
	}

	for sym, label := range symbols {
		url := fmt.Sprintf("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d", sym)
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")

		resp, err := httpClient.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			var yfData YahooFinanceResponse
			if err := json.NewDecoder(resp.Body).Decode(&yfData); err == nil && len(yfData.Chart.Result) > 0 {
				meta := yfData.Chart.Result[0].Meta
				price := meta.RegularMarketPrice
				prevClose := meta.PreviousClose
				if prevClose == 0 {
					prevClose = meta.ChartPreviousClose
				}

				if price > 0 && prevClose > 0 {
					pctChange := ((price - prevClose) / prevClose) * 100
					tickers = append(tickers, TickerItem{
						Symbol: label,
						Price:  fmt.Sprintf("$%.2f", price),
						Change: fmt.Sprintf("%+.2f%%", pctChange),
						IsUp:   pctChange >= 0,
					})
				}
			}
			resp.Body.Close()
		}
	}

	// 3. Fetch Crypto Prices via CoinGecko
	cgURL := "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"
	cgResp, err := httpClient.Get(cgURL)
	if err == nil && cgResp.StatusCode == http.StatusOK {
		var cgData CoinGeckoResponse
		if err := json.NewDecoder(cgResp.Body).Decode(&cgData); err == nil {
			if btc, ok := cgData["bitcoin"]; ok {
				tickers = append(tickers, TickerItem{
					Symbol: "BTC/USD",
					Price:  fmt.Sprintf("$%.2f", btc.USD),
					Change: fmt.Sprintf("%+.2f%%", btc.USDChange),
					IsUp:   btc.USDChange >= 0,
				})
			}
		}
		cgResp.Body.Close()
	}

	responsePayload := gin.H{
		"status": "success",
		"data":   tickers,
	}

	// 4. Serialize cleanly for Redis Caching
	bytesData, _ := json.Marshal(responsePayload)
	config.RDB.Set(config.Ctx, cacheKey, bytesData, 30*time.Second)

	c.Header("X-Cache", "MISS")
	c.JSON(http.StatusOK, responsePayload)
}
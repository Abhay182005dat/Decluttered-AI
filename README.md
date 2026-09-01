# Decluttered 📰

A modern, intelligent news aggregation and summarization platform that brings clarity to information overload. Decluttered uses AI-powered clustering and smart summarization to help you digest news, articles, and stories with ease.

## 🎯 Features

- **Smart News Aggregation**: Automatically collects and categorizes news from multiple sources
- **AI-Powered Summaries**: Get concise, intelligent summaries powered by LangChain and Sentence Transformers
- **Event Clustering**: Related news stories are intelligently grouped together
- **Real-time Processing**: Event-driven architecture using Kafka for seamless data flow
- **Vector Search**: Semantic search capabilities through Qdrant vector database
- **Modern UI**: Clean, minimalist interface built with Next.js and Tailwind CSS
- **Caching Layer**: Redis for optimized performance and fast data retrieval
- **Full-Text Search**: Elasticsearch integration for powerful search capabilities

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│              React + Tailwind CSS + TypeScript              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Backend Service (Go + Gin)                     │
│      Market Data & News Handlers, API Gateway               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
    ┌───▼──┐    ┌────▼─────┐ ┌──▼───┐    ┌─────▼─────┐
    │  DB  │    │  Cache   │ │Kafka │    │ Scraper   │
    │  (PG)│    │ (Redis)  │ │ (KRaft)   │    (Go)    │
    └──────┘    └──────────┘ └──────┘    └───────────┘
                     │
        ┌────────────┼─────────────────────┐
        │            │                     │
    ┌───▼─────┐ ┌────▼────┐        ┌──────▼──┐
    │ Qdrant  │ │  ES     │        │AI Service│
    │(Vectors)│ │(Search) │        │ (Python) │
    └─────────┘ └─────────┘        └──────────┘
```

## 📊 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS | Modern, responsive UI |
| **Backend** | Go 1.27, Gin Web Framework | High-performance API server |
| **AI/ML** | Python, LangChain, Sentence Transformers | NLP & summarization |
| **Database** | PostgreSQL 16 | Persistent data storage |
| **Cache** | Redis 7 | Session & data caching |
| **Message Queue** | Apache Kafka (KRaft) | Event streaming |
| **Vector DB** | Qdrant 1.7 | Semantic search & embeddings |
| **Search Engine** | Elasticsearch 8.11 | Full-text search |
| **Scraper** | Go | News source scraping |
| **Containerization** | Docker & Docker Compose | Orchestration |

## 📋 Prerequisites

### Required Software

- **Docker & Docker Compose** (v20.10+) - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### For Manual Setup (Optional)

- **Node.js** 18+ - [Install Node.js](https://nodejs.org/)
- **Go** 1.27+ - [Install Go](https://golang.org/dl/)
- **Python** 3.9+ - [Install Python](https://www.python.org/downloads/)
- **PostgreSQL** 16 - [Install PostgreSQL](https://www.postgresql.org/download/)

## 🚀 Quick Start (Docker Compose - Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/decluttered.git
cd decluttered
```

### Step 2: Set Up Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and configure for your setup:

   For **Local Development with Docker:**
   ```env
   DB_URI="postgresql://postgres:password@postgres:5432/decluttered_db"
   REDIS_URL="redis://redis:6379"
   KAFKA_BROKER="kafka:29092"
   QDRANT_HOST="qdrant"
   QDRANT_PORT="6333"
   GROQ_API_KEY="gsk_your_groq_api_key_here"  # Required
   ```

   For **Production with Cloud Services:**
   ```env
   # PostgreSQL on Render.com
   DB_URI="postgresql://user:password@dpg-xxxxx.region-postgres.render.com/database"
   
   # Redis on Upstash
   REDIS_URL="rediss://default:password@host.upstash.io:port"
   
   # Kafka on Confluent Cloud
   KAFKA_BROKER="pkc-xxxxx.region.provider.confluent.cloud:9092"
   KAFKA_USER="your-api-key"
   KAFKA_PASSWORD="your-api-secret"
   
   # Qdrant Cloud
   QDRANT_HOST="https://your-cluster-id.qdrant.io"
   QDRANT_API_KEY="your-qdrant-api-key"
   
   GROQ_API_KEY="gsk_your_groq_api_key_here"
   ```

3. **Get Required API Keys:**
   - **Groq API Key** (Required for AI summarization):
     1. Go to [console.groq.com](https://console.groq.com)
     2. Sign up → Create account
     3. Navigate to API Keys section
     4. Create new API key and copy to `GROQ_API_KEY`

See [`.env.example`](.env.example) for all available configuration options.

### Step 3: Start All Services

```bash
docker-compose up -d
```

Wait 30-60 seconds for all services to initialize. Check status with:

```bash
docker-compose ps
```

All services should show `Up (healthy)` or `Up`.

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Kafka UI**: http://localhost:19101 (if included)
- **Elasticsearch**: http://localhost:9200
- **Qdrant Dashboard**: http://localhost:6333/dashboard

---

## 🛠️ Manual Setup (Without Docker)

### Step 1: Set Up Infrastructure

#### PostgreSQL
```bash
# On Windows (PowerShell)
# Download and install PostgreSQL from https://www.postgresql.org/download/windows/
# During installation, remember the password

# Create database
psql -U postgres -c "CREATE DATABASE decluttered_db;"

# Initialize schema
psql -U postgres -d decluttered_db -f database/schema.sql
```

#### Redis
```bash
# On Windows (using Chocolatey)
choco install redis-64

# Or download from: https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server
```

#### Kafka
```bash
# Download from: https://kafka.apache.org/downloads
# Extract and navigate to directory

# Start Zookeeper
bin/zookeeper-server-start.sh config/zookeeper.properties

# In another terminal, start Kafka
bin/kafka-server-start.sh config/server.properties
```

### Step 2: Set Up Backend Service (Go)

```bash
cd services/backend-service

# Install dependencies
go mod download

# Create .env file (if not exists)
# Add the environment variables from the Quick Start section

# Run the backend
go run main.go
```

Backend will start on http://localhost:8080

### Step 3: Set Up AI Service (Python)

```bash
cd services/ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with Kafka and Qdrant settings

# Run the service
python main.py
```

### Step 4: Set Up Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Run development server
npm run dev
```

Frontend will start on http://localhost:3000

### Step 5: Start the News Scraper (Optional)

```bash
cd services/scraper-go

# Install dependencies
go mod download

# Run the scraper
go run main.go
```

---

## 📁 Project Structure

```
decluttered/
├── frontend/                 # Next.js React application
│   ├── app/                 # Next.js app directory
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page (news feed)
│   ├── components/          # React components
│   │   ├── Header.tsx       # Top navigation
│   │   ├── Sidebar.tsx      # Filters & categories
│   │   ├── MarketTicker.tsx # Market data display
│   │   └── SummaryDetail.tsx # Event details view
│   ├── lib/                 # Utilities & API client
│   │   └── api.ts           # Backend API calls
│   ├── types/               # TypeScript type definitions
│   └── package.json         # Dependencies
│
├── services/
│   ├── backend-service/     # Go API server (Gin framework)
│   │   ├── main.go          # Entry point, routing
│   │   ├── config/          # Database connection config
│   │   ├── handlers/        # Request handlers
│   │   │   ├── news.go      # News endpoints
│   │   │   └── market.go    # Market data endpoints
│   │   └── go.mod           # Go dependencies
│   │
│   ├── ai-service/          # Python AI & summarization service
│   │   ├── main.py          # Kafka consumer & embedding pipeline
│   │   ├── pipeline.py      # AI processing pipeline
│   │   ├── summarizer.py    # LangChain summarization
│   │   ├── test_summ.py     # Tests
│   │   └── requirements.txt # Python dependencies
│   │
│   └── scraper-go/          # News scraper (Go)
│       ├── main.go          # Scraper entry point
│       ├── config.go        # Configuration
│       └── go.mod           # Go dependencies
│
├── database/                # Database initialization
│   ├── schema.sql           # PostgreSQL schema
│   └── init_db.py           # Database seeding (optional)
│
├── docker-compose.yml       # Full stack orchestration
└── .env                     # Environment variables
```

## 🔌 API Endpoints

### News Endpoints

```
GET  /api/news/feed              # Get aggregated news feed
GET  /api/news/:id               # Get specific event details
GET  /api/news/search?q=keyword  # Search news
GET  /api/news/categories        # Get available categories
```

### Market Endpoints

```
GET  /api/market/data            # Get market data
GET  /api/market/ticker/:symbol  # Get specific ticker
```

## 🧪 Testing

```bash
# Backend (Go)
cd services/backend-service
go test ./...

# Frontend (Next.js)
cd frontend
npm run test

# AI Service (Python)
cd services/ai-service
python -m pytest
# or run the test file
python test_summ.py
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port (e.g., 3000)
# On Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# On macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Docker Services Not Starting

```bash
# Check logs
docker-compose logs [service-name]

# Example: Check frontend logs
docker-compose logs frontend

# Restart all services
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d decluttered_db

# Check Redis connection
redis-cli ping

# Check Kafka connection
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server kafka:9092
```

### Python Dependencies Issues

```bash
# Clear cache and reinstall
pip cache purge
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

Found a bug or have a question? Please open an issue on GitHub!

---

**Made with ❤️ to declutter your news feed**

# eBird MCP Server

An MCP (Model Context Protocol) server that provides access to the eBird API 2.0.

## Setup

### 1. Get an eBird API Key

Get your API key at: https://ebird.org/api/keygen

### 2. Install Dependencies

```bash
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Configure Claude Code

Add the server to your Claude Code configuration:

```bash
claude mcp add ebird -e EBIRD_API_KEY=your_api_key_here -- node /Users/youruser/ebird-mcp/dist/index.js
```

Or manually add to your Claude Code settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "ebird": {
      "command": "node",
      "args": ["/Users/youruser/ebird-mcp/dist/index.js"],
      "env": {
        "EBIRD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Observations

| Tool | Description |
|------|-------------|
| `get_recent_observations` | Get recent bird observations in a region |
| `get_notable_observations` | Get recent notable/rare observations |
| `get_species_observations` | Get observations of a specific species |
| `get_nearby_observations` | Get observations near a lat/lng |
| `get_nearby_species_observations` | Get species observations near a location |
| `get_nearest_species_observations` | Find nearest locations with a species |
| `get_nearby_notable_observations` | Get notable observations near a location |
| `get_historic_observations` | Get observations from a specific date |

### Products

| Tool | Description |
|------|-------------|
| `get_top_100` | Get top 100 contributors on a date |
| `get_recent_checklists` | Get recently submitted checklists |
| `get_checklists_on_date` | Get checklists from a specific date |
| `get_regional_statistics` | Get stats for a region on a date |
| `get_species_list` | Get all species recorded in a region |
| `get_checklist` | Get details of a specific checklist |

### Reference Data

| Tool | Description |
|------|-------------|
| `get_adjacent_regions` | Get neighboring regions |
| `get_hotspots_in_region` | Get birding hotspots in a region |
| `get_nearby_hotspots` | Get hotspots near a location |
| `get_hotspot_info` | Get info about a specific hotspot |
| `get_taxonomy` | Get the eBird taxonomy |
| `get_taxonomic_forms` | Get subspecies for a species |
| `get_taxa_locales` | Get available language codes |
| `get_taxonomy_versions` | Get taxonomy versions |
| `get_taxonomic_groups` | Get species groups |
| `get_region_info` | Get info about a region |
| `get_sub_regions` | Get sub-regions within a region |

## Region Codes

- **Country**: 2-letter code (e.g., `US`, `CA`, `GB`)
- **State/Province**: Country-State (e.g., `US-NY`, `CA-BC`)
- **County**: Country-State-County (e.g., `US-NY-109`)
- **Location**: L-code (e.g., `L99381`)

## Species Codes

Species use 6-letter codes (e.g., `cangoo` for Canada Goose, `barswa` for Barn Swallow). Use `get_taxonomy` to find codes.

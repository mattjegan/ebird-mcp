#!/usr/bin/env node
/**
 * eBird MCP Server - Access eBird API 2.0 through Model Context Protocol
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = "https://api.ebird.org/v2";
const API_KEY = process.env.EBIRD_API_KEY;

if (!API_KEY) {
  console.error("Error: EBIRD_API_KEY environment variable is not set");
  console.error("Get your API key at: https://ebird.org/api/keygen");
  process.exit(1);
}

async function makeRequest(endpoint: string, params: Record<string, string | number | boolean> = {}): Promise<unknown> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: { "X-eBirdApiToken": API_KEY! },
  });

  if (!response.ok) {
    throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const server = new McpServer({
  name: "ebird",
  version: "1.0.0",
});

// =============================================================================
// OBSERVATIONS
// =============================================================================

server.tool(
  "get_recent_observations",
  "Get recent bird observations in a region (up to 30 days ago). Returns species, location, date, and count info.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code (e.g., 'US', 'US-NY', 'US-NY-109', 'L99381')"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch (1-30)"),
    cat: z.string().optional().describe("Taxonomic category filter (e.g., 'species', 'hybrid')"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      back: args.back,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      sppLocale: args.spp_locale,
    };
    if (args.cat) params.cat = args.cat;
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/data/obs/${args.region_code}/recent`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_notable_observations",
  "Get recent notable/rare bird observations in a region. Notable observations are for locally or nationally rare species.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    detail: z.enum(["simple", "full"]).default("simple").describe("Level of detail in response"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      back: args.back,
      detail: args.detail,
      hotspot: args.hotspot,
      sppLocale: args.spp_locale,
    };
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/data/obs/${args.region_code}/recent/notable`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_species_observations",
  "Get recent observations of a specific species in a region.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    species_code: z.string().describe("eBird species code (e.g., 'cangoo' for Canada Goose, 'barswa' for Barn Swallow)"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      back: args.back,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      sppLocale: args.spp_locale,
    };
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/data/obs/${args.region_code}/recent/${args.species_code}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_nearby_observations",
  "Get recent observations near a geographic location.",
  {
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    cat: z.string().optional().describe("Taxonomic category filter"),
    dist: z.number().min(0).max(50).default(25).describe("Search radius in kilometers"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    sort: z.enum(["date", "species"]).default("date").describe("Sort by date or species"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      lat: args.lat,
      lng: args.lng,
      back: args.back,
      dist: args.dist,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      sort: args.sort,
      sppLocale: args.spp_locale,
    };
    if (args.cat) params.cat = args.cat;
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest("/data/obs/geo/recent", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_nearby_species_observations",
  "Get recent observations of a specific species near a location.",
  {
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    species_code: z.string().describe("eBird species code"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    dist: z.number().min(0).max(50).default(25).describe("Search radius in kilometers"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      lat: args.lat,
      lng: args.lng,
      back: args.back,
      dist: args.dist,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      sppLocale: args.spp_locale,
    };
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/data/obs/geo/recent/${args.species_code}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_nearest_species_observations",
  "Find the nearest locations where a species has been seen recently.",
  {
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    species_code: z.string().describe("eBird species code"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(3000).default(3000).describe("Maximum observations to return"),
    dist: z.number().min(0).max(50).optional().describe("Maximum distance in km"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      lat: args.lat,
      lng: args.lng,
      back: args.back,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      maxResults: args.max_results,
      sppLocale: args.spp_locale,
    };
    if (args.dist) params.dist = args.dist;

    const result = await makeRequest(`/data/nearest/geo/recent/${args.species_code}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_nearby_notable_observations",
  "Get notable/rare observations near a location.",
  {
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
    detail: z.enum(["simple", "full"]).default("simple").describe("Level of detail"),
    dist: z.number().min(0).max(50).default(25).describe("Search radius in kilometers"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      lat: args.lat,
      lng: args.lng,
      back: args.back,
      detail: args.detail,
      dist: args.dist,
      hotspot: args.hotspot,
      sppLocale: args.spp_locale,
    };
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest("/data/obs/geo/recent/notable", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_historic_observations",
  "Get observations from a specific date in history.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    year: z.number().min(1800).describe("Year"),
    month: z.number().min(1).max(12).describe("Month"),
    day: z.number().min(1).max(31).describe("Day of month"),
    cat: z.string().optional().describe("Taxonomic category filter"),
    detail: z.enum(["simple", "full"]).default("simple").describe("Level of detail"),
    hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
    include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
    max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
    rank: z.enum(["mrec", "create"]).default("mrec").describe("'mrec' for latest, 'create' for first added"),
    spp_locale: z.string().default("en").describe("Language for common names"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      detail: args.detail,
      hotspot: args.hotspot,
      includeProvisional: args.include_provisional,
      rank: args.rank,
      sppLocale: args.spp_locale,
    };
    if (args.cat) params.cat = args.cat;
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/data/obs/${args.region_code}/historic/${args.year}/${args.month}/${args.day}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// =============================================================================
// PRODUCTS
// =============================================================================

server.tool(
  "get_top_100",
  "Get the top 100 contributors on a given date.",
  {
    region_code: z.string().describe("Country or subnational1 code"),
    year: z.number().min(1800).describe("Year"),
    month: z.number().min(1).max(12).describe("Month"),
    day: z.number().min(1).max(31).describe("Day of month"),
    ranked_by: z.enum(["spp", "cl"]).default("spp").describe("'spp' for species count, 'cl' for checklist count"),
    max_results: z.number().min(1).max(100).optional().describe("Limit results"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = { rankedBy: args.ranked_by };
    if (args.max_results) params.maxResults = args.max_results;

    const result = await makeRequest(`/product/top100/${args.region_code}/${args.year}/${args.month}/${args.day}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_recent_checklists",
  "Get the most recently submitted checklists for a region.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    max_results: z.number().min(1).max(200).default(10).describe("Number of checklists to return"),
  },
  async (args) => {
    const result = await makeRequest(`/product/lists/${args.region_code}`, { maxResults: args.max_results });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_checklists_on_date",
  "Get checklists submitted on a specific date.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    year: z.number().describe("Year"),
    month: z.number().min(1).max(12).describe("Month"),
    day: z.number().min(1).max(31).describe("Day of month"),
    sort_key: z.enum(["obs_dt", "creation_dt"]).default("obs_dt").describe("Sort by observation or submission date"),
    max_results: z.number().min(1).max(200).default(10).describe("Number of checklists to return"),
  },
  async (args) => {
    const result = await makeRequest(
      `/product/lists/${args.region_code}/${args.year}/${args.month}/${args.day}`,
      { sortKey: args.sort_key, maxResults: args.max_results }
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_regional_statistics",
  "Get statistics for a region on a specific date (checklist count, species count, contributor count).",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    year: z.number().describe("Year"),
    month: z.number().min(1).max(12).describe("Month"),
    day: z.number().min(1).max(31).describe("Day of month"),
  },
  async (args) => {
    const result = await makeRequest(`/product/stats/${args.region_code}/${args.year}/${args.month}/${args.day}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_species_list",
  "Get all species ever recorded in a region (species codes in taxonomic order).",
  {
    region_code: z.string().describe("Any region code (country, subnational, location, etc.)"),
  },
  async (args) => {
    const result = await makeRequest(`/product/spplist/${args.region_code}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_checklist",
  "Get details of a specific checklist including all observations.",
  {
    sub_id: z.string().describe("The checklist identifier (e.g., 'S29893687')"),
  },
  async (args) => {
    const result = await makeRequest(`/product/checklist/view/${args.sub_id}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// =============================================================================
// REFERENCE: GEOGRAPHY
// =============================================================================

server.tool(
  "get_adjacent_regions",
  "Get regions that share a border with the specified region.",
  {
    region_code: z.string().describe("Country, subnational1, or subnational2 code"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/adjacent/${args.region_code}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// =============================================================================
// REFERENCE: HOTSPOTS
// =============================================================================

server.tool(
  "get_hotspots_in_region",
  "Get birding hotspots in a region.",
  {
    region_code: z.string().describe("Country, subnational1, or subnational2 code"),
    back: z.number().min(1).max(30).optional().describe("Only hotspots visited in last N days"),
    fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = { fmt: args.fmt };
    if (args.back) params.back = args.back;

    const result = await makeRequest(`/ref/hotspot/${args.region_code}`, params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_nearby_hotspots",
  "Get birding hotspots near a location.",
  {
    lat: z.number().min(-90).max(90).describe("Latitude"),
    lng: z.number().min(-180).max(180).describe("Longitude"),
    back: z.number().min(1).max(30).optional().describe("Only hotspots visited in last N days"),
    dist: z.number().min(0).max(500).default(25).describe("Search radius in kilometers"),
    fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      lat: args.lat,
      lng: args.lng,
      dist: args.dist,
      fmt: args.fmt,
    };
    if (args.back) params.back = args.back;

    const result = await makeRequest("/ref/hotspot/geo", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_hotspot_info",
  "Get information about a specific hotspot.",
  {
    loc_id: z.string().describe("The location code (e.g., 'L99381')"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/hotspot/info/${args.loc_id}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// =============================================================================
// REFERENCE: TAXONOMY
// =============================================================================

server.tool(
  "get_taxonomy",
  "Get the eBird taxonomy (list of all species with codes, names, and classification).",
  {
    cat: z.string().optional().describe("Taxonomic category filter (e.g., 'species', 'issf', 'hybrid')"),
    fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
    locale: z.string().default("en").describe("Language for common names"),
    species: z.string().optional().describe("Comma-separated species codes to fetch (e.g., 'cangoo,barswa')"),
    version: z.string().optional().describe("Specific taxonomy version"),
  },
  async (args) => {
    const params: Record<string, string | number | boolean> = {
      fmt: args.fmt,
      locale: args.locale,
    };
    if (args.cat) params.cat = args.cat;
    if (args.species) params.species = args.species;
    if (args.version) params.version = args.version;

    const result = await makeRequest("/ref/taxonomy/ebird", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_taxonomic_forms",
  "Get subspecies/forms for a species.",
  {
    species_code: z.string().describe("The species code (e.g., 'cangoo' for Canada Goose)"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/taxon/forms/${args.species_code}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_taxa_locales",
  "Get available language codes for species names.",
  {},
  async () => {
    const result = await makeRequest("/ref/taxa-locales/ebird");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_taxonomy_versions",
  "Get all available taxonomy versions.",
  {},
  async () => {
    const result = await makeRequest("/ref/taxonomy/versions");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_taxonomic_groups",
  "Get species groups (e.g., 'Waterfowl', 'Raptors').",
  {
    species_grouping: z.enum(["ebird", "merlin"]).default("ebird").describe("'ebird' for taxonomic order, 'merlin' for similar birds grouped"),
    group_name_locale: z.string().default("en").describe("Language for group names"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/sppgroup/${args.species_grouping}`, {
      groupNameLocale: args.group_name_locale,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// =============================================================================
// REFERENCE: REGION
// =============================================================================

server.tool(
  "get_region_info",
  "Get information about a region including name, bounds, and parent hierarchy.",
  {
    region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
    region_name_format: z.enum(["detailed", "detailednoqual", "full", "namequal", "nameonly", "revdetailed"]).default("full").describe("Name format"),
    delim: z.string().default(", ").describe("Delimiter for name elements"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/region/info/${args.region_code}`, {
      regionNameFormat: args.region_name_format,
      delim: args.delim,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "get_sub_regions",
  "Get sub-regions within a parent region. Examples: get_sub_regions('country', 'world') for all countries, get_sub_regions('subnational1', 'US') for US states.",
  {
    region_type: z.enum(["country", "subnational1", "subnational2"]).describe("Type of sub-regions"),
    parent_region_code: z.string().describe("Parent region code, or 'world' for countries"),
    fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
  },
  async (args) => {
    const result = await makeRequest(`/ref/region/list/${args.region_type}/${args.parent_region_code}`, {
      fmt: args.fmt,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

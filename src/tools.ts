/**
 * eBird MCP Tool Definitions
 *
 * Platform-agnostic tool definitions for the eBird API 2.0.
 * These can be consumed by any MCP server implementation (stdio, Cloudflare Workers, etc).
 */

import { z } from "zod";

export const BASE_URL = "https://api.ebird.org/v2";

export async function makeRequest(
  apiKey: string,
  endpoint: string,
  params: Record<string, string | number | boolean> = {}
): Promise<unknown> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: { "X-eBirdApiToken": apiKey },
  });

  if (!response.ok) {
    throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  handler: (args: Record<string, any>, apiKey: string) => Promise<unknown>;
}

export const tools: ToolDefinition[] = [
  // ===========================================================================
  // OBSERVATIONS
  // ===========================================================================
  {
    name: "get_recent_observations",
    description:
      "Get recent bird observations in a region (up to 30 days ago). Returns species, location, date, and count info.",
    schema: {
      region_code: z
        .string()
        .describe(
          "Country, subnational1, subnational2, or location code (e.g., 'US', 'US-NY', 'US-NY-109', 'L99381')"
        ),
      back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch (1-30)"),
      cat: z.string().optional().describe("Taxonomic category filter (e.g., 'species', 'hybrid')"),
      hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
      include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
      max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
      spp_locale: z.string().default("en").describe("Language for common names"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        back: args.back,
        hotspot: args.hotspot,
        includeProvisional: args.include_provisional,
        sppLocale: args.spp_locale,
      };
      if (args.cat) params.cat = args.cat;
      if (args.max_results) params.maxResults = args.max_results;
      return makeRequest(apiKey, `/data/obs/${args.region_code}/recent`, params);
    },
  },
  {
    name: "get_notable_observations",
    description:
      "Get recent notable/rare bird observations in a region. Notable observations are for locally or nationally rare species.",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
      detail: z.enum(["simple", "full"]).default("simple").describe("Level of detail in response"),
      hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
      max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
      spp_locale: z.string().default("en").describe("Language for common names"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        back: args.back,
        detail: args.detail,
        hotspot: args.hotspot,
        sppLocale: args.spp_locale,
      };
      if (args.max_results) params.maxResults = args.max_results;
      return makeRequest(apiKey, `/data/obs/${args.region_code}/recent/notable`, params);
    },
  },
  {
    name: "get_species_observations",
    description: "Get recent observations of a specific species in a region.",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      species_code: z
        .string()
        .describe("eBird species code (e.g., 'cangoo' for Canada Goose, 'barswa' for Barn Swallow)"),
      back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
      hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
      include_provisional: z.boolean().default(false).describe("Include unreviewed observations"),
      max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
      spp_locale: z.string().default("en").describe("Language for common names"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        back: args.back,
        hotspot: args.hotspot,
        includeProvisional: args.include_provisional,
        sppLocale: args.spp_locale,
      };
      if (args.max_results) params.maxResults = args.max_results;
      return makeRequest(apiKey, `/data/obs/${args.region_code}/recent/${args.species_code}`, params);
    },
  },
  {
    name: "get_nearby_observations",
    description: "Get recent observations near a geographic location.",
    schema: {
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
    handler: async (args, apiKey) => {
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
      return makeRequest(apiKey, "/data/obs/geo/recent", params);
    },
  },
  {
    name: "get_nearby_species_observations",
    description: "Get recent observations of a specific species near a location.",
    schema: {
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
    handler: async (args, apiKey) => {
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
      return makeRequest(apiKey, `/data/obs/geo/recent/${args.species_code}`, params);
    },
  },
  {
    name: "get_nearest_species_observations",
    description: "Find the nearest locations where a species has been seen recently.",
    schema: {
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
    handler: async (args, apiKey) => {
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
      return makeRequest(apiKey, `/data/nearest/geo/recent/${args.species_code}`, params);
    },
  },
  {
    name: "get_nearby_notable_observations",
    description: "Get notable/rare observations near a location.",
    schema: {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lng: z.number().min(-180).max(180).describe("Longitude"),
      back: z.number().min(1).max(30).default(14).describe("Number of days back to fetch"),
      detail: z.enum(["simple", "full"]).default("simple").describe("Level of detail"),
      dist: z.number().min(0).max(50).default(25).describe("Search radius in kilometers"),
      hotspot: z.boolean().default(false).describe("Only fetch from hotspots"),
      max_results: z.number().min(1).max(10000).optional().describe("Maximum observations to return"),
      spp_locale: z.string().default("en").describe("Language for common names"),
    },
    handler: async (args, apiKey) => {
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
      return makeRequest(apiKey, "/data/obs/geo/recent/notable", params);
    },
  },
  {
    name: "get_historic_observations",
    description: "Get observations from a specific date in history.",
    schema: {
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
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        detail: args.detail,
        hotspot: args.hotspot,
        includeProvisional: args.include_provisional,
        rank: args.rank,
        sppLocale: args.spp_locale,
      };
      if (args.cat) params.cat = args.cat;
      if (args.max_results) params.maxResults = args.max_results;
      return makeRequest(
        apiKey,
        `/data/obs/${args.region_code}/historic/${args.year}/${args.month}/${args.day}`,
        params
      );
    },
  },

  // ===========================================================================
  // PRODUCTS
  // ===========================================================================
  {
    name: "get_top_100",
    description: "Get the top 100 contributors on a given date.",
    schema: {
      region_code: z.string().describe("Country or subnational1 code"),
      year: z.number().min(1800).describe("Year"),
      month: z.number().min(1).max(12).describe("Month"),
      day: z.number().min(1).max(31).describe("Day of month"),
      ranked_by: z
        .enum(["spp", "cl"])
        .default("spp")
        .describe("'spp' for species count, 'cl' for checklist count"),
      max_results: z.number().min(1).max(100).optional().describe("Limit results"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = { rankedBy: args.ranked_by };
      if (args.max_results) params.maxResults = args.max_results;
      return makeRequest(
        apiKey,
        `/product/top100/${args.region_code}/${args.year}/${args.month}/${args.day}`,
        params
      );
    },
  },
  {
    name: "get_recent_checklists",
    description: "Get the most recently submitted checklists for a region.",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      max_results: z.number().min(1).max(200).default(10).describe("Number of checklists to return"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/product/lists/${args.region_code}`, {
        maxResults: args.max_results,
      });
    },
  },
  {
    name: "get_checklists_on_date",
    description: "Get checklists submitted on a specific date.",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      year: z.number().describe("Year"),
      month: z.number().min(1).max(12).describe("Month"),
      day: z.number().min(1).max(31).describe("Day of month"),
      sort_key: z
        .enum(["obs_dt", "creation_dt"])
        .default("obs_dt")
        .describe("Sort by observation or submission date"),
      max_results: z.number().min(1).max(200).default(10).describe("Number of checklists to return"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(
        apiKey,
        `/product/lists/${args.region_code}/${args.year}/${args.month}/${args.day}`,
        { sortKey: args.sort_key, maxResults: args.max_results }
      );
    },
  },
  {
    name: "get_regional_statistics",
    description:
      "Get statistics for a region on a specific date (checklist count, species count, contributor count).",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      year: z.number().describe("Year"),
      month: z.number().min(1).max(12).describe("Month"),
      day: z.number().min(1).max(31).describe("Day of month"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(
        apiKey,
        `/product/stats/${args.region_code}/${args.year}/${args.month}/${args.day}`
      );
    },
  },
  {
    name: "get_species_list",
    description: "Get all species ever recorded in a region (species codes in taxonomic order).",
    schema: {
      region_code: z.string().describe("Any region code (country, subnational, location, etc.)"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/product/spplist/${args.region_code}`);
    },
  },
  {
    name: "get_checklist",
    description: "Get details of a specific checklist including all observations.",
    schema: {
      sub_id: z.string().describe("The checklist identifier (e.g., 'S29893687')"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/product/checklist/view/${args.sub_id}`);
    },
  },

  // ===========================================================================
  // REFERENCE: GEOGRAPHY
  // ===========================================================================
  {
    name: "get_adjacent_regions",
    description: "Get regions that share a border with the specified region.",
    schema: {
      region_code: z.string().describe("Country, subnational1, or subnational2 code"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/ref/adjacent/${args.region_code}`);
    },
  },

  // ===========================================================================
  // REFERENCE: HOTSPOTS
  // ===========================================================================
  {
    name: "get_hotspots_in_region",
    description: "Get birding hotspots in a region.",
    schema: {
      region_code: z.string().describe("Country, subnational1, or subnational2 code"),
      back: z.number().min(1).max(30).optional().describe("Only hotspots visited in last N days"),
      fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = { fmt: args.fmt };
      if (args.back) params.back = args.back;
      return makeRequest(apiKey, `/ref/hotspot/${args.region_code}`, params);
    },
  },
  {
    name: "get_nearby_hotspots",
    description: "Get birding hotspots near a location.",
    schema: {
      lat: z.number().min(-90).max(90).describe("Latitude"),
      lng: z.number().min(-180).max(180).describe("Longitude"),
      back: z.number().min(1).max(30).optional().describe("Only hotspots visited in last N days"),
      dist: z.number().min(0).max(500).default(25).describe("Search radius in kilometers"),
      fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        lat: args.lat,
        lng: args.lng,
        dist: args.dist,
        fmt: args.fmt,
      };
      if (args.back) params.back = args.back;
      return makeRequest(apiKey, "/ref/hotspot/geo", params);
    },
  },
  {
    name: "get_hotspot_info",
    description: "Get information about a specific hotspot.",
    schema: {
      loc_id: z.string().describe("The location code (e.g., 'L99381')"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/ref/hotspot/info/${args.loc_id}`);
    },
  },

  // ===========================================================================
  // REFERENCE: TAXONOMY
  // ===========================================================================
  {
    name: "get_taxonomy",
    description:
      "Get the eBird taxonomy (list of all species with codes, names, and classification).",
    schema: {
      cat: z
        .string()
        .optional()
        .describe("Taxonomic category filter (e.g., 'species', 'issf', 'hybrid')"),
      fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
      locale: z.string().default("en").describe("Language for common names"),
      species: z
        .string()
        .optional()
        .describe("Comma-separated species codes to fetch (e.g., 'cangoo,barswa')"),
      version: z.string().optional().describe("Specific taxonomy version"),
    },
    handler: async (args, apiKey) => {
      const params: Record<string, string | number | boolean> = {
        fmt: args.fmt,
        locale: args.locale,
      };
      if (args.cat) params.cat = args.cat;
      if (args.species) params.species = args.species;
      if (args.version) params.version = args.version;
      return makeRequest(apiKey, "/ref/taxonomy/ebird", params);
    },
  },
  {
    name: "get_taxonomic_forms",
    description: "Get subspecies/forms for a species.",
    schema: {
      species_code: z.string().describe("The species code (e.g., 'cangoo' for Canada Goose)"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/ref/taxon/forms/${args.species_code}`);
    },
  },
  {
    name: "get_taxa_locales",
    description: "Get available language codes for species names.",
    schema: {},
    handler: async (_args, apiKey) => {
      return makeRequest(apiKey, "/ref/taxa-locales/ebird");
    },
  },
  {
    name: "get_taxonomy_versions",
    description: "Get all available taxonomy versions.",
    schema: {},
    handler: async (_args, apiKey) => {
      return makeRequest(apiKey, "/ref/taxonomy/versions");
    },
  },
  {
    name: "get_taxonomic_groups",
    description: "Get species groups (e.g., 'Waterfowl', 'Raptors').",
    schema: {
      species_grouping: z
        .enum(["ebird", "merlin"])
        .default("ebird")
        .describe("'ebird' for taxonomic order, 'merlin' for similar birds grouped"),
      group_name_locale: z.string().default("en").describe("Language for group names"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/ref/sppgroup/${args.species_grouping}`, {
        groupNameLocale: args.group_name_locale,
      });
    },
  },

  // ===========================================================================
  // REFERENCE: REGION
  // ===========================================================================
  {
    name: "get_region_info",
    description:
      "Get information about a region including name, bounds, and parent hierarchy.",
    schema: {
      region_code: z.string().describe("Country, subnational1, subnational2, or location code"),
      region_name_format: z
        .enum(["detailed", "detailednoqual", "full", "namequal", "nameonly", "revdetailed"])
        .default("full")
        .describe("Name format"),
      delim: z.string().default(", ").describe("Delimiter for name elements"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(apiKey, `/ref/region/info/${args.region_code}`, {
        regionNameFormat: args.region_name_format,
        delim: args.delim,
      });
    },
  },
  {
    name: "get_sub_regions",
    description:
      "Get sub-regions within a parent region. Examples: get_sub_regions('country', 'world') for all countries, get_sub_regions('subnational1', 'US') for US states.",
    schema: {
      region_type: z
        .enum(["country", "subnational1", "subnational2"])
        .describe("Type of sub-regions"),
      parent_region_code: z.string().describe("Parent region code, or 'world' for countries"),
      fmt: z.enum(["json", "csv"]).default("json").describe("Response format"),
    },
    handler: async (args, apiKey) => {
      return makeRequest(
        apiKey,
        `/ref/region/list/${args.region_type}/${args.parent_region_code}`,
        { fmt: args.fmt }
      );
    },
  },
];

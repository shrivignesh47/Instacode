// Supabase Edge Function to proxy LeetCode API requests
// This helps avoid CORS issues when fetching from the frontend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LEETCODE_API_BASE_URL = "https://alfa-leetcode-api.onrender.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").slice(2).join("/"); // Remove /leetcode-proxy/
    
    if (!path) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Forward the request to the LeetCode API
    const leetcodeUrl = `${LEETCODE_API_BASE_URL}/${path}${url.search}`;
    console.log(`Proxying request to: ${leetcodeUrl}`);
    
    const response = await fetch(leetcodeUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in LeetCode proxy:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch data from LeetCode API",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
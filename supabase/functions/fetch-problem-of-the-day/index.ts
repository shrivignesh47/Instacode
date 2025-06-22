import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Mock data for GeeksforGeeks problem of the day
const gfgProblemOfTheDay = {
  id: 12345,
  date: new Date().toISOString(),
  is_solved: false,
  problem_id: 98765,
  problem_name: "Minimum Spanning Tree",
  problem_url: "https://practice.geeksforgeeks.org/problems/minimum-spanning-tree/1",
  remaining_time: 43200, // 12 hours in seconds
  difficulty: "medium",
  accuracy: 48.5,
  total_submissions: 12500,
  tags: {
    company_tags: ["Amazon", "Microsoft", "Google"],
    topic_tags: ["Graph", "Greedy", "Minimum Spanning Tree"]
  }
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
    // In a real implementation, you would fetch this from an external API
    // For now, we'll return mock data
    return new Response(
      JSON.stringify(gfgProblemOfTheDay),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching problem of the day:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch problem of the day",
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
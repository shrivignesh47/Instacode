import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Mock data for CodeChef contests
const codechefContests = {
  future_contests: [
    {
      contest_code: "JUNE24",
      contest_name: "June Long Challenge 2024",
      start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      end_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(), // 13 days from now
      link: "https://www.codechef.com/JUNE24"
    },
    {
      contest_code: "COOK143",
      contest_name: "June Cook-Off 2024",
      start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 10 days + 3 hours from now
      link: "https://www.codechef.com/COOK143"
    },
    {
      contest_code: "LTIME116",
      contest_name: "June Lunchtime 2024",
      start_date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(), // 17 days from now
      end_date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 17 days + 3 hours from now
      link: "https://www.codechef.com/LTIME116"
    }
  ],
  past_contests: [
    {
      contest_code: "MAY24",
      contest_name: "May Long Challenge 2024",
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      end_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      link: "https://www.codechef.com/MAY24"
    },
    {
      contest_code: "COOK142",
      contest_name: "May Cook-Off 2024",
      start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      end_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 15 days ago + 3 hours
      link: "https://www.codechef.com/COOK142"
    }
  ]
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
    // In a real implementation, you would fetch this from the CodeChef API
    // For now, we'll return mock data
    return new Response(
      JSON.stringify(codechefContests),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching CodeChef contests:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to fetch CodeChef contests",
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
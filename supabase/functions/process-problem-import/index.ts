import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { importId, problems } = await req.json();

    if (!importId || !problems || !Array.isArray(problems)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update import status to processing
    await supabaseClient
      .from("problem_imports")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", importId);

    // Process each problem
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const problem of problems) {
      try {
        // Validate problem data
        if (!problem.title || !problem.description || !problem.difficulty) {
          throw new Error(`Problem "${problem.title || 'Untitled'}" is missing required fields`);
        }

        // Insert problem
        const { data: problemData, error: problemError } = await supabaseClient
          .from("problems")
          .insert({
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty.toLowerCase(),
            category: problem.category || null,
            tags: problem.tags || [],
            starter_code: problem.starter_code || "",
            solution_code: problem.solution_code || "",
            time_limit_ms: problem.time_limit_ms || 1000,
            memory_limit_mb: problem.memory_limit_mb || 128,
            points: problem.points || 100,
            created_by: user.id,
            is_approved: true
          })
          .select()
          .single();

        if (problemError) {
          throw problemError;
        }

        // Insert test cases if provided
        if (problem.test_cases && Array.isArray(problem.test_cases)) {
          const testCases = problem.test_cases.map((tc, index) => ({
            problem_id: problemData.id,
            input: tc.input,
            expected_output: tc.expected_output,
            is_sample: tc.is_sample || index < 2, // Make first two test cases samples by default
            order_index: index
          }));

          const { error: testCasesError } = await supabaseClient
            .from("problem_test_cases")
            .insert(testCases);

          if (testCasesError) {
            throw testCasesError;
          }
        }

        results.push({
          title: problem.title,
          id: problemData.id,
          status: "success"
        });
        successCount++;
      } catch (error) {
        console.error(`Error processing problem "${problem.title || 'Untitled'}":`, error);
        results.push({
          title: problem.title || 'Untitled',
          status: "error",
          error: error.message
        });
        errorCount++;
      }
    }

    // Update import status to completed
    await supabaseClient
      .from("problem_imports")
      .update({
        status: "completed",
        problems_count: successCount,
        error_message: errorCount > 0 ? `${errorCount} problems failed to import` : null,
        updated_at: new Date().toISOString()
      })
      .eq("id", importId);

    return new Response(
      JSON.stringify({
        success: true,
        import_id: importId,
        total: problems.length,
        successful: successCount,
        failed: errorCount,
        results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing problem import:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process problem import",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
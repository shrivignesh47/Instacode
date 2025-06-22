import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Piston API for code execution
const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

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
    const { challengeId, code, language } = await req.json();

    if (!challengeId || !code || !language) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch challenge and test cases
    const { data: challenge, error: challengeError } = await supabaseClient
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: "Challenge not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: testCases, error: testCasesError } = await supabaseClient
      .from("test_cases")
      .select("*")
      .eq("challenge_id", challengeId)
      .order("order_index", { ascending: true });

    if (testCasesError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch test cases" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a submission record with pending status
    const { data: submission, error: submissionError } = await supabaseClient
      .from("submissions")
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        code,
        language,
        status: "pending",
        test_cases_passed: 0,
        test_cases_total: testCases.length,
      })
      .select()
      .single();

    if (submissionError) {
      return new Response(
        JSON.stringify({ error: "Failed to create submission" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update submission to running status
    await supabaseClient
      .from("submissions")
      .update({ status: "running" })
      .eq("id", submission.id);

    // Execute code against each test case
    const testResults = [];
    let passedCount = 0;
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;
    let errorMessage = null;
    let status = "accepted";

    for (const testCase of testCases) {
      try {
        // Map language to Piston API format
        const pistonLanguage = mapLanguageToPiston(language);
        
        // Prepare request to Piston API
        const pistonRequest = {
          language: pistonLanguage.language,
          version: pistonLanguage.version,
          files: [
            {
              name: `main${pistonLanguage.extension}`,
              content: code,
            },
          ],
          stdin: testCase.input,
          compile_timeout: challenge.time_limit_ms,
          run_timeout: challenge.time_limit_ms,
          compile_memory_limit: challenge.memory_limit_mb * 1024 * 1024,
          run_memory_limit: challenge.memory_limit_mb * 1024 * 1024,
        };

        // Execute code using Piston API
        const response = await fetch(PISTON_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pistonRequest),
        });

        if (!response.ok) {
          throw new Error(`Piston API error: ${response.statusText}`);
        }

        const result = await response.json();

        // Check for compilation errors
        if (result.compile && result.compile.stderr) {
          status = "compilation_error";
          errorMessage = result.compile.stderr;
          break;
        }

        // Check for runtime errors
        if (result.run.stderr) {
          status = "runtime_error";
          errorMessage = result.run.stderr;
          break;
        }

        // Check for time limit exceeded
        if (result.run.code === 137) {
          status = "time_limit_exceeded";
          break;
        }

        // Check output against expected output
        const actualOutput = result.run.stdout.trim();
        const expectedOutput = testCase.expected_output.trim();
        const passed = actualOutput === expectedOutput;

        if (passed) {
          passedCount++;
        } else if (status === "accepted") {
          status = "wrong_answer";
        }

        // Track execution metrics
        const executionTime = result.run.time || 0;
        totalExecutionTime += executionTime;
        
        const memoryUsed = result.run.memory || 0;
        maxMemoryUsed = Math.max(maxMemoryUsed, memoryUsed);

        // Add test result
        testResults.push({
          test_case_id: testCase.id,
          input: testCase.input,
          expected_output: testCase.expected_output,
          actual_output: actualOutput,
          passed,
          execution_time_ms: executionTime,
          memory_used_mb: memoryUsed / (1024 * 1024), // Convert bytes to MB
          is_sample: testCase.is_sample,
        });
      } catch (error) {
        console.error("Error executing code:", error);
        status = "runtime_error";
        errorMessage = error.message;
        break;
      }
    }

    // Calculate average execution time
    const avgExecutionTime = testResults.length > 0 
      ? totalExecutionTime / testResults.length 
      : 0;

    // Update submission with results
    await supabaseClient
      .from("submissions")
      .update({
        status,
        test_cases_passed: passedCount,
        test_cases_total: testCases.length,
        execution_time_ms: avgExecutionTime,
        memory_used_mb: maxMemoryUsed / (1024 * 1024), // Convert bytes to MB
        error_message: errorMessage,
      })
      .eq("id", submission.id);

    // Update user challenge stats
    if (status === "accepted") {
      // Check if user already has stats for this challenge
      const { data: existingStats } = await supabaseClient
        .from("user_challenge_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .maybeSingle();

      if (existingStats) {
        // Update existing stats
        await supabaseClient
          .from("user_challenge_stats")
          .update({
            attempts: existingStats.attempts + 1,
            solved: true,
            best_execution_time_ms: Math.min(
              existingStats.best_execution_time_ms || Infinity,
              avgExecutionTime
            ),
            best_memory_used_mb: Math.min(
              existingStats.best_memory_used_mb || Infinity,
              maxMemoryUsed / (1024 * 1024)
            ),
            points_earned: challenge.points,
            last_attempted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStats.id);
      } else {
        // Create new stats
        await supabaseClient
          .from("user_challenge_stats")
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            attempts: 1,
            solved: true,
            best_execution_time_ms: avgExecutionTime,
            best_memory_used_mb: maxMemoryUsed / (1024 * 1024),
            points_earned: challenge.points,
            last_attempted_at: new Date().toISOString(),
          });
      }
    } else {
      // Update attempts count even if not solved
      const { data: existingStats } = await supabaseClient
        .from("user_challenge_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .maybeSingle();

      if (existingStats) {
        await supabaseClient
          .from("user_challenge_stats")
          .update({
            attempts: existingStats.attempts + 1,
            last_attempted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingStats.id);
      } else {
        await supabaseClient
          .from("user_challenge_stats")
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            attempts: 1,
            solved: false,
            last_attempted_at: new Date().toISOString(),
          });
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        submission_id: submission.id,
        status,
        test_cases_passed: passedCount,
        test_cases_total: testCases.length,
        execution_time_ms: avgExecutionTime,
        memory_used_mb: maxMemoryUsed / (1024 * 1024),
        error_message: errorMessage,
        test_results: testResults.filter(result => result.is_sample), // Only return sample test results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in judge-code function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to map language to Piston API format
function mapLanguageToPiston(language: string) {
  const mappings: Record<string, { language: string; version: string; extension: string }> = {
    javascript: { language: "javascript", version: "18.15.0", extension: ".js" },
    python: { language: "python", version: "3.10.0", extension: ".py" },
    java: { language: "java", version: "15.0.2", extension: ".java" },
    cpp: { language: "cpp", version: "10.2.0", extension: ".cpp" },
    c: { language: "c", version: "10.2.0", extension: ".c" },
    csharp: { language: "csharp", version: "6.12.0", extension: ".cs" },
    go: { language: "go", version: "1.16.2", extension: ".go" },
    rust: { language: "rust", version: "1.68.2", extension: ".rs" },
    php: { language: "php", version: "8.2.3", extension: ".php" },
    ruby: { language: "ruby", version: "3.0.1", extension: ".rb" },
    typescript: { language: "typescript", version: "5.0.3", extension: ".ts" },
  };

  return mappings[language] || { language, version: "*", extension: ".txt" };
}
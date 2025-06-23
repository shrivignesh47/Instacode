import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.47.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Judge0 API Setup
const JUDGE0_API_URL = "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true";
const JUDGE0_HEADERS = {
  "Content-Type": "application/json",
  "x-rapidapi-key": "f05bcdf01amshc2a92c4c298310cp173b13jsn32d07cde987c",
  "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { problemId, code, language, challengeId } = await req.json();
    if (!problemId || !code || !language) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Processing submission for problem ${problemId}, language: ${language}`);

    const { data: problem, error: problemError } = await supabaseClient
      .from("problems").select("*").eq("id", problemId).single();
    if (problemError || !problem) {
      return new Response(JSON.stringify({ error: "Problem not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: testCases, error: testCasesError } = await supabaseClient
      .from("problem_test_cases").select("*").eq("problem_id", problemId).order("order_index", { ascending: true });
    if (testCasesError) {
      return new Response(JSON.stringify({ error: "Failed to fetch test cases" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Found ${testCases.length} test cases for problem ${problemId}`);

    const { data: submission, error: submissionError } = await supabaseClient
      .from("problem_submissions").insert({
        problem_id: problemId,
        user_id: user.id,
        challenge_id: challengeId || null,
        code,
        language,
        status: "pending",
        test_cases_passed: 0,
        test_cases_total: testCases.length
      }).select().single();
    if (submissionError) {
      return new Response(JSON.stringify({ error: "Failed to create submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await supabaseClient.from("problem_submissions").update({ status: "running" }).eq("id", submission.id);

    const testResults = [];
    let passedCount = 0;
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;
    let errorMessage = null;
    let status = "accepted";

    for (const testCase of testCases) {
      try {
        const languageId = mapLanguageToJudge0Id(language);
        console.log(`Mapped language ${language} to Judge0 ID: ${languageId}`);

        // Prepare code with proper entry point based on language
        const preparedCode = prepareCodeForLanguage(code, language);
        
        const judge0Request = {
          language_id: languageId,
          source_code: preparedCode,
          stdin: testCase.input
        };

        console.log(`Sending request to Judge0 API for test case ${testCase.id}`);
        const response = await fetch(JUDGE0_API_URL, {
          method: "POST",
          headers: JUDGE0_HEADERS,
          body: JSON.stringify(judge0Request)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Judge0 API error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Judge0 API error: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Judge0 API response:`, JSON.stringify(result, null, 2));

        // Check for compilation errors
        if (result.compile_output) {
          console.log(`Compilation error: ${result.compile_output}`);
          status = "compilation_error";
          errorMessage = result.compile_output;
          break;
        }

        // Check for runtime errors
        if (result.stderr) {
          console.log(`Runtime error: ${result.stderr}`);
          status = "runtime_error";
          errorMessage = result.stderr;
          break;
        }

        // Check output against expected output
        const actualOutput = (result.stdout || "").trim();
        const expectedOutput = testCase.expected_output.trim();
        const passed = actualOutput === expectedOutput;

        console.log(`Test case ${testCase.id} result:`, {
          passed,
          actualOutput,
          expectedOutput
        });

        if (passed) {
          passedCount++;
        } else if (status === "accepted") {
          status = "wrong_answer";
        }

        // Track execution metrics
        const executionTime = result.time ? result.time * 1000 : 0;
        totalExecutionTime += executionTime;
        
        const memoryUsed = result.memory || 0;
        maxMemoryUsed = Math.max(maxMemoryUsed, memoryUsed);

        // Add test result
        testResults.push({
          test_case_id: testCase.id,
          input: testCase.input,
          expected_output: expectedOutput,
          actual_output: actualOutput,
          passed,
          execution_time_ms: executionTime,
          memory_used_mb: memoryUsed / 1024,
          is_sample: testCase.is_sample
        });
      } catch (error) {
        console.error("Error executing code:", error);
        status = "runtime_error";
        errorMessage = error.message;
        break;
      }
    }

    const avgExecutionTime = testResults.length > 0 ? totalExecutionTime / testResults.length : 0;

    console.log(`Submission results: status=${status}, passed=${passedCount}/${testCases.length}`);

    await supabaseClient.from("problem_submissions").update({
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      error_message: errorMessage
    }).eq("id", submission.id);

    return new Response(JSON.stringify({
      submission_id: submission.id,
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      error_message: errorMessage,
      test_results: testResults.filter((r) => r.is_sample)
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in judge-problem function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// Language mapping to Judge0 language IDs
function mapLanguageToJudge0Id(language: string): number {
  const mapping: Record<string, number> = {
    javascript: 63,  // Node.js
    typescript: 74,
    python: 71,      // Python 3
    java: 62,        // JDK
    cpp: 54,         // C++ (GCC)
    c: 50,           // C (GCC)
    csharp: 51,      // C#
    ruby: 72,
    go: 60,
    rust: 73,
    php: 68,
    swift: 83,
    kotlin: 78
  };
  return mapping[language] || 71; // Default to Python 3
}

// Prepare code for different languages to ensure proper execution
function prepareCodeForLanguage(code: string, language: string): string {
  switch (language) {
    case 'java':
      // If code doesn't have a Main class with main method, wrap it
      if (!code.includes('public class Main') && !code.includes('public static void main')) {
        return `
public class Main {
    public static void main(String[] args) {
        Solution solution = new Solution();
        // The rest will be handled by the test case input
        ${code}
    }
}
        `;
      }
      break;
    
    case 'cpp':
    case 'c':
      // If code doesn't have a main function, add one
      if (!code.includes('int main(')) {
        return `
#include <iostream>
#include <vector>
#include <string>
using namespace std;

${code}

int main() {
    // The rest will be handled by the test case input
    return 0;
}
        `;
      }
      break;
      
    case 'csharp':
      // If code doesn't have a Main method, add one
      if (!code.includes('static void Main')) {
        return `
using System;
using System.Collections.Generic;
using System.Linq;

class Program {
    static void Main(string[] args) {
        // The rest will be handled by the test case input
        ${code}
    }
}
        `;
      }
      break;
  }
  
  return code; // Return original code for other languages
}
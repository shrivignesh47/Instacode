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
async function updateUserProblemStats(supabaseClient, submissionResult, userId, problemId, problemPoints) {
  try {
    console.log("🔄 Updating user problem stats...");
    console.log("📊 Submission result:", JSON.stringify(submissionResult, null, 2));
    console.log("🧑 User ID:", userId);
    console.log("🧩 Problem ID:", problemId);
    console.log("🏆 Problem Points:", problemPoints);
    // Fetch existing stats
    const { data: existingStats, error: fetchError } = await supabaseClient.from("user_problem_stats").select("*").eq("user_id", userId).eq("problem_id", problemId).single();
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("❌ Error fetching existing stats:", fetchError.message);
      return;
    }
    console.log("📂 Existing stats:", JSON.stringify(existingStats, null, 2));
    const isAccepted = submissionResult.status === "accepted";
    const wasPreviouslySolved = existingStats?.solved || false;
    function getNormalizedTimestamp() {
      const now = new Date();
      return now.toISOString().replace("Z", "+00:00");
    }
    const now = getNormalizedTimestamp();
    const updateData = {
      attempts: (existingStats?.attempts || 0) + 1,
      last_attempted_at: now,
      updated_at: now
    };
    if (isAccepted) {
      updateData.solved = true;
      if (!existingStats?.best_execution_time_ms || submissionResult.execution_time_ms < existingStats.best_execution_time_ms) {
        updateData.best_execution_time_ms = submissionResult.execution_time_ms;
      }
      if (!existingStats?.best_memory_used_mb || submissionResult.memory_used_mb < existingStats.best_memory_used_mb) {
        updateData.best_memory_used_mb = submissionResult.memory_used_mb;
      }
      if (!wasPreviouslySolved) {
        updateData.points_earned = problemPoints;
      }
    }
    console.log("📝 Update Data:", JSON.stringify(updateData, null, 2));
    let result;
    if (existingStats) {
      // Try to update and SELECT to verify
      result = await supabaseClient.from("user_problem_stats").update(updateData).eq("user_id", userId).eq("problem_id", problemId).select(); // <-- Critical fix: use .select() to verify update
    } else {
      // Insert only if no existing record
      result = await supabaseClient.from("user_problem_stats").insert({
        user_id: userId,
        problem_id: problemId,
        ...updateData,
        solved: isAccepted,
        points_earned: isAccepted ? problemPoints : 0
      });
    }
    const { data: updateResult, error: updateError } = result;
    if (updateError) {
      console.error("❌ Failed to update user stats:", updateError.message);
    } else if (!updateResult || updateResult.length === 0) {
      console.warn("⚠️ No rows were updated — record may not exist.");
      // Confirm if record really doesn't exist
      const { data: checkAgain, error: checkError } = await supabaseClient.from("user_problem_stats").select("*").eq("user_id", userId).eq("problem_id", problemId).single();
      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Unexpected error checking stats:", checkError.message);
      }
      if (!checkAgain) {
        // Only insert if record truly doesn't exist
        const { error: insertError } = await supabaseClient.from("user_problem_stats").insert({
          user_id: userId,
          problem_id: problemId,
          ...updateData,
          solved: isAccepted,
          points_earned: isAccepted ? problemPoints : 0
        });
        if (insertError) {
          console.error("❌ Failed to insert new stats:", insertError.message);
        } else {
          console.log("📦 Successfully inserted new stats");
        }
      } else {
        console.warn("🟨 Record already exists but wasn't updated.");
      }
    } else {
      console.log("✅ Successfully called .update()");
      // Re-fetch to verify
      const { data: verifyData, error: verifyError } = await supabaseClient.from("user_problem_stats").select("*").eq("user_id", userId).eq("problem_id", problemId).single();
      if (verifyError) {
        console.error("❌ Error verifying update:", verifyError.message);
      } else {
        console.log("🔍 Verified updated stats:", JSON.stringify(verifyData, null, 2));
        console.assert(verifyData.attempts === updateData.attempts, `Attempts mismatch: expected ${updateData.attempts}, got ${verifyData.attempts}`);
        console.assert(verifyData.last_attempted_at === updateData.last_attempted_at, `Last attempted at mismatch: expected ${updateData.last_attempted_at}, got ${verifyData.last_attempted_at}`);
        if (isAccepted) {
          console.assert(verifyData.solved === true, `Expected solved to be true, got ${verifyData.solved}`);
        }
      }
    }
  } catch (error) {
    console.error("💥 Error in updateUserProblemStats:", error);
  }
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  try {
    console.log("🚀 Judge-problem function started");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("🚫 Missing authorization header");
      return new Response(JSON.stringify({
        error: "Missing authorization header"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("🚫 User authentication error:", userError);
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("👤 Authenticated user:", user.id);
    const requestBody = await req.json();
    console.log("📥 Request body:", JSON.stringify(requestBody));
    const { problemId, code, language, challengeId } = requestBody;
    if (!problemId || !code || !language) {
      console.log("🚫 Missing required fields in request");
      return new Response(JSON.stringify({
        error: "Missing required fields"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`🛠 Processing submission for problem ${problemId}, language: ${language}, user: ${user.id}`);
    const { data: problem, error: problemError } = await supabaseClient.from("problems").select("*, starter_code").eq("id", problemId).single();
    if (problemError || !problem) {
      console.log("🚫 Problem not found:", problemError);
      return new Response(JSON.stringify({
        error: "Problem not found"
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("📌 Problem found:", problem.id, problem.title);
    const { data: testCases, error: testCasesError } = await supabaseClient.from("problem_test_cases").select("*").eq("problem_id", problemId).order("order_index", {
      ascending: true
    });
    if (testCasesError) {
      console.log("🚫 Error fetching test cases:", testCasesError);
      return new Response(JSON.stringify({
        error: "Failed to fetch test cases"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`🔢 Found ${testCases.length} test cases`);
    const { data: submission, error: submissionError } = await supabaseClient.from("problem_submissions").insert({
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
      console.log("🚫 Error creating submission:", submissionError);
      return new Response(JSON.stringify({
        error: "Failed to create submission"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    console.log("📦 Submission created:", submission.id);
    const testResults = [];
    let passedCount = 0;
    let totalExecutionTime = 0;
    let maxMemoryUsed = 0;
    let errorMessage = null;
    let status = "accepted";
    for (const testCase of testCases){
      try {
        const languageId = mapLanguageToJudge0Id(language);
        console.log(`🔧 Mapped language ${language} to Judge0 ID: ${languageId}`);
        const preparedCode = prepareCodeForLanguage(code, language, problem.starter_code || "", testCase.input);
        const judge0Request = {
          language_id: languageId,
          source_code: preparedCode,
          stdin: language === "java" ? formatJavaInput(testCase.input) : testCase.input
        };
        console.log(`📡 Sending request to Judge0 API for test case ${testCase.id}`);
        const response = await fetch(JUDGE0_API_URL, {
          method: "POST",
          headers: JUDGE0_HEADERS,
          body: JSON.stringify(judge0Request)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`🚫 Judge0 API error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Judge0 API error: ${response.statusText}`);
        }
        const result = await response.json();
        console.log(`📋 Judge0 API response:`, JSON.stringify(result, null, 2));
        if (result.status?.id === 6) {
          status = "compilation_error";
          errorMessage = result.compile_output;
        } else if ([
          7,
          8,
          9,
          10,
          11,
          12
        ].includes(result.status?.id)) {
          status = "runtime_error";
          errorMessage = result.stderr;
        } else if (result.status?.id === 5) {
          status = "time_limit_exceeded";
          errorMessage = result.stderr;
        } else if (result.status?.id === 4) {
          status = "wrong_answer";
        } else if (result.status?.id === 3) {
          status = "accepted";
        } else {
          status = "runtime_error";
          errorMessage = result.message || "Unknown Judge0 error";
        }
        let actualOutput = (result.stdout || "").trim();
        const expectedOutput = testCase.expected_output.trim();
        if (language === "java") {
          actualOutput = formatJavaOutput(actualOutput, expectedOutput);
        }
        const passed = actualOutput === expectedOutput;
        if (passed) passedCount++;
        else if (status === "accepted") status = "wrong_answer";
        const executionTime = result.time ? result.time * 1000 : 0;
        totalExecutionTime += executionTime;
        const memoryUsed = result.memory || 0;
        maxMemoryUsed = Math.max(maxMemoryUsed, memoryUsed);
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
        console.error("⚠️ Error executing code:", error);
        status = "runtime_error";
        errorMessage = error.message;
        break;
      }
    }
    const avgExecutionTime = testResults.length > 0 ? totalExecutionTime / testResults.length : 0;
    console.log(`🏁 Submission results: status=${status}, passed=${passedCount}/${testCases.length}`);
    await supabaseClient.from("problem_submissions").update({
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      error_message: errorMessage
    }).eq("id", submission.id);
    const submissionResult = {
      status,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length
    };
    await updateUserProblemStats(supabaseClient, submissionResult, user.id, problemId, problem.points);
    return new Response(JSON.stringify({
      submission_id: submission.id,
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / (1024 * 1024),
      error_message: errorMessage,
      test_results: testResults.filter((r)=>r.is_sample)
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("🚫 Error in judge-problem function:", error);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
function mapLanguageToJudge0Id(language) {
  const mapping = {
    javascript: 63,
    typescript: 74,
    python: 71,
    java: 62,
    cpp: 54,
    c: 50,
    csharp: 51,
    ruby: 72,
    go: 60,
    rust: 73,
    php: 68,
    swift: 83,
    kotlin: 78
  };
  return mapping[language.toLowerCase()] || 71; // Default to Python
}
function formatJavaInput(input) {
  try {
    const parsed = JSON.parse(input.replace(/'/g, '"'));
    if (Array.isArray(parsed) && parsed.every((item)=>typeof item === 'string' && item.length === 1)) {
      return parsed.join('');
    }
    return input;
  } catch (e) {
    return input;
  }
}
function formatJavaOutput(output, expectedOutput) {
  try {
    if (expectedOutput.startsWith('[') && expectedOutput.endsWith(']')) {
      const chars = output.trim().split('');
      return JSON.stringify(chars);
    }
    return output;
  } catch (e) {
    return output;
  }
}
function prepareCodeForLanguage(code, language, starterCode, testInput) {
  switch(language){
    case 'javascript':
      return `
// Starter code (if any)
${starterCode}

// User's solution code
${code}

// Test runner
const input = process.stdin.read();
if (input) {
  try {
    const parsedInput = JSON.parse(input.replace(/'/g, '"'));
    
    let result;
    if (Array.isArray(parsedInput)) {
      result = reverseString(parsedInput);
    } else if (typeof parsedInput === 'string') {
      result = reverseString(parsedInput);
    } else if (Array.isArray(parsedInput[0])) {
      const args = parsedInput;
      result = reverseString(...args);
    } else {
      const args = parsedInput;
      result = reverseString(...args);
    }
    
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Error processing input:', error.message);
  }
}
      `;
    case 'python':
      return `
# Starter code (if any)
${starterCode}

# User's solution code
${code}

# Test runner
import sys
import json

input_data = sys.stdin.read().strip()
if input_data:
    try:
        parsed_input = json.loads(input_data.replace("'", '"'))
        
        if isinstance(parsed_input, list):
            if len(parsed_input) == 2 and isinstance(parsed_input[1], (int, str)):
                result = reverseString(*parsed_input)
            else:
                result = reverseString(parsed_input)
        else:
            result = reverseString(parsed_input)
        
        print(json.dumps(result))
    except Exception as e:
        print(f"Error processing input: {str(e)}", file=sys.stderr)
      `;
    case 'java':
      return `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        scanner.close();

        try {
            String inputStr = input.trim();
            char[] s = inputStr.toCharArray();

            Solution solution = new Solution();
            solution.reverseString(s);

            System.out.println(new String(s));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

class Solution {
    ${code}
}`;
    case 'cpp':
      if (!code.includes('int main(')) {
        return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
using namespace std;

${starterCode}

${code}

vector<char> parseInput(string input) {
    vector<char> result;
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    while (getline(ss, item, ',')) {
        item.erase(remove_if(item.begin(), item.end(), [](char c) { return c == '"' || c == ' '; }), item.end());
        if (!item.empty()) {
            result.push_back(item[0]);
        }
    }
    return result;
}

int main() {
    string input;
    getline(cin, input);
    
    vector<char> s = parseInput(input);
    
    Solution solution;
    solution.reverseString(s);
    
    cout << "[";
    for (size_t i = 0; i < s.size(); ++i) {
        cout << "\"" << s[i] << "\"";
        if (i < s.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    
    return 0;
}
        `;
      }
      break;
    case 'csharp':
      if (!code.includes('static void Main')) {
        return `
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

${starterCode}

${code}

class Program {
    static void Main(string[] args) {
        string input = Console.ReadLine();

        try {
            char[] s = JsonSerializer.Deserialize<char[]>(input);

            Solution solution = new Solution();
            solution.ReverseString(s);

            Console.WriteLine(JsonSerializer.Serialize(s));
        }
        catch (Exception e) {
            Console.Error.WriteLine($"Error processing input: {e.Message}");
        }
    }
}

class Solution {
    // This will be replaced by the user's code
}
        `;
      }
      break;
  }
  return code;
}

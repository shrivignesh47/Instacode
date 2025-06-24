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
    console.log("Judge-problem function started");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("Missing authorization header");
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

    console.log("Getting user from auth");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("User authentication error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("Authenticated user:", user.id);

    const requestBody = await req.json();
    console.log("Request body:", JSON.stringify(requestBody));
    
    const { problemId, code, language, challengeId } = requestBody;
    if (!problemId || !code || !language) {
      console.log("Missing required fields in request");
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Processing submission for problem ${problemId}, language: ${language}, user: ${user.id}`);

    console.log("Fetching problem details");
    const { data: problem, error: problemError } = await supabaseClient
      .from("problems").select("*, starter_code").eq("id", problemId).single();
    if (problemError || !problem) {
      console.log("Problem not found:", problemError);
      return new Response(JSON.stringify({ error: "Problem not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("Problem found:", problem.id, problem.title);

    console.log("Fetching test cases");
    const { data: testCases, error: testCasesError } = await supabaseClient
      .from("problem_test_cases").select("*").eq("problem_id", problemId).order("order_index", { ascending: true });
    if (testCasesError) {
      console.log("Error fetching test cases:", testCasesError);
      return new Response(JSON.stringify({ error: "Failed to fetch test cases" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`Found ${testCases.length} test cases for problem ${problemId}`);

    console.log("Creating submission record");
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
      console.log("Error creating submission:", submissionError);
      return new Response(JSON.stringify({ error: "Failed to create submission" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log("Submission created:", submission.id);

    console.log("Updating submission status to running");
    const { error: updateError } = await supabaseClient
      .from("problem_submissions")
      .update({ status: "running" })
      .eq("id", submission.id);
    
    if (updateError) {
      console.log("Error updating submission status:", updateError);
    } else {
      console.log("Submission status updated to running");
    }

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
        const preparedCode = prepareCodeForLanguage(code, language, problem.starter_code || '', testCase.input);
        
        const judge0Request = {
          language_id: languageId,
          source_code: preparedCode,
          stdin: language === 'java' ? formatJavaInput(testCase.input) : testCase.input
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
        let actualOutput = (result.stdout || "").trim();
        const expectedOutput = testCase.expected_output.trim();
        
        // For Java, we need to format the output to match the expected format
        if (language === 'java') {
          actualOutput = formatJavaOutput(actualOutput, expectedOutput);
        }
        
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
    console.log("Final update values:", {
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      error_message: errorMessage
    });

    console.log("Updating submission with final results");
    const { error: finalUpdateError } = await supabaseClient.from("problem_submissions").update({
      status,
      test_cases_passed: passedCount,
      test_cases_total: testCases.length,
      execution_time_ms: avgExecutionTime,
      memory_used_mb: maxMemoryUsed / 1024,
      error_message: errorMessage
    }).eq("id", submission.id);

    if (finalUpdateError) {
      console.error("Error updating submission with final results:", finalUpdateError);
    } else {
      console.log("Submission updated with final results");
    }

    // Update user stats if submission was successful
    if (status === "accepted") {
      console.log("Submission was successful, updating user stats");
      
      // Check if user already has stats for this problem
      console.log("Checking for existing user stats");
      const { data: existingStats, error: statsError } = await supabaseClient
        .from("user_problem_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("problem_id", problemId)
        .maybeSingle();

      if (statsError) {
        console.error("Error checking for existing stats:", statsError);
      } else {
        console.log("Existing stats found:", existingStats);
      }

      if (existingStats) {
        console.log("Updating existing user stats");
        const updateData = {
          attempts: existingStats.attempts + 1,
          solved: true,
          best_execution_time_ms: Math.min(
            existingStats.best_execution_time_ms || Infinity,
            avgExecutionTime
          ),
          best_memory_used_mb: Math.min(
            existingStats.best_memory_used_mb || Infinity,
            maxMemoryUsed / 1024
          ),
          points_earned: problem.points,
          last_attempted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log("Update data:", updateData);
        
        const { error: updateStatsError } = await supabaseClient
          .from("user_problem_stats")
          .update(updateData)
          .eq("user_id", user.id)
          .eq("problem_id", problemId);

        if (updateStatsError) {
          console.error("Error updating user stats:", updateStatsError);
        } else {
          console.log("User stats updated successfully");
        }
      } else {
        console.log("Creating new user stats");
        const newStatsData = {
          user_id: user.id,
          problem_id: problemId,
          attempts: 1,
          solved: true,
          best_execution_time_ms: avgExecutionTime,
          best_memory_used_mb: maxMemoryUsed / 1024,
          points_earned: problem.points,
          last_attempted_at: new Date().toISOString(),
        };
        
        console.log("New stats data:", newStatsData);
        
        const { data: newStats, error: createStatsError } = await supabaseClient
          .from("user_problem_stats")
          .insert(newStatsData)
          .select();

        if (createStatsError) {
          console.error("Error creating user stats:", createStatsError);
        } else {
          console.log("New user stats created:", newStats);
        }
      }
    } else {
      console.log("Submission was not successful, updating attempts count only");
      
      // Update attempts count even if not solved
      const { data: existingStats, error: statsError } = await supabaseClient
        .from("user_problem_stats")
        .select("*")
        .eq("user_id", user.id)
        .eq("problem_id", problemId)
        .maybeSingle();

      if (statsError) {
        console.error("Error checking for existing stats:", statsError);
      }

      if (existingStats) {
        console.log("Updating attempts count in existing stats");
        const updateData = {
          attempts: existingStats.attempts + 1,
          last_attempted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        console.log("Update data for attempts:", updateData);
        
        const { error: updateStatsError } = await supabaseClient
          .from("user_problem_stats")
          .update(updateData)
          .eq("user_id", user.id)
          .eq("problem_id", problemId);

        if (updateStatsError) {
          console.error("Error updating attempts count:", updateStatsError);
        } else {
          console.log("Attempts count updated successfully");
        }
      } else {
        console.log("Creating new user stats with attempts=1, solved=false");
        const newStatsData = {
          user_id: user.id,
          problem_id: problemId,
          attempts: 1,
          solved: false,
          last_attempted_at: new Date().toISOString(),
        };
        
        console.log("New stats data for attempts:", newStatsData);
        
        const { data: newStats, error: createStatsError } = await supabaseClient
          .from("user_problem_stats")
          .insert(newStatsData)
          .select();

        if (createStatsError) {
          console.error("Error creating user stats:", createStatsError);
        } else {
          console.log("New user stats created with attempts=1:", newStats);
        }
      }
    }

    // Return results
    console.log("Returning results to client");
    return new Response(
      JSON.stringify({
        submission_id: submission.id,
        status,
        test_cases_passed: passedCount,
        test_cases_total: testCases.length,
        execution_time_ms: avgExecutionTime,
        memory_used_mb: maxMemoryUsed / 1024,
        error_message: errorMessage,
        test_results: testResults.filter(result => result.is_sample), // Only return sample test results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in judge-problem function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

// Format Java input to handle array of characters
function formatJavaInput(input: string): string {
  try {
    // Try to parse the input as JSON
    const parsed = JSON.parse(input.replace(/'/g, '"'));
    
    // If it's an array of characters, join them into a string
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string' && item.length === 1)) {
      return parsed.join('');
    }
    
    // Otherwise, return the original input
    return input;
  } catch (e) {
    // If parsing fails, return the original input
    return input;
  }
}

// Format Java output to match expected format
function formatJavaOutput(output: string, expectedOutput: string): string {
  try {
    // If the expected output looks like a JSON array
    if (expectedOutput.startsWith('[') && expectedOutput.endsWith(']')) {
      // Convert the output string to an array of characters
      const chars = output.trim().split('');
      return JSON.stringify(chars);
    }
    return output;
  } catch (e) {
    return output;
  }
}

// Prepare code for different languages to ensure proper execution
function prepareCodeForLanguage(code: string, language: string, starterCode: string, testInput: string): string {
  switch (language) {
    case 'javascript':
      // For JavaScript, we need to parse the input and call the function
      return `
// Starter code (if any)
${starterCode}

// User's solution code
${code}

// Test runner
const input = process.stdin.read();
if (input) {
  try {
    // Parse the input string to JavaScript objects
    const parsedInput = JSON.parse(input.replace(/'/g, '"'));
    
    // Handle different input formats
    let result;
    if (Array.isArray(parsedInput)) {
      // If input is a single array
      result = reverseString(parsedInput);
    } else if (typeof parsedInput === 'string') {
      // If input is a string
      result = reverseString(parsedInput);
    } else if (Array.isArray(parsedInput[0])) {
      // If input is an array of arrays
      const args = parsedInput;
      result = reverseString(...args);
    } else {
      // If input is an array of arguments
      const args = parsedInput;
      result = reverseString(...args);
    }
    
    // Output the result as a JSON string
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error('Error processing input:', error.message);
  }
}
      `;
    
    case 'python':
      // For Python, we need to parse the input and call the function
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
        # Parse the input string to Python objects
        parsed_input = json.loads(input_data.replace("'", '"'))
        
        # Handle different input formats
        if isinstance(parsed_input, list):
            if len(parsed_input) == 2 and isinstance(parsed_input[1], (int, str)):
                # If input is [array, target]
                result = reverseString(*parsed_input)
            else:
                # If input is a single array
                result = reverseString(parsed_input)
        else:
            # If input is a single value
            result = reverseString(parsed_input)
        
        # Output the result as a JSON string
        print(json.dumps(result))
    except Exception as e:
        print(f"Error processing input: {str(e)}", file=sys.stderr)
      `;
    
    case 'java':
      // For Java, create a complete program with the Solution class
      return `
import java.util.*;

// Main class to handle input/output
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        scanner.close();
        
        try {
            // Parse input string to get character array
            String inputStr = input.trim();
            char[] s = inputStr.toCharArray();
            
            // Create solution instance and call reverseString
            Solution solution = new Solution();
            solution.reverseString(s);
            
            // Print the reversed string
            System.out.println(new String(s));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

// User's solution class
class Solution {
    ${code}
}`;
    
    case 'cpp':
      // If code doesn't have a main function, add one
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

// Parse input string to vector
vector<char> parseInput(string input) {
    vector<char> result;
    // Remove brackets and quotes
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    while (getline(ss, item, ',')) {
        // Remove quotes and whitespace
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
    
    // Call the solution function
    Solution solution;
    solution.reverseString(s);
    
    // Output the result
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
      // If code doesn't have a Main method, add one
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
            // Parse input as character array
            char[] s = JsonSerializer.Deserialize<char[]>(input);
            
            // Create a new instance and call the method
            Solution solution = new Solution();
            solution.ReverseString(s);
            
            // Output the result
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
  
  return code; // Return original code for other languages
}
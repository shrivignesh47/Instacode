import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

// Define the problem structure
export interface ProblemTemplate {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
  starter_code?: string;
  solution_code?: string;
  test_cases?: {
    input: string;
    expected_output: string;
    is_sample: boolean;
  }[];
  time_limit_ms?: number;
  memory_limit_mb?: number;
  points?: number;
}

// Generate an Excel template for problem uploads
export const generateExcelTemplate = (): Blob => {
  // Create a workbook
  const wb = XLSX.utils.book_new();
  
  // Sample data for the template
  const sampleData = [
    {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'easy',
      category: 'Arrays',
      tags: 'arrays,hash-table',
      starter_code: 'function twoSum(nums, target) {\n  // Your code here\n}',
      solution_code: 'function twoSum(nums, target) {\n  const map = {};\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map[complement] !== undefined) {\n      return [map[complement], i];\n    }\n    map[nums[i]] = i;\n  }\n  return [];\n}',
      test_case_1_input: '[2,7,11,15], 9',
      test_case_1_output: '[0,1]',
      test_case_1_is_sample: 'true',
      test_case_2_input: '[3,2,4], 6',
      test_case_2_output: '[1,2]',
      test_case_2_is_sample: 'true',
      time_limit_ms: '1000',
      memory_limit_mb: '128',
      points: '100'
    },
    {
      title: 'Reverse String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters s.',
      difficulty: 'easy',
      category: 'Strings',
      tags: 'strings,two-pointers',
      starter_code: 'function reverseString(s) {\n  // Your code here\n}',
      solution_code: 'function reverseString(s) {\n  let left = 0;\n  let right = s.length - 1;\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left++;\n    right--;\n  }\n  return s;\n}',
      test_case_1_input: '["h","e","l","l","o"]',
      test_case_1_output: '["o","l","l","e","h"]',
      test_case_1_is_sample: 'true',
      time_limit_ms: '1000',
      memory_limit_mb: '128',
      points: '100'
    }
  ];
  
  // Create a worksheet
  const ws = XLSX.utils.json_to_sheet(sampleData);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Problems');
  
  // Generate a binary string from the workbook
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to ArrayBuffer
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  // Create a Blob from the ArrayBuffer
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

// Parse Excel file to extract problems
export const parseExcelFile = async (file: File): Promise<ProblemTemplate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process the data into problem templates
        const problems: ProblemTemplate[] = jsonData.map((row: any) => {
          // Extract test cases
          const testCases = [];
          let i = 1;
          while (row[`test_case_${i}_input`] !== undefined) {
            testCases.push({
              input: row[`test_case_${i}_input`],
              expected_output: row[`test_case_${i}_output`],
              is_sample: row[`test_case_${i}_is_sample`] === 'true'
            });
            i++;
          }
          
          return {
            title: row.title,
            description: row.description,
            difficulty: row.difficulty,
            category: row.category,
            tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : [],
            starter_code: row.starter_code,
            solution_code: row.solution_code,
            test_cases: testCases,
            time_limit_ms: parseInt(row.time_limit_ms) || 1000,
            memory_limit_mb: parseInt(row.memory_limit_mb) || 128,
            points: parseInt(row.points) || 100
          };
        });
        
        resolve(problems);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

// Upload problems to the database
export const uploadProblems = async (problems: ProblemTemplate[], userId: string): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    // Create import record
    const { data: importData, error: importError } = await supabase
      .from('problem_imports')
      .insert({
        user_id: userId,
        file_name: 'Excel Import',
        file_size: JSON.stringify(problems).length,
        status: 'processing'
      })
      .select()
      .single();

    if (importError) {
      throw importError;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each problem
    for (const problem of problems) {
      try {
        // Insert problem
        const { data: problemData, error: problemError } = await supabase
          .from('problems')
          .insert({
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            category: problem.category,
            tags: problem.tags,
            starter_code: problem.starter_code,
            solution_code: problem.solution_code,
            time_limit_ms: problem.time_limit_ms,
            memory_limit_mb: problem.memory_limit_mb,
            points: problem.points,
            created_by: userId
          })
          .select()
          .single();

        if (problemError) {
          throw problemError;
        }

        // Insert test cases
        if (problem.test_cases && problem.test_cases.length > 0) {
          const testCasesData = problem.test_cases.map((tc, index) => ({
            problem_id: problemData.id,
            input: tc.input,
            expected_output: tc.expected_output,
            is_sample: tc.is_sample,
            order_index: index
          }));

          const { error: testCasesError } = await supabase
            .from('problem_test_cases')
            .insert(testCasesData);

          if (testCasesError) {
            throw testCasesError;
          }
        }

        successCount++;
      } catch (error) {
        console.error('Error uploading problem:', error);
        errorCount++;
      }
    }

    // Update import record
    await supabase
      .from('problem_imports')
      .update({
        status: 'completed',
        problems_count: successCount,
        error_message: errorCount > 0 ? `${errorCount} problems failed to import` : null
      })
      .eq('id', importData.id);

    return { success: true, count: successCount };
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
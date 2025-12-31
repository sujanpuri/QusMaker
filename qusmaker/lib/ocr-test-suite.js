/**
 * Test Suite for OCR Post-Processing
 * 
 * Run this file to validate the OCR post-processing functionality
 * Usage: node lib/ocr-test-suite.js
 */

import { processOCRText, getExtractionSummary } from './ocr-service.js';

// Test data
const TEST_CASES = [
  {
    name: "Simple Exam (No Groups)",
    input: `
Mathematics Test
Q1. What is 2 + 2? (2 marks)
Q2. Calculate the square root of 64. (3 marks)
Q3. Solve: 3x + 7 = 22 (5 marks)
    `,
    expectedQuestions: 3,
    expectedGroups: 1,
    expectedTypes: ['short_question', 'short_question', 'short_question']
  },
  
  {
    name: "MCQ Questions",
    input: `
Q1. What is the capital of France?
(a) London
(b) Paris
(c) Berlin
(d) Madrid

Q2. Which planet is largest?
(a) Earth
(b) Mars
(c) Jupiter
(d) Saturn
    `,
    expectedQuestions: 2,
    expectedGroups: 1,
    expectedTypes: ['mcq', 'mcq']
  },
  
  {
    name: "Grouped Exam",
    input: `
Science Exam

Group A - MCQs

Q1. Water chemical formula?
(a) H2O
(b) CO2
(c) O2
(d) N2

Q2. Boiling point of water?
(a) 50°C
(b) 100°C
(c) 150°C
(d) 200°C

Group B - Short Answer

Q1. Define photosynthesis. (3 marks)
Q2. Explain gravity. (3 marks)

Section C - Long Answer

Q1. Describe the water cycle in detail. (10 marks)
    `,
    expectedQuestions: 5,
    expectedGroups: 3,
    expectedTypes: ['mcq', 'mcq', 'short_question', 'short_question', 'long_question']
  },
  
  {
    name: "Questions with Sub-Questions",
    input: `
Q1. Answer the following: (10 marks)
(a) What is the atomic number of Carbon?
(b) Name three noble gases.
(c) Define isotopes.

Q2. Read the passage and answer:
(a) What is the main theme?
(b) Identify two literary devices.
(c) Explain the conclusion.
    `,
    expectedQuestions: 2,
    expectedGroups: 1,
    expectedTypes: ['question_with_subquestions', 'question_with_subquestions']
  },
  
  {
    name: "Mixed Question Types",
    input: `
Final Exam

Q1. Who discovered gravity? (2 marks)

Q2. Which is correct?
(a) E=mc²
(b) F=ma
(c) Both
(d) Neither

Q3. Explain relativity theory in detail. Discuss its implications on modern physics. (15 marks)

Q4. Solve the following: (8 marks)
(a) 5x - 3 = 12
(b) 2x² + 3x - 5 = 0
(c) log₂(16) = ?
    `,
    expectedQuestions: 4,
    expectedGroups: 1,
    expectedTypes: ['short_question', 'mcq', 'long_question', 'question_with_subquestions']
  },
  
  {
    name: "Metadata Filtering",
    input: `
XYZ School
Mathematics Final Exam
Class: 10th Grade
Date: 15/01/2024
Time: 2 hours
Total Marks: 50
Subject: Mathematics

Instructions:
- Answer all questions
- Use blue or black pen
- No calculators allowed

Page 1 of 2

Q1. What is the value of π? (2 marks)
Q2. Calculate area of circle with radius 5cm. (3 marks)

© 2024 XYZ School
All rights reserved
    `,
    expectedQuestions: 2,
    expectedGroups: 1,
    expectedTypes: ['short_question', 'short_question']
  },
  
  {
    name: "Multiple Groups with Reset Numbering",
    input: `
Section A

Q1. First question in Section A
Q2. Second question in Section A
Q3. Third question in Section A

Section B

Q1. First question in Section B (numbering reset)
Q2. Second question in Section B
    `,
    expectedQuestions: 5,
    expectedGroups: 2,
    expectedTypes: ['short_question', 'short_question', 'short_question', 'short_question', 'short_question']
  },
  
  {
    name: "Empty/Invalid Input",
    input: ``,
    expectedQuestions: 0,
    expectedGroups: 0,
    expectedTypes: []
  }
];

// Test runner
function runTests() {
  console.log("=".repeat(80));
  console.log("🧪 OCR POST-PROCESSING TEST SUITE");
  console.log("=".repeat(80));
  console.log();
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];
  
  TEST_CASES.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log("-".repeat(80));
    
    try {
      // Run processing
      const result = processOCRText(testCase.input);
      
      // Validate results
      const tests = [
        {
          name: "Success flag",
          expected: testCase.expectedQuestions > 0,
          actual: result.success
        },
        {
          name: "Question count",
          expected: testCase.expectedQuestions,
          actual: result.totalQuestions
        },
        {
          name: "Group count",
          expected: testCase.expectedGroups,
          actual: result.groups.length
        }
      ];
      
      // Validate question types
      if (result.success && result.totalQuestions > 0) {
        const actualTypes = [];
        result.groups.forEach(group => {
          group.questions.forEach(q => {
            actualTypes.push(q.questionType);
          });
        });
        
        tests.push({
          name: "Question types",
          expected: testCase.expectedTypes.join(', '),
          actual: actualTypes.join(', ')
        });
      }
      
      // Check all tests
      let allPassed = true;
      tests.forEach(test => {
        const testPassed = test.expected === test.actual;
        const status = testPassed ? "✅" : "❌";
        console.log(`  ${status} ${test.name}: Expected ${test.expected}, Got ${test.actual}`);
        if (!testPassed) allPassed = false;
      });
      
      if (allPassed) {
        console.log(`\n  ✅ TEST PASSED`);
        passed++;
        
        // Show summary
        if (result.success) {
          console.log("\n  📊 Extraction Summary:");
          const summary = getExtractionSummary(result);
          summary.split('\n').forEach(line => {
            if (line.trim()) console.log(`    ${line}`);
          });
        }
      } else {
        console.log(`\n  ❌ TEST FAILED`);
        failed++;
        failedTests.push(testCase.name);
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      console.log(`\n  ❌ TEST FAILED`);
      failed++;
      failedTests.push(testCase.name);
    }
  });
  
  // Final report
  console.log("\n" + "=".repeat(80));
  console.log("TEST RESULTS");
  console.log("=".repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / TEST_CASES.length) * 100)}%`);
  
  if (failedTests.length > 0) {
    console.log("\nFailed Tests:");
    failedTests.forEach(name => console.log(`  - ${name}`));
  }
  
  console.log("\n" + "=".repeat(80));
  
  return { passed, failed, total: TEST_CASES.length };
}

// Detailed output test - shows full extraction for one example
function runDetailedExample() {
  console.log("\n\n" + "=".repeat(80));
  console.log("🔍 DETAILED EXAMPLE OUTPUT");
  console.log("=".repeat(80));
  
  const exampleInput = `
Physics Final Exam - Class 12

Group A - Multiple Choice Questions (1 mark each)

Q1. What is the speed of light?
(a) 3 × 10⁸ m/s
(b) 3 × 10⁶ m/s
(c) 3 × 10⁴ m/s
(d) 3 × 10² m/s

Q2. Which is a scalar quantity?
(a) Velocity
(b) Force
(c) Energy
(d) Acceleration

Group B - Short Answer Questions (3 marks each)

Q1. Define Newton's Second Law of Motion.

Q2. What is the difference between AC and DC current?

Group C - Long Answer Questions (10 marks each)

Q1. Explain the theory of relativity proposed by Einstein. Discuss its implications on our understanding of space and time.

Q2. Answer the following related to quantum mechanics: (10 marks)
(a) What is wave-particle duality?
(b) Explain Heisenberg's Uncertainty Principle.
(c) Describe the concept of quantum entanglement.
  `;
  
  console.log("\nINPUT TEXT:");
  console.log("-".repeat(80));
  console.log(exampleInput);
  
  console.log("\n\nPROCESSING...");
  console.log("-".repeat(80));
  
  const result = processOCRText(exampleInput);
  
  console.log("\n\nEXTRACTION SUMMARY:");
  console.log("-".repeat(80));
  console.log(getExtractionSummary(result));
  
  console.log("\n\nFULL STRUCTURED OUTPUT:");
  console.log("-".repeat(80));
  console.log(JSON.stringify(result, null, 2));
  
  console.log("\n" + "=".repeat(80));
}

// Performance test
function runPerformanceTest() {
  console.log("\n\n" + "=".repeat(80));
  console.log("⚡ PERFORMANCE TEST");
  console.log("=".repeat(80));
  
  const largeInput = Array(100).fill(null).map((_, i) => 
    `Q${i + 1}. Sample question ${i + 1} with some text. (5 marks)`
  ).join('\n\n');
  
  console.log(`\nProcessing ${100} questions...`);
  
  const startTime = performance.now();
  const result = processOCRText(largeInput);
  const endTime = performance.now();
  
  const duration = endTime - startTime;
  
  console.log(`\n✅ Processed ${result.totalQuestions} questions in ${duration.toFixed(2)}ms`);
  console.log(`⚡ Average: ${(duration / result.totalQuestions).toFixed(2)}ms per question`);
  console.log(`📊 Throughput: ${Math.round((result.totalQuestions / duration) * 1000)} questions/second`);
  
  console.log("\n" + "=".repeat(80));
}

// Run all tests
export function runAllTests() {
  const testResults = runTests();
  runDetailedExample();
  runPerformanceTest();
  
  return testResults;
}

// Export for external use
export { runTests, runDetailedExample, runPerformanceTest };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

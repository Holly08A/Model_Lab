import type { BatchTestCase, DeterministicCheckResult } from "@/types";

function buildLabel(defaultLabel: string, customLabel?: string) {
  return customLabel?.trim() || defaultLabel;
}

export function runDeterministicChecks(testCase: BatchTestCase, responseText: string): DeterministicCheckResult[] {
  return testCase.checks.map((check) => {
    switch (check.type) {
      case "keyword_contains": {
        const passed = responseText.toLowerCase().includes(check.value.toLowerCase());
        return {
          type: check.type,
          label: buildLabel(`Contains "${check.value}"`, check.label),
          passed,
          message: passed ? "Required keyword found." : "Required keyword missing.",
        };
      }
      case "keyword_absent": {
        const passed = !responseText.toLowerCase().includes(check.value.toLowerCase());
        return {
          type: check.type,
          label: buildLabel(`Excludes "${check.value}"`, check.label),
          passed,
          message: passed ? "Forbidden keyword absent." : "Forbidden keyword detected.",
        };
      }
      case "regex_match": {
        const regex = new RegExp(check.value, check.flags);
        const passed = regex.test(responseText);
        return {
          type: check.type,
          label: buildLabel(`Matches /${check.value}/${check.flags ?? ""}`, check.label),
          passed,
          message: passed ? "Regex matched." : "Regex did not match.",
        };
      }
      case "max_length": {
        const passed = responseText.length <= check.value;
        return {
          type: check.type,
          label: buildLabel(`Max ${check.value} characters`, check.label),
          passed,
          message: passed ? "Response stayed within the length limit." : "Response exceeded the length limit.",
        };
      }
      case "json_parse": {
        try {
          JSON.parse(responseText);
          return {
            type: check.type,
            label: buildLabel("Valid JSON", check.label),
            passed: true,
            message: "Response parsed as valid JSON.",
          };
        } catch {
          return {
            type: check.type,
            label: buildLabel("Valid JSON", check.label),
            passed: false,
            message: "Response did not parse as valid JSON.",
          };
        }
      }
    }
  });
}

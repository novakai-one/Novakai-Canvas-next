/** Derived sequence-diagram ids (grammar §5). Pure string formatting; never validates the scenario. */

export function callId(scenario: string, n: number): string {
  return `${scenario}-call-${n}`;
}

export function callReturnId(scenario: string, n: number): string {
  return `${scenario}-call-${n}-return`;
}

export function returnId(scenario: string, k: number): string {
  return `${scenario}-return-${k}`;
}

export function fragmentId(scenario: string, n: number): string {
  return `${scenario}-fragment-${n}`;
}

export function branchId(scenario: string, n: number, m: number): string {
  return `${scenario}-fragment-${n}-branch-${m}`;
}

/**
 * Age group parsing and matching utilities.
 *
 * Strategy: fail-open. If we can't parse an age_group string, we treat it as
 * matching all ages so we never accidentally hide a relevant season.
 */

interface AgeRange {
  minAge: number;
  maxAge: number;
}

const GRADE_TO_AGE: Record<string, number> = {
  pk3: 3,
  "pre-k3": 3,
  prek3: 3,
  pk4: 4,
  "pre-k4": 4,
  prek4: 4,
  pk: 4,
  "pre-k": 4,
  prek: 4,
  k: 5,
  kindergarten: 5,
  "1st": 6,
  "2nd": 7,
  "3rd": 8,
  "4th": 9,
  "5th": 10,
  "6th": 11,
  "7th": 12,
  "8th": 13,
  "9th": 14,
  "10th": 15,
  "11th": 16,
  "12th": 17,
  "high school": 17,
};

function gradeToAge(grade: string): number | null {
  const normalized = grade.trim().toLowerCase();
  return GRADE_TO_AGE[normalized] ?? null;
}

/**
 * Parse a free-text age_group string into a min/max age range.
 * Returns null if unparseable (caller should treat as "matches all").
 */
export function parseAgeGroup(ageGroup: string | null): AgeRange | null {
  if (!ageGroup) return null;

  const s = ageGroup.trim();
  if (!s) return null;

  // "14U" or "14 and under"
  const underMatch = s.match(/^(\d+)\s*U$/i) || s.match(/^(\d+)\s+and\s+under$/i);
  if (underMatch) {
    const max = parseInt(underMatch[1]);
    return { minAge: 0, maxAge: max };
  }

  // Numeric range: "5-12", "5 - 12"
  const numericRange = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (numericRange) {
    return { minAge: parseInt(numericRange[1]), maxAge: parseInt(numericRange[2]) };
  }

  // Single number: "7"
  const singleNum = s.match(/^(\d+)$/);
  if (singleNum) {
    const age = parseInt(singleNum[1]);
    return { minAge: age, maxAge: age };
  }

  // Grade-based ranges: "1st-6th Grade", "PK3-6th Grade", "2nd grade through high school"
  // Try to extract two grade tokens separated by - or "through" or "to"
  const gradeRange = s.match(/^(.+?)(?:\s*[-–]\s*|\s+through\s+|\s+to\s+)(.+?)(?:\s+grade)?$/i);
  if (gradeRange) {
    const left = gradeRange[1].replace(/\s*grade\s*/i, "").trim();
    const right = gradeRange[2].replace(/\s*grade\s*/i, "").trim();
    const minAge = gradeToAge(left);
    const maxAge = gradeToAge(right);
    if (minAge !== null && maxAge !== null) {
      return { minAge, maxAge };
    }
  }

  // Single grade: "6th Grade"
  const singleGrade = s.match(/^(.+?)\s*grade$/i);
  if (singleGrade) {
    const age = gradeToAge(singleGrade[1]);
    if (age !== null) return { minAge: age, maxAge: age };
  }

  // Unparseable — fail open
  return null;
}

/**
 * Calculate age in whole years from an ISO date string (YYYY-MM-DD).
 */
export function calculateAge(birthdate: string): number {
  const today = new Date();
  const birth = new Date(birthdate + "T00:00:00");
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if a season's age group matches any of the given child ages.
 * Fail-open: returns true if ageGroup is null, empty, or unparseable.
 * Also returns true if childAges is empty (no filtering).
 */
export function seasonMatchesAges(ageGroup: string | null, childAges: number[]): boolean {
  if (childAges.length === 0) return true;

  const range = parseAgeGroup(ageGroup);
  if (!range) return true; // fail-open

  return childAges.some((age) => age >= range.minAge && age <= range.maxAge);
}

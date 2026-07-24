// Standard 10-point grading scale or generic percentage based scale
// In a real application, this might be configurable per school or board

export interface GradeResult {
  grade: string;
  percentage: number;
}

export function calculateGrade(obtainedMarks: number, maxMarks: number): GradeResult {
  if (maxMarks <= 0) return { grade: "NOT_GRADED", percentage: 0 };
  
  const percentage = (obtainedMarks / maxMarks) * 100;
  
  let grade = "F";
  
  if (percentage >= 90) {
    grade = "A+";
  } else if (percentage >= 80) {
    grade = "A";
  } else if (percentage >= 70) {
    grade = "B+";
  } else if (percentage >= 60) {
    grade = "B";
  } else if (percentage >= 50) {
    grade = "C";
  } else if (percentage >= 40) {
    grade = "D";
  } else if (percentage >= 33) {
    grade = "E";
  }
  
  return {
    grade,
    percentage: Math.round(percentage * 100) / 100 // round to 2 decimal places
  };
}

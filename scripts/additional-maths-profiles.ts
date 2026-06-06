import { makeBoundaries, range, type ExamIngestionProfile } from "./exam-ingestion-core";

export const additionalMathsProfiles: ExamIngestionProfile[] = [
  {
    id: "std1-2025",
    paperId: "std1-2025",
    sourcePackId: "source-std-2025",
    courseId: "standard",
    courseName: "Mathematics Standard 1",
    year: 2025,
    sourceRef: "2025 HSC Mathematics Standard 1 marking feedback",
    examTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-exam-paper-2025-hsc-maths-standard-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-guide-2025-hsc-maths-standard-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-feedback-2025-hsc-maths-std-1-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2025",
    expectedQuestionCount: 28,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [53, 69, 101, 131, 170, 279, 314, 340, 388, 425],
      range(11, 28),
      [519, 567, 613, 679, 820, 966, 1014, 1062, 1123, 1205, 1348, 1391, 1479, 1536, 1593, 1644, 1688, 1749],
      1803
    )
  },
  {
    id: "std2-2025",
    paperId: "std2-2025",
    sourcePackId: "source-std-2025",
    courseId: "standard",
    courseName: "Mathematics Standard 2",
    year: 2025,
    sourceRef: "2025 HSC Mathematics Standard 2 marking feedback",
    examTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-exam-paper-2025-hsc-maths-standard-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-guide-2025-hsc-maths-standard-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2025/source-std-2025-marking-feedback-2025-hsc-maths-std-2-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2025",
    expectedQuestionCount: 40,
    sectionIQuestionCount: 15,
    boundaries: makeBoundaries(
      15,
      [53, 81, 118, 153, 178, 274, 353, 375, 423, 441, 529, 548, 574, 600, 653],
      range(16, 40),
      [
        748, 793, 884, 972, 1070, 1180, 1236, 1381, 1441, 1485, 1626, 1738, 1781, 1854, 1873, 1931, 2002,
        2067, 2125, 2246, 2327, 2388, 2445, 2500, 2602
      ],
      2662
    )
  },
  {
    id: "ext1-2025",
    paperId: "ext1-2025",
    sourcePackId: "source-ext1-2025",
    courseId: "extension-1",
    courseName: "Mathematics Extension 1",
    year: 2025,
    sourceRef: "2025 HSC Mathematics Extension 1 marking feedback",
    examTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-exam-paper-2025-hsc-maths-extension-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-marking-guide-2025-hsc-maths-extension-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext1-2025/source-ext1-2025-marking-feedback-2025-hsc-maths-ext-1-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-1/2025",
    expectedQuestionCount: 14,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [53, 127, 263, 388, 533, 572, 658, 734, 837, 920],
      range(11, 14),
      [1018, 1233, 1478, 1769],
      2080,
      1009
    )
  },
  {
    id: "ext2-2025",
    paperId: "ext2-2025",
    sourcePackId: "source-ext2-2025",
    courseId: "extension-2",
    courseName: "Mathematics Extension 2",
    year: 2025,
    sourceRef: "2025 HSC Mathematics Extension 2 marking feedback",
    examTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-exam-paper-2025-hsc-maths-extension-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-marking-guide-2025-hsc-maths-extension-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext2-2025/source-ext2-2025-marking-feedback-2025-hsc-maths-ext-2-marking-feedback-section-ii.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-2/2025",
    expectedQuestionCount: 16,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [70, 170, 247, 331, 377, 496, 548, 729, 774, 869],
      range(11, 16),
      [1009, 1303, 1599, 1846, 2218, 2472],
      2875,
      999
    ),
    questionOverrides: {
      10: {
        promptLatex: [
          "10 Which of the following gives the same curve as \\(\\begin{pmatrix}\\cos(t)\\\\-t\\\\\\sin(t)\\end{pmatrix}\\) for \\(t \\in \\mathbb{R}\\)?",
          "A. \\(\\begin{pmatrix}\\cos(2t)\\\\2t\\\\\\sin(2t)\\end{pmatrix}\\)",
          "B. \\(\\begin{pmatrix}\\cos\\left(t^2+\\frac{\\pi}{2}\\right)\\\\t^2+\\frac{\\pi}{2}\\\\\\sin\\left(t^2+\\frac{\\pi}{2}\\right)\\end{pmatrix}\\)",
          "C. \\(\\begin{pmatrix}\\cos(t^2)\\\\-t^2\\\\\\sin(t^2)\\end{pmatrix}\\)",
          "D. \\(\\begin{pmatrix}\\cos\\left(2t+\\frac{\\pi}{2}\\right)\\\\2t+\\frac{\\pi}{2}\\\\-\\sin\\left(2t+\\frac{\\pi}{2}\\right)\\end{pmatrix}\\)"
        ].join("\n")
      }
    }
  },
  {
    id: "ext1-2024",
    paperId: "ext1-2024",
    sourcePackId: "source-ext1-2024",
    courseId: "extension-1",
    courseName: "Mathematics Extension 1",
    year: 2024,
    sourceRef: "2024 HSC Mathematics Extension 1 marking feedback",
    examTextPath: "var/extracted-text/source-ext1-2024/source-ext1-2024-exam-paper-2024-hsc-maths-ext-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext1-2024/source-ext1-2024-marking-guide-2024-hsc-maths-ext-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext1-2024/source-ext1-2024-marking-feedback-2024-hsc-mathematics-ext1-marking-feedback.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-1/2024",
    expectedQuestionCount: 14,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [53, 106, 411, 429, 526, 602, 660, 683, 749, 896],
      range(11, 14),
      [1073, 1385, 1569, 1871],
      2124,
      1063
    )
  },
  {
    id: "ext2-2024",
    paperId: "ext2-2024",
    sourcePackId: "source-ext2-2024",
    courseId: "extension-2",
    courseName: "Mathematics Extension 2",
    year: 2024,
    sourceRef: "2024 HSC Mathematics Extension 2 marking feedback",
    examTextPath: "var/extracted-text/source-ext2-2024/source-ext2-2024-exam-paper-2024-hsc-maths-ext-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-ext2-2024/source-ext2-2024-marking-guide-2024-hsc-maths-ext-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-ext2-2024/source-ext2-2024-marking-feedback-2024-hsc-mathematics-ext2-marking-feedback.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-extension-2/2024",
    expectedQuestionCount: 16,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [53, 132, 274, 292, 426, 473, 512, 566, 623, 653],
      range(11, 16),
      [736, 937, 1219, 1535, 1979, 2364],
      2705,
      726
    )
  }
];

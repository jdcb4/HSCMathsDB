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
    id: "std1-2024",
    paperId: "std1-2024",
    sourcePackId: "source-std-2024",
    courseId: "standard",
    courseName: "Mathematics Standard 1",
    year: 2024,
    sourceRef: "2024 HSC Mathematics Standard 1 marking feedback",
    examTextPath: "var/extracted-text/source-std-2024/source-std-2024-exam-paper-2024-hsc-maths-std-1.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2024/source-std-2024-marking-guide-2024-hsc-maths-std-1-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2024/source-std-2024-marking-feedback-2024-hsc-mathematics-std1-marking-feedback.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2024",
    expectedQuestionCount: 32,
    sectionIQuestionCount: 10,
    boundaries: makeBoundaries(
      10,
      [53, 70, 113, 151, 171, 188, 218, 247, 268, 300],
      range(11, 32),
      [
        425, 465, 525, 572, 635, 739, 774, 847, 891, 947, 1039, 1072, 1158, 1309, 1388, 1435, 1473, 1513,
        1559, 1629, 1709, 1751
      ],
      1816,
      343
    ),
    questionOverrides: {
      6: {
        promptLatex: [
          "6 The map shows regions within a country.",
          "A network diagram is to be drawn to represent this map. Vertices will be used to indicate each region and edges will be used to represent a border shared between two regions.",
          "How many edges will there be in the network diagram?",
          "A. 8",
          "B. 7",
          "C. 6",
          "D. 5"
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q06-region-map",
            type: "diagram",
            label: "Country region map",
            alt: "Map with six regions labelled Forest, Swamp, Mountains, Desert, Coast, and Woods, with shared borders between regions.",
            path: "/assets/diagrams/std1-2024-q06-region-map.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      7: {
        promptLatex: [
          "7 Consider the diagram shown.",
          "Which of the following is the correct expression for the length of \\(x\\)?",
          "A. \\(20\\cos40^\\circ\\)",
          "B. \\(20\\sin40^\\circ\\)",
          "C. \\(\\frac{20}{\\cos40^\\circ}\\)",
          "D. \\(\\frac{20}{\\sin40^\\circ}\\)"
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q07-right-triangle",
            type: "diagram",
            label: "Right triangle with side x",
            alt: "Right triangle with hypotenuse 20, a 40 degree angle at the base, and side x opposite the right angle.",
            path: "/assets/diagrams/std1-2024-q07-right-triangle.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      12: {
        promptLatex:
          "Question 12\n(2 marks) The scatterplot shows a bivariate dataset. Describe the bivariate dataset in terms of strength and direction.",
        assets: [
          {
            id: "std1-2024-q12-scatterplot",
            type: "graph",
            label: "Bivariate scatterplot",
            alt: "Scatterplot with a strong negative association between the two variables.",
            path: "/assets/diagrams/std1-2024-q12-scatterplot.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      14: {
        promptLatex: [
          "Question 14\n(4 marks) A hotel is located 186 m north and 50 m west of a train station.",
          "(a) What is the straight line distance from the hotel to the train station? Round your answer to the nearest metre.",
          "(b) What is the bearing of the hotel from the train station? Round your answer to the nearest degree."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) By Pythagoras' theorem, \\(x^2=186^2+50^2\\), so \\(x=192.603\\ldots\\approx193\\) m.",
          "(b) \\(\\tan\\theta=\\frac{50}{186}\\), so \\(\\theta\\approx15^\\circ03'\\). The bearing is \\(360^\\circ-15^\\circ03'=344^\\circ57'\\approx345^\\circ\\)."
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q14-hotel-bearing-diagram",
            type: "diagram",
            label: "Hotel and train station bearing diagram",
            alt: "Right-angled diagram showing a hotel 186 metres north and 50 metres west of a train station.",
            path: "/assets/diagrams/std1-2024-q14-hotel-bearing-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      15: {
        promptLatex: [
          "Question 15\n(4 marks) A network of towns and the distances between them in kilometres is shown.",
          "(a) What is the shortest path from \\(T\\) to \\(H\\)?",
          "(b) A truck driver needs to travel from \\(Y\\) to \\(G\\) but knows that the road from \\(C\\) to \\(G\\) is closed. What is the length of the shortest path the truck driver can take from \\(Y\\) to \\(G\\) after the road closure?"
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q15-town-network",
            type: "diagram",
            label: "Town network with distances",
            alt: "Weighted network of towns J, T, Y, W, C, G, M, and H with distances labelled on each road.",
            path: "/assets/diagrams/std1-2024-q15-town-network.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      18: {
        promptLatex:
          "Question 18\n(3 marks) A garden is made up of a right-angled triangle and a semicircle as shown. What is the area of the garden, correct to the nearest square metre?",
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "The triangle has base \\(6\\) m and height \\(7\\) m, so \\(A_{\\text{triangle}}=\\frac12\\times7\\times6=21\\).",
          "The semicircle has radius \\(3\\) m, so \\(A_{\\text{semicircle}}=\\frac12\\pi(3)^2=14.137\\ldots\\).",
          "The total area is \\(35.137\\ldots\\), so the area is \\(35\\text{ m}^2\\), correct to the nearest square metre."
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q18-garden-area-diagram",
            type: "diagram",
            label: "Garden triangle and semicircle",
            alt: "Composite garden shape made from a right-angled triangle and a semicircle, with dimensions 7 metres and 3 metres shown.",
            path: "/assets/diagrams/std1-2024-q18-garden-area-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      20: {
        promptLatex: [
          "Question 20\n(3 marks) The diagram shows a network with weighted edges.",
          "(a) Draw a minimum spanning tree for this network and determine its weight.",
          "(b) Is it possible to find another spanning tree with the same weight? Give a reason for your answer."
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q20-weighted-network",
            type: "diagram",
            label: "Weighted network",
            alt: "Weighted network with vertices A to J and edges labelled with weights used for a minimum spanning tree question.",
            path: "/assets/diagrams/std1-2024-q20-weighted-network.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      23: {
        promptLatex: [
          "Question 23\n(7 marks) Carrie is organising a fundraiser. The cost of hiring the venue and the band is $2500. The cost of providing meals is $50 per person.",
          "(a) Complete the table of values to show the total cost of the fundraiser.",
          "(b) Carrie decides that tickets should be sold at $70 per person. The graph shows the expected revenue at this ticket price. Using the information in part (a), plot the line that shows the cost of the fundraiser.",
          "(c) How many tickets need to be sold for the fundraiser to break even?",
          "(d) Carrie sold 300 tickets. How much profit did the fundraiser make?"
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q23-fundraiser-table-graph",
            type: "graph",
            label: "Fundraiser cost table and revenue graph",
            alt: "Table of fundraiser costs for 0 to 150 people and a graph of expected fundraiser revenue at 70 dollars per ticket.",
            path: "/assets/diagrams/std1-2024-q23-fundraiser-table-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      32: {
        promptLatex: [
          "Question 32\n(5 marks) A scale diagram is shown with locations \\(A\\), \\(B\\) and \\(C\\) marked.",
          "Jo takes 24 minutes to walk from \\(A\\) to \\(B\\) in a straight line when walking at 3 km per hour.",
          "(a) What is the scale used in the diagram?",
          "(b) What is the distance from \\(B\\) to \\(C\\), in kilometres?"
        ].join("\n"),
        assets: [
          {
            id: "std1-2024-q32-scale-grid-map",
            type: "diagram",
            label: "Scale grid with locations A, B and C",
            alt: "Rectangular grid with points A, B and C marked for a scale diagram walking-distance question.",
            path: "/assets/diagrams/std1-2024-q32-scale-grid-map.png",
            sourceStatus: "exam-derived"
          }
        ]
      }
    }
  },
  {
    id: "std2-2024",
    paperId: "std2-2024",
    sourcePackId: "source-std-2024",
    courseId: "standard",
    courseName: "Mathematics Standard 2",
    year: 2024,
    sourceRef: "2024 HSC Mathematics Standard 2 marking feedback",
    examTextPath: "var/extracted-text/source-std-2024/source-std-2024-exam-paper-2024-hsc-maths-std-2.txt",
    markingGuideTextPath:
      "var/extracted-text/source-std-2024/source-std-2024-marking-guide-2024-hsc-maths-std-2-mg.txt",
    markingFeedbackTextPath:
      "var/extracted-text/source-std-2024/source-std-2024-marking-feedback-2024-hsc-mathematics-std2-marking-feedback_0.txt",
    examPackUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/hsc-exam-papers/mathematics-standard/2024",
    expectedQuestionCount: 41,
    sectionIQuestionCount: 15,
    boundaries: makeBoundaries(
      15,
      [53, 83, 153, 170, 200, 259, 291, 309, 336, 355, 430, 455, 521, 543, 592],
      range(16, 41),
      [
        704, 808, 843, 935, 1020, 1186, 1270, 1416, 1456, 1552, 1601, 1683, 1724, 1787, 1869, 1947, 1998,
        2058, 2101, 2148, 2268, 2351, 2404, 2450, 2560, 2635
      ],
      2740,
      632
    ),
    questionOverrides: {
      4: {
        assets: [
          {
            id: "std2-2024-q04-region-map",
            type: "diagram",
            label: "Country region map",
            alt: "Map with six regions labelled Forest, Swamp, Mountains, Desert, Coast, and Woods, with shared borders between regions.",
            path: "/assets/diagrams/std2-2024-q04-region-map.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      6: {
        assets: [
          {
            id: "std2-2024-q06-right-triangle",
            type: "diagram",
            label: "Right triangle with side x",
            alt: "Right triangle with hypotenuse 20, a 40 degree angle at the base, and side x opposite the right angle.",
            path: "/assets/diagrams/std2-2024-q06-right-triangle.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      12: {
        assets: [
          {
            id: "std2-2024-q12-two-way-table",
            type: "table",
            label: "Anime and age two-way table",
            alt: "Two-way table showing counts of people who watch or do not watch Anime, split by 30 years old and under, and over 30 years old.",
            path: "/assets/diagrams/std2-2024-q12-two-way-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      15: {
        assets: [
          {
            id: "std2-2024-q15-boxplot-histograms",
            type: "graph",
            label: "Box plot and histogram options",
            alt: "A box plot and four histogram options labelled A to D for determining which histogram is not possible.",
            path: "/assets/diagrams/std2-2024-q15-boxplot-histograms.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      16: {
        assets: [
          {
            id: "std2-2024-q16-town-network",
            type: "diagram",
            label: "Town network with distances",
            alt: "Weighted network of towns J, T, Y, W, C, G, M, and H with distances labelled on each road.",
            path: "/assets/diagrams/std2-2024-q16-town-network.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      18: {
        assets: [
          {
            id: "std2-2024-q18-weighted-network",
            type: "diagram",
            label: "Weighted network",
            alt: "Weighted network with vertices A to J and edges labelled with weights used for a minimum spanning tree question.",
            path: "/assets/diagrams/std2-2024-q18-weighted-network.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      19: {
        assets: [
          {
            id: "std2-2024-q19-regression-scatterplot",
            type: "graph",
            label: "Assignment and test regression scatterplot",
            alt: "Scatterplot of assignment mark against test mark with a least-squares regression line through the data.",
            path: "/assets/diagrams/std2-2024-q19-regression-scatterplot.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      20: {
        assets: [
          {
            id: "std2-2024-q20-annuity-table",
            type: "table",
            label: "Future value annuity table",
            alt: "Table of future value factors for an annuity of one dollar for periods 1 to 8 and rates from 1 percent to 5 percent.",
            path: "/assets/diagrams/std2-2024-q20-annuity-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      22: {
        assets: [
          {
            id: "std2-2024-q22-population-graph-table",
            type: "graph",
            label: "Animal population graph and table",
            alt: "Graph of two animal populations over time and a table to complete for populations W and K.",
            path: "/assets/diagrams/std2-2024-q22-population-graph-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      26: {
        assets: [
          {
            id: "std2-2024-q26-gutter-graph",
            type: "graph",
            label: "Gutter cross-section and area graph",
            alt: "Diagram of a folded metal gutter with width w and height h, and a quadratic area graph against w.",
            path: "/assets/diagrams/std2-2024-q26-gutter-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      30: {
        assets: [
          {
            id: "std2-2024-q30-anaconda-scatterplot",
            type: "graph",
            label: "Anaconda age and length scatterplot",
            alt: "Scatterplot of anaconda age and length with separate markers for female and male anacondas.",
            path: "/assets/diagrams/std2-2024-q30-anaconda-scatterplot.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      32: {
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(A_{\\text{circle}}=\\pi(30)^2=2827.433\\ldots\\).",
          "The area of one central triangle is \\(\\frac12\\times30\\times30\\sin72^\\circ=427.975\\ldots\\).",
          "The pentagon area is \\(5\\times427.975\\ldots=2139.877\\ldots\\).",
          "The shaded area is \\(2827.433\\ldots-2139.877\\ldots=687.5\\ldots\\), which is \\(690\\text{ cm}^2\\) to 2 significant figures."
        ].join("\n"),
        assets: [
          {
            id: "std2-2024-q32-shaded-pentagon-circle",
            type: "diagram",
            label: "Shaded circle around regular pentagon",
            alt: "Regular pentagon ABCDE inscribed in a circle with centre O and a central angle of 72 degrees, with the region outside the pentagon shaded.",
            path: "/assets/diagrams/std2-2024-q32-shaded-pentagon-circle.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      35: {
        assets: [
          {
            id: "std2-2024-q35-normal-table-diagram",
            type: "table",
            label: "Normal distribution probability table",
            alt: "Probability table for standard normal z values from 0.6 to 1.4 and a diagram showing shaded area to the left of z.",
            path: "/assets/diagrams/std2-2024-q35-normal-table-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      36: {
        assets: [
          {
            id: "std2-2024-q36-flagpoles-diagram",
            type: "diagram",
            label: "Flagpoles on sloping ground",
            alt: "Diagram showing two vertical flagpoles BE and CD on sloping ground, with lengths and angles marked.",
            path: "/assets/diagrams/std2-2024-q36-flagpoles-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      39: {
        assets: [
          {
            id: "std2-2024-q39-project-network-table",
            type: "diagram",
            label: "Project network and activity table",
            alt: "Activity network diagram with activities A to I and a table of earliest and latest start times for activities A, C, and I.",
            path: "/assets/diagrams/std2-2024-q39-project-network-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      41: {
        assets: [
          {
            id: "std2-2024-q41-present-value-table",
            type: "table",
            label: "Present value annuity table",
            alt: "Present value interest factor table for an annuity of one dollar at rates 0.001 to 0.004 for 60 to 300 periods.",
            path: "/assets/diagrams/std2-2024-q41-present-value-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      }
    }
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
    ),
    questionOverrides: {
      2: {
        promptLatex: [
          "2 Consider the functions \\(y=f(x)\\) and \\(y=g(x)\\), and the regions shaded in the diagram below.",
          "Which of the following gives the total area of the shaded regions?",
          "A. \\(\\int_{-4}^{4}(f(x)-g(x))\\,dx\\)",
          "B. \\(\\left|\\int_{-4}^{4}(f(x)-g(x))\\,dx\\right|\\)",
          "C. \\(\\int_{-4}^{-3}(f(x)-g(x))\\,dx+\\int_{-3}^{-1}(f(x)-g(x))\\,dx+\\int_{-1}^{1}(f(x)-g(x))\\,dx+\\int_{1}^{4}(f(x)-g(x))\\,dx\\)",
          "D. \\(-\\int_{-4}^{-3}(f(x)-g(x))\\,dx+\\int_{-3}^{-1}(f(x)-g(x))\\,dx-\\int_{-1}^{1}(f(x)-g(x))\\,dx+\\int_{1}^{4}(f(x)-g(x))\\,dx\\)"
        ].join("\n"),
        assets: [
          {
            id: "ext1-2024-q02-shaded-area-graph",
            type: "graph",
            label: "Shaded area between two functions",
            alt: "Graph of y equals f(x) and y equals g(x) with shaded regions between the curves on intervals from -4 to 4.",
            path: "/assets/diagrams/ext1-2024-q02-shaded-area-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      4: {
        promptLatex: [
          "4 What are the domain and range of the function \\(y=2\\cos^{-1}(2x)+2\\sin^{-1}(2x)\\)?",
          "A. Domain: \\([-0.5,0.5]\\) and Range: \\(\\{\\pi\\}\\)",
          "B. Domain: \\([-0.5,0.5]\\) and Range: \\([-\\pi,3\\pi]\\)",
          "C. Domain: \\([-2,2]\\) and Range: \\(\\{\\pi\\}\\)",
          "D. Domain: \\([-2,2]\\) and Range: \\([-\\pi,3\\pi]\\)"
        ].join("\n")
      },
      6: {
        promptLatex: [
          "6 How many real value(s) of \\(x\\) satisfy the equation \\(|b|=|b\\sin(4x)|\\), where \\(x\\in[0,2\\pi]\\) and \\(b\\) is not zero?",
          "A. 1",
          "B. 2",
          "C. 4",
          "D. 8"
        ].join("\n")
      },
      10: {
        promptLatex: [
          "10 For real numbers \\(a\\) and \\(b\\), where \\(a\\neq0\\) and \\(b\\neq0\\), we can find numbers \\(\\alpha,\\beta,\\gamma,\\delta\\) and \\(R\\) such that \\(a\\cos x+b\\sin x\\) can be written in the following 4 forms:",
          "\\(R\\sin(x+\\alpha)\\)",
          "\\(R\\sin(x-\\beta)\\)",
          "\\(R\\cos(x+\\gamma)\\)",
          "\\(R\\cos(x-\\delta)\\)",
          "where \\(R>0\\) and \\(0<\\alpha,\\beta,\\gamma,\\delta<2\\pi\\).",
          "What is the value of \\(\\alpha+\\beta+\\gamma+\\delta\\)?",
          "A. \\(0\\)",
          "B. \\(\\pi\\)",
          "C. \\(2\\pi\\)",
          "D. \\(4\\pi\\)"
        ].join("\n")
      },
      11: {
        promptLatex: [
          "Question 11 (15 marks) Use the Question 11 Writing Booklet",
          "(a) Consider the vectors \\(\\mathbf{a}=3\\mathbf{i}+2\\mathbf{j}\\) and \\(\\mathbf{b}=-\\mathbf{i}+4\\mathbf{j}\\).",
          "(i) Find \\(2\\mathbf{a}-\\mathbf{b}\\).",
          "(ii) Find \\(\\mathbf{a}\\cdot\\mathbf{b}\\).",
          "(b) Solve \\(x^2-8x-9\\leq0\\).",
          "(c) Using the substitution \\(u=x-1\\), find \\(\\int x\\sqrt{x-1}\\,dx\\).",
          "(d) Solve the differential equation \\(\\frac{dy}{dx}=xy\\), given \\(y>0\\). Express your answer in the form \\(y=e^{f(x)}\\).",
          "(e) Differentiate the function \\(f(x)=\\arcsin(x^5)\\).",
          "(f) The volume of a sphere of radius \\(r\\) cm is given by \\(V=\\frac43\\pi r^3\\), and the volume of the sphere is increasing at a rate of \\(10\\ \\mathrm{cm^3\\ s^{-1}}\\). Show that the rate of increase of the radius is given by \\(\\frac{dr}{dt}=\\frac{5}{2\\pi r^2}\\ \\mathrm{cm\\ s^{-1}}\\).",
          "(g) The region \\(R\\) is bounded by the curves \\(y=\\sin x\\), \\(y=x\\) and the line \\(x=\\frac{\\pi}{2}\\), as shown in the diagram. Find the area of the region \\(R\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) (i) \\(2\\mathbf{a}-\\mathbf{b}=7\\mathbf{i}\\). (ii) \\(\\mathbf{a}\\cdot\\mathbf{b}=5\\).",
          "(b) \\((x-9)(x+1)\\leq0\\), so \\(-1\\leq x\\leq9\\).",
          "(c) With \\(u=x-1\\), \\(\\int x\\sqrt{x-1}\\,dx=\\int(u+1)u^{1/2}\\,du=\\frac25(x-1)^{5/2}+\\frac23(x-1)^{3/2}+C\\).",
          "(d) \\(\\ln y=\\frac{x^2}{2}+C\\), so \\(y=e^{x^2/2+C}\\).",
          "(e) \\(f'(x)=\\frac{5x^4}{\\sqrt{1-x^{10}}}\\).",
          "(f) \\(\\frac{dV}{dt}=4\\pi r^2\\frac{dr}{dt}=10\\), so \\(\\frac{dr}{dt}=\\frac{5}{2\\pi r^2}\\).",
          "(g) Area \\(=\\int_0^{\\pi/2}(x-\\sin x)\\,dx=\\frac{\\pi^2}{8}-1\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext1-2024-q11-sine-line-region-graph",
            type: "graph",
            label: "Region between y=x and y=sin(x)",
            alt: "Graph showing the region R bounded by y equals x, y equals sin x, and the vertical line x equals pi over 2.",
            path: "/assets/diagrams/ext1-2024-q11-sine-line-region-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      12: {
        promptLatex: [
          "Question 12 (15 marks) Use the Question 12 Writing Booklet",
          "(a) The vectors \\(\\begin{pmatrix}a^2\\\\2\\end{pmatrix}\\) and \\(\\begin{pmatrix}a+5\\\\a-4\\end{pmatrix}\\) are perpendicular. Find the possible values of \\(a\\).",
          "(b) The region \\(R\\) is bounded by the function \\(y=x^3\\), the \\(x\\)-axis and the lines \\(x=1\\) and \\(x=2\\). What is the volume of the solid of revolution obtained when the region \\(R\\) is rotated about the \\(x\\)-axis?",
          "(c) A charity employs a worker to collect donations. There is a 0.31 chance that when the charity worker talks to someone a donation is made to the charity. Each day the charity worker must talk to exactly 100 people. Use the standard normal distribution and the information on page 13 to approximate the probability that, on a particular day, at least 35% of the people talked to made a donation.",
          "(d) Use mathematical induction to prove that \\(2^{3n}+13\\) is divisible by 7 for all integers \\(n\\geq1\\).",
          "(e) The diagram shows the graph of \\(y=\\frac{1}{|x-5|}\\). For what values of \\(x\\) is \\(\\frac{x}{6}\\geq\\frac{1}{|x-5|}\\)?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Perpendicular vectors give \\(a^2(a+5)+2(a-4)=0\\), so \\((a-1)(a+2)(a+4)=0\\). Thus \\(a=-4,-2,1\\).",
          "(b) \\(V=\\pi\\int_1^2 x^6\\,dx=\\frac{127\\pi}{7}\\).",
          "(c) If \\(X\\sim\\operatorname{Bin}(100,0.31)\\), use a normal approximation with mean 31 and standard deviation \\(\\sqrt{100(0.31)(0.69)}\\). With continuity correction, \\(P(X\\geq35)\\approx P\\left(Z\\geq\\frac{34.5-31}{\\sqrt{21.39}}\\right)\\approx0.22\\).",
          "(d) Base case: \\(2^3+13=21\\), divisible by 7. If \\(2^{3k}+13\\) is divisible by 7, then \\(2^{3(k+1)}+13=8(2^{3k}+13)-91\\), also divisible by 7.",
          "(e) Since the right side is positive, \\(x>0\\). For \\(0<x<5\\), \\(x(5-x)\\geq6\\), giving \\(2\\leq x\\leq3\\). For \\(x>5\\), \\(x(x-5)\\geq6\\), giving \\(x\\geq6\\). Hence \\(x\\in[2,3]\\cup[6,\\infty)\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext1-2024-q12-reciprocal-absolute-graph",
            type: "graph",
            label: "Graph of y=1/|x-5|",
            alt: "Graph of y equals one over absolute value of x minus five with a vertical asymptote at x equals five and y-intercept one fifth.",
            path: "/assets/diagrams/ext1-2024-q12-reciprocal-absolute-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      13: {
        promptLatex: [
          "Question 13 (16 marks) Use the Question 13 Writing Booklet",
          "(a) In an experiment, the population of insects, \\(P(t)\\), was modelled by the logistic differential equation \\(\\frac{dP}{dt}=P(2000-P)\\), where \\(t\\) is the time in days after the beginning of the experiment. The diagram shows a direction field for this differential equation, with the point \\(S\\) representing the initial population.",
          "(i) Explain why the graph of the solution that passes through the point \\(S\\) cannot also pass through the point \\(T\\).",
          "(ii) On the diagram provided on page 1 of the Question 13 Writing Booklet, clearly sketch the graph of the solution that passes through the point \\(S\\).",
          "(iii) Find the predicted value of the population, \\(P(t)\\), at which the rate of growth of the population is largest.",
          "(b) (i) Show that \\(\\cos^4x+\\sin^4x=\\frac{1+\\cos^2 2x}{2}\\).",
          "(ii) Hence, or otherwise, evaluate \\(\\int_0^{\\pi/4}(\\cos^4x+\\sin^4x)\\,dx\\).",
          "(c) The vector \\(\\mathbf{a}\\) is \\(\\begin{pmatrix}1\\\\3\\end{pmatrix}\\) and the vector \\(\\mathbf{b}\\) is \\(\\begin{pmatrix}2\\\\-1\\end{pmatrix}\\). The projection of a vector \\(\\mathbf{x}\\) onto \\(\\mathbf{a}\\) is \\(k\\mathbf{a}\\), where \\(k\\) is a real number. The projection of \\(\\mathbf{x}\\) onto \\(\\mathbf{b}\\) is \\(p\\mathbf{b}\\), where \\(p\\) is a real number. Find the vector \\(\\mathbf{x}\\) in terms of \\(k\\) and \\(p\\).",
          "(d) Using the substitution \\(u=e^x+2e^{-x}\\), and considering \\(u^2\\), find \\(\\int\\frac{e^{3x}-2e^x}{4+8e^{2x}+e^{4x}}\\,dx\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) The solution through \\(S\\) cannot also pass through \\(T\\) because solutions of the differential equation do not cross and the equilibrium \\(P=2000\\) separates the fields. The growth rate \\(P(2000-P)\\) is maximised at \\(P=1000\\).",
          "(b) \\(\\cos^4x+\\sin^4x=(\\cos^2x+\\sin^2x)^2-2\\sin^2x\\cos^2x=\\frac{1+\\cos^2 2x}{2}\\). Hence the integral is \\(\\int_0^{\\pi/4}\\left(\\frac34+\\frac14\\cos4x\\right)dx=\\frac{3\\pi}{16}\\).",
          "(c) Let \\(\\mathbf{x}=\\begin{pmatrix}X\\\\Y\\end{pmatrix}\\). The projection conditions give \\(X+3Y=10k\\) and \\(2X-Y=5p\\), so \\(\\mathbf{x}=\\begin{pmatrix}(10k+15p)/7\\\\(20k-5p)/7\\end{pmatrix}\\).",
          "(d) Since \\(u=e^x+2e^{-x}\\), \\(du=(e^x-2e^{-x})dx\\) and the integral becomes \\(\\int\\frac{du}{u^2+4}=\\frac12\\tan^{-1}\\left(\\frac{u}{2}\\right)+C\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext1-2024-q13-direction-field",
            type: "diagram",
            label: "Direction field for logistic differential equation",
            alt: "Direction field for dP over dt equals P times 2000 minus P, with labelled points S and T and equilibrium P equals 2000.",
            path: "/assets/diagrams/ext1-2024-q13-direction-field.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      14: {
        promptLatex: [
          "Question 14 (14 marks) Use the Question 14 Writing Booklet",
          "(a) Find the domain and range of the function that is the solution to the differential equation \\(\\frac{dy}{dx}=e^{x+y}\\) and whose graph passes through the origin.",
          "(b) For what values of the constant \\(k\\) would the function \\(f(x)=\\frac{kx}{1+x^2}+\\arctan x\\) have an inverse?",
          "(c) (i) Explain why the equation \\(\\tan^{-1}(3x)+\\tan^{-1}(10x)=\\theta\\), where \\(-\\pi<\\theta<\\pi\\), has exactly one solution.",
          "(ii) Solve \\(\\tan^{-1}(3x)+\\tan^{-1}(10x)=\\frac{3\\pi}{4}\\).",
          "(d) A particle is projected from the origin, with initial speed \\(V\\) at an angle of \\(\\theta\\) to the horizontal. The position vector of the particle, \\(\\mathbf{r}(t)\\), where \\(t\\) is the time after projection and \\(g\\) is the acceleration due to gravity, is given by \\(\\mathbf{r}(t)=\\begin{pmatrix}Vt\\cos\\theta\\\\Vt\\sin\\theta-\\frac{gt^2}{2}\\end{pmatrix}\\). Do NOT prove this. Let \\(D(t)\\) be the distance of the particle from the origin at time \\(t\\), so \\(D(t)=|\\mathbf{r}(t)|\\). Show that for \\(\\theta<\\sin^{-1}\\left(\\sqrt{\\frac89}\\right)\\), the distance \\(D(t)\\) is increasing for all \\(t>0\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Solving \\(\\frac{dy}{dx}=e^{x+y}\\) gives \\(e^{-y}=2-e^x\\), so \\(y=-\\ln(2-e^x)\\). The domain is \\((-\\infty,\\ln2)\\) and the range is \\((-\\ln2,\\infty)\\).",
          "(b) \\(f'(x)=\\frac{(k+1)+(1-k)x^2}{(1+x^2)^2}\\). For \\(f\\) to be one-to-one on its domain, require \\(-1\\leq k\\leq1\\).",
          "(c) The left side is strictly increasing, so there is exactly one solution for each \\(\\theta\\in(-\\pi,\\pi)\\). Solving \\(\\tan^{-1}(3x)+\\tan^{-1}(10x)=\\frac{3\\pi}{4}\\) gives \\(x=\\frac12\\).",
          "(d) \\(D(t)^2=V^2t^2-Vg\\sin\\theta\\,t^3+\\frac{g^2t^4}{4}\\). Its derivative is positive for \\(t>0\\) when \\(g^2t^2-3Vg\\sin\\theta\\,t+2V^2>0\\), which follows from \\(\\sin^2\\theta<\\frac89\\)."
        ].join("\n")
      }
    }
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
    ),
    questionOverrides: {
      2: {
        promptLatex: [
          "2 Consider the following statement written in the formal language of proof.",
          "\\(\\forall \\theta \\in \\left(\\frac{\\pi}{2},\\pi\\right)\\ \\exists \\phi \\in \\left(\\pi,\\frac{3\\pi}{2}\\right);\\ \\sin\\theta=-\\cos\\phi.\\)",
          "Which of the following best represents this statement?",
          "A. There exists a \\(\\theta\\) in the second quadrant such that for all \\(\\phi\\) in the third quadrant \\(\\sin\\theta=-\\cos\\phi\\).",
          "B. There exists a \\(\\phi\\) in the third quadrant such that for all \\(\\theta\\) in the second quadrant \\(\\sin\\theta=-\\cos\\phi\\).",
          "C. For all \\(\\theta\\) in the second quadrant there exists a \\(\\phi\\) in the third quadrant such that \\(\\sin\\theta=-\\cos\\phi\\).",
          "D. For all \\(\\phi\\) in the third quadrant there exists a \\(\\theta\\) in the second quadrant such that \\(\\sin\\theta=-\\cos\\phi\\)."
        ].join("\n")
      },
      10: {
        promptLatex: [
          "10 Three unit vectors \\(\\mathbf{a}\\), \\(\\mathbf{b}\\) and \\(\\mathbf{c}\\), in 3 dimensions, are to be chosen so that \\(\\mathbf{a}\\perp\\mathbf{b}\\), \\(\\mathbf{b}\\perp\\mathbf{c}\\) and the angle \\(\\theta\\) between \\(\\mathbf{a}\\) and \\(\\mathbf{a}+\\mathbf{b}+\\mathbf{c}\\) is as small as possible.",
          "What is the value of \\(\\cos\\theta\\)?",
          "A. \\(0\\)",
          "B. \\(\\frac{1}{\\sqrt{3}}\\)",
          "C. \\(\\frac{1}{\\sqrt{2}}\\)",
          "D. \\(\\frac{2}{\\sqrt{5}}\\)"
        ].join("\n")
      },
      11: {
        promptLatex: [
          "Question 11 (16 marks) Use the Question 11 Writing Booklet",
          "(a) Find \\(\\int xe^x\\,dx\\).",
          "(b) Let \\(z=2+3i\\) and \\(w=1-5i\\).",
          "(i) Find \\(z+\\overline{w}\\).",
          "(ii) Find \\(z^2\\).",
          "(c) Find the angle between the two vectors \\(\\mathbf{u}=\\begin{pmatrix}1\\\\2\\\\-2\\end{pmatrix}\\) and \\(\\mathbf{v}=\\begin{pmatrix}4\\\\-4\\\\7\\end{pmatrix}\\), giving your answer in radians, correct to 1 decimal place.",
          "(d) Evaluate \\(\\int_0^{\\pi/2}\\frac{1}{\\sin\\theta+1}\\,d\\theta\\).",
          "(e) (i) Write the number \\(\\sqrt{3}+i\\) in modulus-argument form.",
          "(ii) Hence, or otherwise, write \\((\\sqrt{3}+i)^7\\) in exact Cartesian form.",
          "(f) Sketch the region defined by \\(|z|<3\\) and \\(0\\leq \\arg(z-i)\\leq \\frac{\\pi}{2}\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(\\int xe^x\\,dx=xe^x-e^x+C=e^x(x-1)+C\\).",
          "(b) (i) \\(z+\\overline{w}=3+8i\\). (ii) \\(z^2=-5+12i\\).",
          "(c) \\(\\mathbf{u}\\cdot\\mathbf{v}=-18\\), \\(|\\mathbf{u}|=3\\), \\(|\\mathbf{v}|=9\\), so \\(\\cos\\theta=-\\frac{2}{3}\\) and \\(\\theta\\approx2.3\\) radians.",
          "(d) \\(\\int_0^{\\pi/2}\\frac{1}{1+\\sin\\theta}\\,d\\theta=1\\).",
          "(e) (i) \\(\\sqrt{3}+i=2\\operatorname{cis}\\frac{\\pi}{6}\\). (ii) \\((\\sqrt{3}+i)^7=-64\\sqrt{3}-64i\\).",
          "(f) The required region is inside \\(|z|<3\\) and in the first-quadrant sector based at \\(i\\): \\(\\operatorname{Re}(z)\\geq0\\), \\(\\operatorname{Im}(z)\\geq1\\), with the boundary rays included and the circle boundary excluded."
        ].join("\n")
      },
      12: {
        promptLatex: [
          "Question 12 (14 marks) Use the Question 12 Writing Booklet",
          "(a) The vector \\(\\mathbf{a}\\) is \\(\\begin{pmatrix}1\\\\2\\\\3\\end{pmatrix}\\) and the vector \\(\\mathbf{b}\\) is \\(\\begin{pmatrix}2\\\\0\\\\-4\\end{pmatrix}\\).",
          "(i) Find \\(\\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\mathbf{b}\\cdot\\mathbf{b}}\\mathbf{b}\\).",
          "(ii) Show that \\(\\mathbf{a}-\\frac{\\mathbf{a}\\cdot\\mathbf{b}}{\\mathbf{b}\\cdot\\mathbf{b}}\\mathbf{b}\\) is perpendicular to \\(\\mathbf{b}\\).",
          "(b) Use partial fractions to find \\(\\int \\frac{3x^2+2x+1}{(x-1)(x^2+1)}\\,dx\\).",
          "(c) Consider the equation \\(|z|=z+8+12i\\), where \\(z=a+bi\\) is a complex number and \\(a,b\\) are real numbers.",
          "(i) Explain why \\(b=-12\\).",
          "(ii) Hence, or otherwise, find \\(z\\).",
          "(d) Explain why there is no integer \\(n\\) such that \\((n+1)^{41}-79n^{40}=2\\).",
          "(e) The line \\(\\ell\\) passes through the points \\(A(3,5,-4)\\) and \\(B(7,0,2)\\).",
          "(i) Find a vector equation of the line \\(\\ell\\).",
          "(ii) Determine, giving reasons, whether the point \\(C(10,5,-2)\\) lies on the line \\(\\ell\\)."
        ].join("\n")
      },
      13: {
        promptLatex: [
          "Question 13 (16 marks) Use the Question 13 Writing Booklet",
          "(a) The point \\(A\\) has position vector \\(8\\mathbf{i}-6\\mathbf{j}+5\\mathbf{k}\\). The line \\(\\ell\\) has vector equation \\(x\\mathbf{i}+y\\mathbf{j}+z\\mathbf{k}=t(\\mathbf{i}+\\mathbf{j}+2\\mathbf{k})\\).",
          "The point \\(B\\) lies on \\(\\ell\\) and has position vector \\(p\\mathbf{i}+p\\mathbf{j}+2p\\mathbf{k}\\).",
          "(i) Show that \\(|AB|^2=6p^2-24p+125\\).",
          "(ii) Hence, or otherwise, determine the shortest distance between the point \\(A\\) and the line \\(\\ell\\).",
          "(b) A particle is moving in simple harmonic motion, described by \\(\\ddot{x}=-4(x+1)\\). When the particle passes through the origin, the speed of the particle is \\(4\\ \\mathrm{m\\ s^{-1}}\\). What distance does the particle travel during a full period of its motion?",
          "(c) A particle of unit mass moves horizontally in a straight line. It experiences a resistive force proportional to \\(v^2\\), where \\(v\\ \\mathrm{m\\ s^{-1}}\\) is the speed of the particle, so that the acceleration is given by \\(-kv^2\\). Initially the particle is at the origin and has a velocity of \\(40\\ \\mathrm{m\\ s^{-1}}\\) to the right. After the particle has moved 15 m to the right, its velocity is \\(10\\ \\mathrm{m\\ s^{-1}}\\) to the right.",
          "(i) Show that \\(v=40e^{-kx}\\).",
          "(ii) Show that \\(k=\\frac{\\ln 4}{15}\\).",
          "(iii) At what time will the particle's velocity be \\(30\\ \\mathrm{m\\ s^{-1}}\\) to the right?",
          "(d) It is known that for all positive real numbers \\(x,y\\), \\(x+y\\geq 2\\sqrt{xy}\\). Do NOT prove this. Show that if \\(a,b,c\\) are positive real numbers with \\(\\frac{1}{a}+\\frac{1}{b}+\\frac{1}{c}=1\\), then \\(a\\sqrt{bc}+b\\sqrt{ac}+c\\sqrt{ab}\\leq abc\\)."
        ].join("\n")
      },
      14: {
        promptLatex: [
          "Question 14 (15 marks) Use the Question 14 Writing Booklet",
          "(a) Prove that if \\(a\\) is any odd integer, then \\(a^2-1\\) is divisible by 8.",
          "(b) Use mathematical induction to prove that \\(\\binom{2n}{n}<2^{2n-2}\\), for all integers \\(n\\geq 5\\).",
          "(c) For the complex numbers \\(z\\) and \\(w\\), it is known that \\(\\arg\\left(\\frac{z}{w}\\right)=-\\frac{\\pi}{2}\\). Find \\(\\left|\\frac{z-w}{z+w}\\right|\\).",
          "(d) The following argument attempts to prove that \\(0=1\\). We evaluate \\(\\int\\frac{1}{x}\\,dx\\) using the method of integration by parts: \\(\\int\\frac{1}{x}\\,dx=\\int\\frac{1}{x}\\times1\\,dx=\\frac{1}{x}\\times x-\\int -\\frac{1}{x^2}x\\,dx=1+\\int\\frac{1}{x}\\,dx\\). So \\(\\int\\frac{1}{x}\\,dx=1+\\int\\frac{1}{x}\\,dx\\), and subtracting \\(\\int\\frac{1}{x}\\,dx\\) from both sides gives \\(0=1\\). Explain what is wrong with this argument.",
          "(e) The diagram shows triangle \\(OQA\\). The point \\(P\\) lies on \\(OA\\) so that \\(OP:OA=3:5\\). The point \\(B\\) lies on \\(OQ\\) so that \\(OB:OQ=1:3\\). The point \\(R\\) is the intersection of \\(AB\\) and \\(PQ\\). The point \\(T\\) is chosen on \\(AQ\\) so that \\(O,R\\) and \\(T\\) are collinear.",
          "Let \\(\\mathbf{a}=\\overrightarrow{OA}\\), \\(\\mathbf{b}=\\overrightarrow{OB}\\) and \\(\\overrightarrow{PR}=k\\overrightarrow{PQ}\\), where \\(k\\) is a real number.",
          "(i) Show that \\(\\overrightarrow{OR}=\\frac{3}{5}(1-k)\\mathbf{a}+3k\\mathbf{b}\\).",
          "Writing \\(\\overrightarrow{AR}=h\\overrightarrow{AB}\\), where \\(h\\) is a real number, it can be shown that \\(\\overrightarrow{OR}=(1-h)\\mathbf{a}+h\\mathbf{b}\\). Do NOT prove this.",
          "(ii) Show that \\(k=\\frac{1}{6}\\).",
          "(iii) Find \\(\\overrightarrow{OT}\\) in terms of \\(\\mathbf{a}\\) and \\(\\mathbf{b}\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Let \\(a=2m+1\\). Then \\(a^2-1=4m(m+1)\\), and one of the consecutive integers \\(m,m+1\\) is even, so \\(a^2-1\\) is divisible by 8.",
          "(b) Check \\(n=5\\): \\(\\binom{10}{5}=252<256=2^8\\). For the induction step, assume \\(\\binom{2k}{k}<2^{2k-2}\\) and use \\(\\binom{2k+2}{k+1}=\\binom{2k}{k}\\frac{2(2k+1)}{k+1}\\) to show \\(\\binom{2k+2}{k+1}<2^{2k}\\).",
          "(c) Since \\(\\arg(z/w)=-\\frac{\\pi}{2}\\), \\(z/w\\) is purely imaginary. Hence \\(\\left|\\frac{z-w}{z+w}\\right|=\\left|\\frac{z/w-1}{z/w+1}\\right|=1\\).",
          "(d) The argument treats two indefinite integrals as if they have the same constant of integration. Correctly, the constants differ, so the subtraction does not imply \\(0=1\\).",
          "(e) (i) \\(\\overrightarrow{OR}=\\overrightarrow{OP}+\\overrightarrow{PR}=\\frac35\\mathbf{a}+k(3\\mathbf{b}-\\frac35\\mathbf{a})=\\frac35(1-k)\\mathbf{a}+3k\\mathbf{b}\\).",
          "(ii) Comparing coefficients with \\((1-h)\\mathbf{a}+h\\mathbf{b}\\) gives \\(h=3k\\) and \\(1-h=\\frac35(1-k)\\), so \\(k=\\frac16\\).",
          "(iii) \\(\\overrightarrow{OR}=\\frac12(\\mathbf{a}+\\mathbf{b})\\). Since \\(O,R,T\\) are collinear and \\(T\\) lies on \\(AQ\\), comparing coefficients gives \\(\\overrightarrow{OT}=\\frac34\\mathbf{a}+\\frac34\\mathbf{b}\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext2-2024-q14-triangle-vector-diagram",
            type: "diagram",
            label: "Triangle OQA vector diagram",
            alt: "Triangle OQA with P on OA, B on OQ, R at the intersection of AB and PQ, and T on AQ collinear with O and R.",
            path: "/assets/diagrams/ext2-2024-q14-triangle-vector-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      15: {
        promptLatex: [
          "Question 15 (15 marks) Use the Question 15 Writing Booklet",
          "(a) Consider the three vectors \\(\\mathbf{a}=\\overrightarrow{OA}\\), \\(\\mathbf{b}=\\overrightarrow{OB}\\) and \\(\\mathbf{c}=\\overrightarrow{OC}\\), where \\(O\\) is the origin and the points \\(A,B,C\\) are all different from each other and the origin.",
          "The point \\(M\\) is the point such that \\(\\frac{1}{2}(\\mathbf{a}+\\mathbf{b})=\\overrightarrow{OM}\\).",
          "(i) Show that \\(M\\) lies on the line passing through \\(A\\) and \\(B\\).",
          "(ii) The point \\(G\\) is the point such that \\(\\frac{1}{3}(\\mathbf{a}+\\mathbf{b}+\\mathbf{c})=\\overrightarrow{OG}\\). Show that \\(G\\) lies on the line passing through \\(M\\) and \\(C\\), and lies between \\(M\\) and \\(C\\).",
          "(iii) The complex numbers \\(x,w,z\\) are all different and all have modulus 1. Using part (ii), or otherwise, show that \\(\\frac{1}{3}(x+w+z)\\) is never a cube root of \\(xwz\\).",
          "(b) Let \\(I_n=\\int_0^a x^{n+\\frac{1}{2}}(a-x)^{\\frac{1}{2}}\\,dx\\), where \\(n\\geq0\\). Show that \\((2n+4)I_n=a(2n+1)I_{n-1}\\), for \\(n>0\\).",
          "(c) A bar magnet is held vertically. An object that is repelled by the magnet is to be dropped from directly above the magnet and will maintain a vertical trajectory. Let \\(x\\) be the distance of the object above the magnet. The object is subject to acceleration due to gravity, \\(g\\), and an acceleration due to the magnet \\(\\frac{27g}{x^3}\\), so that the total acceleration of the object is given by \\(a=\\frac{27g}{x^3}-g\\). The object is released from rest at \\(x=6\\).",
          "(i) Show that \\(v^2=g\\left(\\frac{51}{4}-2x-\\frac{27}{x^2}\\right)\\).",
          "(ii) Find where the object next comes to rest, giving your answer correct to 1 decimal place.",
          "(d) Using a suitable substitution, find \\(\\int \\frac{2x^2}{\\sqrt{2x-x^2}}\\,dx\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) (i) \\(\\overrightarrow{OM}=\\frac12(\\mathbf{a}+\\mathbf{b})=\\overrightarrow{OA}+\\frac12\\overrightarrow{AB}\\), so \\(M\\) lies on line \\(AB\\).",
          "(ii) \\(\\overrightarrow{OG}=\\frac13(\\mathbf{a}+\\mathbf{b}+\\mathbf{c})=\\overrightarrow{OC}+\\frac23\\overrightarrow{CM}\\), so \\(G\\) lies on line \\(CM\\) between \\(C\\) and \\(M\\).",
          "(iii) The point represented by \\(\\frac13(x+w+z)\\) lies inside the unit circle, so its modulus is less than 1, while every cube root of \\(xwz\\) has modulus 1.",
          "(b) Use integration by parts with \\(u=x^{n+1/2}\\) and \\(dv=(a-x)^{1/2}dx\\) to obtain \\((2n+4)I_n=a(2n+1)I_{n-1}\\) for \\(n>0\\).",
          "(c) (i) From \\(v\\frac{dv}{dx}=\\frac{27g}{x^3}-g\\) and \\(v=0\\) at \\(x=6\\), \\(v^2=g\\left(\\frac{51}{4}-2x-\\frac{27}{x^2}\\right)\\).",
          "(ii) Setting \\(v=0\\) gives \\(8x^3-51x^2+108=0\\). The next positive rest position after release is \\(x=\\frac{3+\\sqrt{585}}{16}\\approx1.7\\).",
          "(d) One valid primitive is \\(-3\\sin^{-1}(1-x)-(x+3)\\sqrt{2x-x^2}+C\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext2-2024-q15-magnet-acceleration-diagram",
            type: "diagram",
            label: "Magnet acceleration diagram",
            alt: "Object above a vertical bar magnet with distance x, upward acceleration 27g over x cubed, and downward acceleration g.",
            path: "/assets/diagrams/ext2-2024-q15-magnet-acceleration-diagram.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      16: {
        promptLatex: [
          "Question 16 (14 marks) Use the Question 16 Writing Booklet",
          "(a) Consider the function \\(y=\\cos(kx)\\), where \\(k>0\\). The value of \\(k\\) has been chosen so that a circle can be drawn, centred at the origin, which has exactly two points of intersection with the graph of the function and so that the circle is never above the graph of the function. The point \\(P(a,b)\\) is the point of intersection in the first quadrant, so \\(a>0\\) and \\(b>0\\), as shown in the diagram.",
          "The vector joining the origin to the point \\(P(a,b)\\) is perpendicular to the tangent to the graph of the function at that point. Do NOT prove this. Show that \\(k>1\\).",
          "(b) The number \\(w=e^{2\\pi i/3}\\) is a complex cube root of unity. The number \\(\\gamma\\) is a cube root of \\(w\\).",
          "(i) Show that \\(\\gamma+\\overline{\\gamma}\\) is a real root of \\(z^3-3z+1=0\\).",
          "(ii) By using part (i) to find the exact value of \\(\\cos\\frac{2\\pi}{9}\\cos\\frac{4\\pi}{9}\\cos\\frac{8\\pi}{9}\\), deduce the value(s) of \\(\\cos\\frac{2^n\\pi}{9}\\cos\\frac{2^{n+1}\\pi}{9}\\cos\\frac{2^{n+2}\\pi}{9}\\) for all integers \\(n\\geq1\\). Justify your answer.",
          "(c) Two particles, \\(A\\) and \\(B\\), each have mass 1 kg and are in a medium that exerts a resistance to motion equal to \\(kv\\), where \\(k>0\\) and \\(v\\) is the velocity of any particle. Both particles maintain vertical trajectories. The acceleration due to gravity is \\(g\\ \\mathrm{m\\ s^{-2}}\\), where \\(g>0\\). The two particles are simultaneously projected towards each other with the same speed, \\(v_0\\ \\mathrm{m\\ s^{-1}}\\), where \\(0<v_0<\\frac{g}{k}\\). The particle \\(A\\) is initially \\(d\\) metres directly above particle \\(B\\), where \\(d<\\frac{2v_0}{k}\\). Find the time taken for the particles to meet."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) At \\(P(a,b)\\), \\(b=\\cos(ka)\\) and the tangent slope is \\(-k\\sin(ka)\\). Since \\(OP\\) is perpendicular to the tangent, \\(a=k\\sin(ka)\\cos(ka)\\), so \\(2a=k\\sin(2ka)\\). If \\(k\\leq1\\), then \\(k\\sin(2ka)<2a\\), contradicting the equation; hence \\(k>1\\).",
          "(b) (i) Since \\(\\gamma^3=w\\) and \\(\\overline{\\gamma}=\\gamma^{-1}\\), \\((\\gamma+\\overline{\\gamma})^3-3(\\gamma+\\overline{\\gamma})+1=\\gamma^3+\\overline{\\gamma}^3+1=w+\\overline{w}+1=0\\).",
          "(ii) The three real roots are \\(2\\cos\\frac{2\\pi}{9}\\), \\(2\\cos\\frac{4\\pi}{9}\\), and \\(2\\cos\\frac{8\\pi}{9}\\). Their product is \\(-1\\), so \\(\\cos\\frac{2\\pi}{9}\\cos\\frac{4\\pi}{9}\\cos\\frac{8\\pi}{9}=-\\frac18\\). The doubling sequence repeats these factors modulo \\(2\\pi\\), so the value is \\(-\\frac18\\) for all integers \\(n\\geq1\\).",
          "(c) Let \\(s=x_A-x_B\\). Then \\(\\frac{d^2s}{dt^2}=-k\\frac{ds}{dt}\\), with \\(s(0)=d\\) and \\(s'(0)=-2v_0\\). Hence \\(s=\\frac{2v_0}{k}e^{-kt}+d-\frac{2v_0}{k}\\). Setting \\(s=0\\) gives \\(t=\\frac1k\\log\\left(\\frac{2v_0}{2v_0-kd}\\right)\\)."
        ].join("\n"),
        assets: [
          {
            id: "ext2-2024-q16-cos-circle-graph",
            type: "graph",
            label: "Cosine graph and circle",
            alt: "Graph of y equals cos(kx) with a circle centred at O and an intersection point P(a,b) in the first quadrant.",
            path: "/assets/diagrams/ext2-2024-q16-cos-circle-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      }
    }
  }
];

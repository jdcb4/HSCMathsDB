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

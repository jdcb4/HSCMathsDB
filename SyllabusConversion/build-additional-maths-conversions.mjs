import { readFileSync, writeFileSync } from "node:fs";

const today = "2026-06-06";
const sourcePath = "src/data/syllabus-conversion.json";
const stagedPath = "SyllabusConversion/additional-maths-course-conversions.json";

const current = JSON.parse(readFileSync(sourcePath, "utf8"));

const advancedCourse =
  current.schemaVersion === 1
    ? {
        id: "advanced",
        title: "Mathematics Advanced",
        oldSyllabus: current.oldSyllabus,
        newSyllabus: current.newSyllabus,
        mappings: current.mappings
      }
    : current.courses.find((course) => course.id === "advanced");

if (!advancedCourse) {
  throw new Error("Existing Mathematics Advanced conversion course was not found.");
}

const additionalCourses = [extension1Course(), extension2Course(), standardCourse()];

const merged = {
  schemaVersion: 2,
  updatedAt: today,
  purpose:
    "Map NSW Stage 6 mathematics syllabus nodes from the 2017 syllabuses to the 2024 11-12 syllabuses for future question categorisation and cross-syllabus lookup.",
  sourceSummary:
    "Built from official NSW Government 2017 syllabus pages and DOCX downloads, and official NSW Curriculum 2024 overview/content pages. Courses without imported exams are stored as conversion-only course mappings until their corpora are added.",
  courses: [advancedCourse, ...additionalCourses],
  questionCategorisationModel: {
    recommendedPrimaryKey: "syllabusTags[].nodeIds",
    recommendedSecondaryKey: "syllabusTags[].contentGroupIds",
    reviewStates: ["draft", "reviewed", "verified"],
    guidance: [
      "Tag the syllabus version the paper was examined under as primary.",
      "Resolve cross-syllabus display through mappings rather than duplicating tags manually.",
      "When a question crosses topics, store multiple nodeIds and contentGroupIds.",
      "For future non-Advanced courses, add displayable corpus syllabus nodes whose IDs match the conversion node IDs before importing exam questions.",
      "Use mapping relationship and confidence to decide whether to show a direct equivalent, a related-content warning, or a reviewer note."
    ]
  }
};

writeJson(stagedPath, {
  schemaVersion: 1,
  updatedAt: today,
  purpose: "Separate staging artifact for Mathematics Extension 1, Extension 2, and Standard conversions.",
  courses: additionalCourses
});
writeJson(sourcePath, merged);

function extension1Course() {
  const oldSyllabus = {
    id: "extension-1-2017",
    title: "Mathematics Extension 1 Stage 6 Syllabus (2017)",
    sourceUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-extension-1-stage-6-2017",
    sourceDocxUrl:
      "https://www.nsw.gov.au/sites/default/files/noindex/2025-04/mathematics-extension-1-stage-6-syllabus-2017.docx",
    implementation: {
      replacedBy: "extension-1-2024",
      replacementNotes:
        "The 2024 syllabus starts Year 11 implementation in 2026, Year 12 implementation in Term 4 2026, with the first HSC exam in 2027."
    },
    nodes: [
      oldNode("old-me1-f1", "ME-F1", 11, "Functions", "Further Work with Functions", [
        group("old-me1-f1-graphical", "F1.1", "Graphical relationships"),
        group("old-me1-f1-inequalities", "F1.2", "Inequalities"),
        group("old-me1-f1-inverse", "F1.3", "Inverse functions"),
        group("old-me1-f1-parametric", "F1.4", "Parametric form of a function or relation")
      ]),
      oldNode("old-me1-f2", "ME-F2", 11, "Functions", "Polynomials", [
        group("old-me1-f2-remainder-factor", "F2.1", "Remainder and factor theorems"),
        group("old-me1-f2-roots", "F2.2", "Sums and products of roots of polynomials")
      ]),
      oldNode("old-me1-t1", "ME-T1", 11, "Trigonometric Functions", "Inverse Trigonometric Functions", [
        group("old-me1-t1-inverse-trig", "T1", "Inverse trigonometric functions")
      ]),
      oldNode("old-me1-t2", "ME-T2", 11, "Trigonometric Functions", "Further Trigonometric Identities", [
        group(
          "old-me1-t2-identities",
          "T2",
          "Compound-angle, double-angle and related trigonometric identities"
        )
      ]),
      oldNode("old-me1-c1", "ME-C1", 11, "Calculus", "Rates of Change", [
        group("old-me1-c1-time", "C1.1", "Rates of change with respect to time"),
        group("old-me1-c1-exponential", "C1.2", "Exponential growth and decay"),
        group("old-me1-c1-related", "C1.3", "Related rates of change")
      ]),
      oldNode("old-me1-a1", "ME-A1", 11, "Combinatorics", "Working with Combinatorics", [
        group("old-me1-a1-permutations-combinations", "A1.1", "Permutations and combinations"),
        group("old-me1-a1-binomial-expansion", "A1.2", "The binomial expansion and Pascal's triangle")
      ]),
      oldNode("old-me1-p1", "ME-P1", 12, "Proof", "Proof by Mathematical Induction", [
        group("old-me1-p1-induction", "P1", "Proof by mathematical induction")
      ]),
      oldNode("old-me1-v1", "ME-V1", 12, "Vectors", "Introduction to Vectors", [
        group("old-me1-v1-introduction", "V1.1", "Introduction to vectors"),
        group("old-me1-v1-operations", "V1.2", "Further operations with vectors"),
        group("old-me1-v1-projectiles", "V1.3", "Projectile motion and motion in vector form")
      ]),
      oldNode("old-me1-t3", "ME-T3", 12, "Trigonometric Functions", "Trigonometric Equations", [
        group("old-me1-t3-equations", "T3", "Trigonometric equations")
      ]),
      oldNode("old-me1-c2", "ME-C2", 12, "Calculus", "Further Calculus Skills", [
        group("old-me1-c2-derivatives", "C2.1", "Further derivatives of functions"),
        group("old-me1-c2-integration", "C2.2", "Techniques of integration")
      ]),
      oldNode("old-me1-c3", "ME-C3", 12, "Calculus", "Applications of Calculus", [
        group("old-me1-c3-polynomial-multiplicity", "C3.1", "Multiplicity of zeroes of polynomial functions"),
        group("old-me1-c3-rates", "C3.2", "Further rates of change"),
        group("old-me1-c3-areas-volumes", "C3.3", "Areas between curves and volumes of solids of revolution"),
        group("old-me1-c3-differential-equations", "C3.4", "Differential equations")
      ]),
      oldNode("old-me1-s1", "ME-S1", 12, "Statistical Analysis", "The Binomial Distribution", [
        group("old-me1-s1-binomial", "S1", "The binomial distribution")
      ])
    ]
  };

  const newSyllabus = newSyllabusBase(
    "extension-1-2024",
    "Mathematics Extension 1 11-12 Syllabus (2024)",
    "mathematics-extension-1-11-12-2024",
    [
      newNode(
        "new-me1-further-work-functions",
        "fafd6dbe16",
        "ME1-11-01",
        11,
        "Functions",
        "Further work with functions",
        [
          cg("new-me1-fwf-graphical", "cgc21de453", "Graphical relationships"),
          cg("new-me1-fwf-inverse", "cg3e17c724", "Inverse functions"),
          cg("new-me1-fwf-parametric", "cgf13af775", "Parametric form of a function or relation"),
          cg("new-me1-fwf-inequalities", "cg0514790e", "Inequalities")
        ]
      ),
      newNode("new-me1-polynomials", "fa858a6f68", "ME1-11-02", 11, "Functions", "Polynomials", [
        cg("new-me1-poly-language-graphs", "cg64af9b20", "Language and graphs of polynomials"),
        cg("new-me1-poly-remainder-factor", "cg3223a3ec", "Remainder and factor theorems"),
        cg("new-me1-poly-zeroes", "cg46ae41c0", "Sums and products of zeroes of polynomials")
      ]),
      newNode(
        "new-me1-further-trigonometry",
        "fa788a073e",
        "ME1-11-03",
        11,
        "Trigonometric functions",
        "Further trigonometry",
        [
          cg("new-me1-ft-3d", "cg4ac89d21", "Trigonometry in three dimensions"),
          cg("new-me1-ft-identities", "cg23486f04", "Further trigonometric identities"),
          cg("new-me1-ft-equations", "cg18eeba3d", "Further trigonometric equations")
        ]
      ),
      newNode(
        "new-me1-permutations-combinations",
        "fa40471150",
        "ME1-11-04",
        11,
        "Combinatorics",
        "Permutations and combinations",
        [cg("new-me1-pc-permutations-combinations", "cg12a87eb6", "Permutations and combinations")]
      ),
      newNode(
        "new-me1-binomial-theorem",
        "fa00679960",
        "ME1-11-05",
        11,
        "Combinatorics",
        "The binomial theorem",
        [cg("new-me1-bt-binomial-theorem", "cge34ebe0d", "The binomial theorem")]
      ),
      newNode(
        "new-me1-induction",
        "fa0cde2f55",
        "ME1-12-01",
        12,
        "Proof",
        "Proof by mathematical induction",
        [cg("new-me1-pmi-induction", "cgab68aa7e", "Proof by mathematical induction")]
      ),
      newNode("new-me1-vectors", "fa682e9b47", "ME1-12-02", 12, "Vectors", "Introduction to vectors", [
        cg("new-me1-vectors-notation", "cg84bc531b", "Vector representation and notation"),
        cg("new-me1-vectors-2d-3d", "cg77b61e28", "Introduction to 2D and 3D vectors"),
        cg("new-me1-vectors-operating", "cg7ca46257", "Operating with vectors"),
        cg("new-me1-vectors-further", "cg650bd7ba", "Further operations with vectors"),
        cg("new-me1-vectors-motion", "cgab92b2f3", "Motion in vector form in two dimensions"),
        cg("new-me1-vectors-projectile", "cg8d12240c", "Projectile motion")
      ]),
      newNode(
        "new-me1-inverse-trig",
        "fab9c2c5a7",
        "ME1-12-03",
        12,
        "Trigonometric functions",
        "Inverse trigonometric functions",
        [
          cg("new-me1-it-definitions", "cgcb5ea42b", "Definitions of inverse trigonometric functions"),
          cg("new-me1-it-graphs", "cgebe3ac2e", "Graphs of inverse trigonometric functions")
        ]
      ),
      newNode(
        "new-me1-calculus-skills",
        "fa8f1cef28",
        "ME1-12-04",
        12,
        "Calculus",
        "Further calculus skills",
        [
          cg("new-me1-fcs-derivatives", "cg640d76d5", "Further derivatives of functions"),
          cg("new-me1-fcs-integration", "cgf97d64ba", "Techniques of integration")
        ]
      ),
      newNode(
        "new-me1-calculus-applications",
        "faed7f98f9",
        "ME1-12-05",
        12,
        "Calculus",
        "Further applications of calculus",
        [
          cg("new-me1-fac-zeroes", "cg751d3708", "Multiplicity of zeroes of polynomial functions"),
          cg("new-me1-fac-rates", "cg045f3111", "Further rates of change"),
          cg(
            "new-me1-fac-areas-volumes",
            "cgeabf57a7",
            "Areas between curves and volumes of solids of revolution"
          ),
          cg("new-me1-fac-differential-equations", "cga4176d03", "Differential equations")
        ]
      ),
      newNode(
        "new-me1-binomial-sampling",
        "fab1724c5e",
        "ME1-12-06",
        12,
        "Statistical analysis",
        "The binomial distribution and sampling distribution of the mean",
        [
          cg("new-me1-bsd-bernoulli", "cgb5fa40e5", "Bernoulli distributions"),
          cg("new-me1-bsd-binomial", "cg09c85371", "Binomial distributions"),
          cg(
            "new-me1-bsd-sampling",
            "cg4348a208",
            "Sampling distribution of the mean and the central limit theorem"
          )
        ]
      )
    ]
  );

  return course("extension-1", "Mathematics Extension 1", oldSyllabus, newSyllabus, [
    edge(
      "map-me1-f1-further-work-functions",
      "old-me1-f1",
      "new-me1-further-work-functions",
      "equivalent",
      "high",
      "Direct focus-area match for graphical relationships, inverse functions, parametric forms and inequalities."
    ),
    edge(
      "map-me1-f2-polynomials",
      "old-me1-f2",
      "new-me1-polynomials",
      "equivalent",
      "high",
      "Direct focus-area match for polynomial language, graphs, factor/remainder theorems and roots."
    ),
    edge(
      "map-me1-f2-multiplicity",
      "old-me1-f2",
      "new-me1-calculus-applications",
      "partial",
      "medium",
      "Questions focused on multiplicity and curve behaviour may display under the 2024 Further applications of calculus zeroes group."
    ),
    edge(
      "map-me1-t1-inverse-trig",
      "old-me1-t1",
      "new-me1-inverse-trig",
      "shifted",
      "high",
      "The inverse trigonometric functions content moves from Year 11 in 2017 to Year 12 in 2024."
    ),
    edge(
      "map-me1-t2-further-trig",
      "old-me1-t2",
      "new-me1-further-trigonometry",
      "equivalent",
      "high",
      "Further trigonometric identities remain in the 2024 Further trigonometry focus area."
    ),
    edge(
      "map-me1-c1-rates",
      "old-me1-c1",
      "new-me1-calculus-applications",
      "split",
      "medium",
      "Related rates and applied rate-of-change modelling align most closely with 2024 Further applications of calculus."
    ),
    edge(
      "map-me1-c1-calculus-skills",
      "old-me1-c1",
      "new-me1-calculus-skills",
      "partial",
      "medium",
      "Routine derivative-skill questions from the 2017 Rates of Change subtopic can also display under 2024 Further calculus skills."
    ),
    edge(
      "map-me1-a1-permutations",
      "old-me1-a1",
      "new-me1-permutations-combinations",
      "split",
      "high",
      "Permutation and combination content remains a Year 11 combinatorics focus area."
    ),
    edge(
      "map-me1-a1-binomial",
      "old-me1-a1",
      "new-me1-binomial-theorem",
      "split",
      "high",
      "The 2017 binomial expansion and Pascal's triangle content is now separated as The binomial theorem."
    ),
    edge(
      "map-me1-p1-induction",
      "old-me1-p1",
      "new-me1-induction",
      "equivalent",
      "high",
      "Direct match for proof by mathematical induction."
    ),
    edge(
      "map-me1-v1-vectors",
      "old-me1-v1",
      "new-me1-vectors",
      "equivalent",
      "high",
      "Direct match for vector notation, operations, motion and projectiles."
    ),
    edge(
      "map-me1-t3-trig-equations",
      "old-me1-t3",
      "new-me1-further-trigonometry",
      "shifted",
      "medium",
      "2017 Year 12 trigonometric equations align with the 2024 Year 11 Further trigonometric equations group."
    ),
    edge(
      "map-me1-c2-calculus-skills",
      "old-me1-c2",
      "new-me1-calculus-skills",
      "equivalent",
      "high",
      "Direct match for further derivatives and integration techniques."
    ),
    edge(
      "map-me1-c3-calculus-applications",
      "old-me1-c3",
      "new-me1-calculus-applications",
      "equivalent",
      "high",
      "Direct match for multiplicity, rates, areas, volumes and differential equations."
    ),
    edge(
      "map-me1-s1-binomial-sampling",
      "old-me1-s1",
      "new-me1-binomial-sampling",
      "equivalent",
      "high",
      "The binomial distribution is retained and expanded with sampling distribution content in 2024."
    )
  ]);
}

function extension2Course() {
  const oldSyllabus = {
    id: "extension-2-2017",
    title: "Mathematics Extension 2 Stage 6 Syllabus (2017)",
    sourceUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-extension-2-stage-6-2017",
    sourceDocxUrl:
      "https://www.nsw.gov.au/sites/default/files/noindex/2025-04/mathematics-extension-2-stage-6-syllabus-2017.docx",
    implementation: {
      replacedBy: "extension-2-2024",
      replacementNotes:
        "The 2024 syllabus starts implementation for Year 12 in Term 4 2026, with the first HSC exam in 2027."
    },
    nodes: [
      oldNode("old-me2-p1", "MEX-P1", 12, "Proof", "The Nature of Proof", [
        group("old-me2-p1-proof", "P1", "The nature and language of proof")
      ]),
      oldNode("old-me2-p2", "MEX-P2", 12, "Proof", "Further Proof by Mathematical Induction", [
        group("old-me2-p2-induction", "P2", "Further proof by mathematical induction")
      ]),
      oldNode("old-me2-v1", "MEX-V1", 12, "Vectors", "Further Work with Vectors", [
        group("old-me2-v1-lines-curves", "V1.1", "Vector equations of lines and curves"),
        group("old-me2-v1-geometry", "V1.2", "Vectors and geometry")
      ]),
      oldNode("old-me2-n1", "MEX-N1", 12, "Complex Numbers", "Introduction to Complex Numbers", [
        group("old-me2-n1-arithmetic", "N1.1", "Arithmetic and algebra of complex numbers"),
        group("old-me2-n1-geometry", "N1.2", "Geometric representation of complex numbers"),
        group("old-me2-n1-forms", "N1.3", "Other representations of complex numbers")
      ]),
      oldNode("old-me2-n2", "MEX-N2", 12, "Complex Numbers", "Using Complex Numbers", [
        group("old-me2-n2-equations", "N2.1", "Solving equations with complex numbers"),
        group("old-me2-n2-geometry", "N2.2", "Geometrical implications of complex numbers")
      ]),
      oldNode("old-me2-c1", "MEX-C1", 12, "Calculus", "Further Integration", [
        group("old-me2-c1-integration", "C1", "Further integration")
      ]),
      oldNode("old-me2-m1", "MEX-M1", 12, "Mechanics", "Applications of Calculus to Mechanics", [
        group("old-me2-m1-shm", "M1.1", "Simple harmonic motion"),
        group("old-me2-m1-motion", "M1.2", "Modelling motion without resistance"),
        group("old-me2-m1-resisted", "M1.3", "Resisted motion"),
        group("old-me2-m1-projectiles", "M1.4", "Projectiles and resisted motion")
      ])
    ]
  };

  const newSyllabus = newSyllabusBase(
    "extension-2-2024",
    "Mathematics Extension 2 11-12 Syllabus (2024)",
    "mathematics-extension-2-11-12-2024",
    [
      newNode("new-me2-proof", "faabcfa8e0", "ME2-12-01", 12, "Proof", "The nature of proof", [
        cg("new-me2-proof-language", "cg6e1e01c2", "The language and notation of proof"),
        cg("new-me2-proof-illustrations", "cg8425a290", "Illustrations of proofs"),
        cg("new-me2-proof-inequalities", "cg86e714df", "Proof of inequalities"),
        cg("new-me2-proof-induction", "cg9ae9e21f", "Further proof by mathematical induction")
      ]),
      newNode("new-me2-vectors", "fa9ab552db", "ME2-12-02", 12, "Vectors", "Further work with vectors", [
        cg("new-me2-vectors-lines-curves", "cg867882dd", "Vector equations of lines and curves"),
        cg("new-me2-vectors-geometry", "cge8d2614e", "Vectors and geometry")
      ]),
      newNode(
        "new-me2-complex",
        "fa0be3067b",
        "ME2-12-03",
        12,
        "Complex numbers",
        "Introduction to complex numbers",
        [
          cg("new-me2-complex-arithmetic", "cg7bdbd83e", "Arithmetic of complex numbers"),
          cg("new-me2-complex-geometric", "cgd02072b7", "Geometric representation of complex numbers"),
          cg("new-me2-complex-equations", "cg1f68d9fe", "Solving equations with complex numbers"),
          cg("new-me2-complex-powers-roots", "cgd79bb009", "Powers and roots of complex numbers"),
          cg("new-me2-complex-regions", "cg94d7c903", "Describing lines, curves and regions")
        ]
      ),
      newNode("new-me2-integration", "fa812ef8f0", "ME2-12-04", 12, "Calculus", "Further integration", [
        cg("new-me2-integration-techniques", "cg5f95c413", "Further integration")
      ]),
      newNode(
        "new-me2-mechanics",
        "fa86b7acff",
        "ME2-12-05",
        12,
        "Mechanics",
        "Applications of calculus to mechanics",
        [
          cg("new-me2-mechanics-forces", "cg80261a3f", "Forces and further motion in a straight line"),
          cg("new-me2-mechanics-shm", "cga3f1b18e", "Simple harmonic motion"),
          cg("new-me2-mechanics-without-resistance", "cg6cca7e94", "Modelling motion without resistance"),
          cg("new-me2-mechanics-rectilinear-resisted", "cg4628511c", "Rectilinear resisted motion"),
          cg("new-me2-mechanics-vertical-resisted", "cg79a1aa69", "Vertical resisted motion"),
          cg("new-me2-mechanics-projectiles", "cg3328f458", "Projectiles and resisted motion")
        ]
      )
    ]
  );

  return course("extension-2", "Mathematics Extension 2", oldSyllabus, newSyllabus, [
    edge(
      "map-me2-p1-proof",
      "old-me2-p1",
      "new-me2-proof",
      "equivalent",
      "high",
      "Direct match for nature, notation and illustrations of proof, including inequalities."
    ),
    edge(
      "map-me2-p2-induction",
      "old-me2-p2",
      "new-me2-proof",
      "merged",
      "high",
      "Further induction is now a content group inside the 2024 The nature of proof focus area."
    ),
    edge(
      "map-me2-v1-vectors",
      "old-me2-v1",
      "new-me2-vectors",
      "equivalent",
      "high",
      "Direct match for vector equations and vector geometry."
    ),
    edge(
      "map-me2-n1-complex",
      "old-me2-n1",
      "new-me2-complex",
      "equivalent",
      "high",
      "Introductory complex-number arithmetic, geometry and representation remain in one 2024 focus area."
    ),
    edge(
      "map-me2-n2-complex",
      "old-me2-n2",
      "new-me2-complex",
      "merged",
      "high",
      "Using complex numbers is merged into the 2024 Introduction to complex numbers focus area."
    ),
    edge(
      "map-me2-c1-integration",
      "old-me2-c1",
      "new-me2-integration",
      "equivalent",
      "high",
      "Direct match for further integration techniques."
    ),
    edge(
      "map-me2-m1-mechanics",
      "old-me2-m1",
      "new-me2-mechanics",
      "equivalent",
      "high",
      "Direct match for mechanics, simple harmonic motion, resisted motion and projectiles."
    )
  ]);
}

function standardCourse() {
  const oldSyllabus = {
    id: "standard-2017",
    title: "Mathematics Standard Stage 6 Syllabus (2017)",
    sourceUrl:
      "https://www.nsw.gov.au/education-and-training/nesa/curriculum/mathematics/mathematics-standard-stage-6-2017",
    sourceDocxUrl:
      "https://www.nsw.gov.au/sites/default/files/noindex/2025-04/mathematics-standard-stage-6-2017-syllabus-word.docx",
    implementation: {
      replacedBy: "standard-2024",
      replacementNotes:
        "The 2024 syllabus starts Year 11 implementation in 2026, Year 12 implementation in Term 4 2026, with the first HSC exam in 2027."
    },
    nodes: [
      oldNode("old-ms-a1", "MS-A1", 11, "Algebra", "Formulae and Equations", [
        group("old-ms-a1-formulae", "A1", "Formulae and equations")
      ]),
      oldNode("old-ms-a2", "MS-A2", 11, "Algebra", "Linear Relationships", [
        group("old-ms-a2-linear", "A2", "Linear relationships")
      ]),
      oldNode("old-ms-m1", "MS-M1", 11, "Measurement", "Applications of Measurement", [
        group("old-ms-m1-measurement", "M1", "Applications of measurement")
      ]),
      oldNode("old-ms-m2", "MS-M2", 11, "Measurement", "Working with Time", [
        group("old-ms-m2-time", "M2", "Working with time")
      ]),
      oldNode("old-ms-f1", "MS-F1", 11, "Financial Mathematics", "Money Matters", [
        group("old-ms-f1-money", "F1", "Money matters")
      ]),
      oldNode("old-ms-s1", "MS-S1", 11, "Statistical Analysis", "Data Analysis", [
        group("old-ms-s1-data", "S1", "Data analysis")
      ]),
      oldNode("old-ms-s2", "MS-S2", 11, "Statistical Analysis", "Relative Frequency and Probability", [
        group("old-ms-s2-probability", "S2", "Relative frequency and probability")
      ]),
      oldNode("old-ms-a3", "MS-A3", 12, "Algebra", "Types of Relationships", [
        group("old-ms-a3-relationships", "A3", "Types of relationships")
      ]),
      oldNode("old-ms-m3", "MS-M3", 12, "Measurement", "Right-angled Triangles", [
        group("old-ms-m3-triangles", "M3", "Right-angled triangles")
      ]),
      oldNode("old-ms-m4", "MS-M4", 12, "Measurement", "Rates", [group("old-ms-m4-rates", "M4", "Rates")]),
      oldNode("old-ms-m5", "MS-M5", 12, "Measurement", "Scale Drawings", [
        group("old-ms-m5-scale", "M5", "Scale drawings")
      ]),
      oldNode("old-ms-f2", "MS-F2", 12, "Financial Mathematics", "Investment", [
        group("old-ms-f2-investment", "F2", "Investment")
      ]),
      oldNode("old-ms-f3", "MS-F3", 12, "Financial Mathematics", "Depreciation and Loans", [
        group("old-ms-f3-depreciation-loans", "F3", "Depreciation and loans")
      ]),
      oldNode("old-ms-s3", "MS-S3", 12, "Statistical Analysis", "Further Statistical Analysis", [
        group("old-ms-s3-further-statistics", "S3", "Further statistical analysis")
      ]),
      oldNode("old-ms-n1", "MS-N1", 12, "Networks", "Networks and Paths", [
        group("old-ms-n1-networks-paths", "N1", "Networks and paths")
      ]),
      oldNode("old-ms-a4", "MS-A4", 12, "Algebra", "Types of Relationships", [
        group("old-ms-a4-relationships", "A4", "Types of relationships")
      ]),
      oldNode("old-ms-m6", "MS-M6", 12, "Measurement", "Non-right-angled Trigonometry", [
        group("old-ms-m6-trigonometry", "M6", "Non-right-angled trigonometry")
      ]),
      oldNode("old-ms-m7", "MS-M7", 12, "Measurement", "Rates and Ratios", [
        group("old-ms-m7-rates-ratios", "M7", "Rates and ratios")
      ]),
      oldNode("old-ms-f4", "MS-F4", 12, "Financial Mathematics", "Investments and Loans", [
        group("old-ms-f4-investments-loans", "F4", "Investments and loans")
      ]),
      oldNode("old-ms-f5", "MS-F5", 12, "Financial Mathematics", "Annuities", [
        group("old-ms-f5-annuities", "F5", "Annuities")
      ]),
      oldNode("old-ms-s4", "MS-S4", 12, "Statistical Analysis", "Bivariate Data Analysis", [
        group("old-ms-s4-bivariate", "S4", "Bivariate data analysis")
      ]),
      oldNode("old-ms-s5", "MS-S5", 12, "Statistical Analysis", "The Normal Distribution", [
        group("old-ms-s5-normal", "S5", "The normal distribution")
      ]),
      oldNode("old-ms-n2", "MS-N2", 12, "Networks", "Network Concepts", [
        group("old-ms-n2-concepts", "N2", "Network concepts")
      ]),
      oldNode("old-ms-n3", "MS-N3", 12, "Networks", "Critical Path Analysis", [
        group("old-ms-n3-critical-path", "N3", "Critical path analysis")
      ])
    ]
  };

  const newSyllabus = newSyllabusBase(
    "standard-2024",
    "Mathematics Standard 11-12 Syllabus (2024)",
    "mathematics-standard-11-12-2024",
    [
      newNode(
        "new-ms-formulas-equations",
        "fa346f5353",
        "MST-11-01",
        11,
        "Algebra",
        "Formulas and equations",
        [cg("new-ms-fe-formulas", "cg40872307", "Formulas and equations")]
      ),
      newNode(
        "new-ms-linear-relationships",
        "fabe84d89c",
        "MST-11-02",
        11,
        "Algebra",
        "Linear relationships",
        [
          cg("new-ms-lr-linear-modelling", "cg93c52a35", "Linear modelling"),
          cg("new-ms-lr-direct-variation", "cg0f642d1b", "Direct variation")
        ]
      ),
      newNode(
        "new-ms-earning-money",
        "faacdf9b3d",
        "MST-11-03",
        11,
        "Financial mathematics",
        "Earning money",
        [
          cg("new-ms-em-ways", "cg63a4933e", "Ways of earning"),
          cg("new-ms-em-taxation", "cgb766c06a", "Taxation")
        ]
      ),
      newNode(
        "new-ms-managing-money",
        "fa8d2fb431",
        "MST-11-04",
        11,
        "Financial mathematics",
        "Managing money",
        [
          cg("new-ms-mm-purchasing", "cg1615fe85", "Purchasing goods"),
          cg("new-ms-mm-budgeting", "cgdacbadc7", "Budgeting")
        ]
      ),
      newNode(
        "new-ms-applications-measurement",
        "fad74ae493",
        "MST-11-05",
        11,
        "Measurement",
        "Applications of measurement",
        [
          cg("new-ms-am-practicalities", "cg5555a727", "Practicalities of measurement"),
          cg("new-ms-am-perimeter-area-volume", "cga68cc8aa", "Perimeter, area and volume")
        ]
      ),
      newNode("new-ms-time-location", "fa136ea49c", "MST-11-06", 11, "Measurement", "Time and location", [
        cg("new-ms-tl-earth", "cg5bb36359", "Positions on the Earth's surface"),
        cg("new-ms-tl-time", "cgcc3ec175", "Time and time differences")
      ]),
      newNode(
        "new-ms-networks-paths-trees",
        "fabf235394",
        "MST-11-07",
        11,
        "Networks",
        "Networks, paths and trees",
        [
          cg("new-ms-npt-concepts", "cgf7e160ad", "Network concepts"),
          cg("new-ms-npt-shortest-spanning", "cg35487678", "Shortest paths and spanning trees")
        ]
      ),
      newNode(
        "new-ms-data-analysis",
        "fa4de413b8",
        "MST-11-08",
        11,
        "Statistical analysis",
        "Data analysis",
        [
          cg("new-ms-da-investigation", "cga70dc1c8", "Statistical investigation process"),
          cg("new-ms-da-population-sample", "cgc1245735", "Population and sample"),
          cg("new-ms-da-classification", "cga6895dc1", "Data classification"),
          cg("new-ms-da-display", "cgb48df320", "Display and interpret grouped and ungrouped data"),
          cg("new-ms-da-centre-spread", "cg9286511b", "Measures of centre and spread"),
          cg("new-ms-da-quartiles", "cg462c047b", "Quartiles and interquartile range"),
          cg("new-ms-da-box-plots", "cg6e2e56e0", "Five-number summary and box plots"),
          cg("new-ms-da-outliers", "cg1efbe333", "Clusters and outliers")
        ]
      ),
      newNode(
        "new-ms-s1-algebraic-relationships",
        "fa493dfdfb",
        "MST-12-S1-01",
        12,
        "Algebra",
        "Algebraic relationships",
        [
          cg("new-ms-s1-ar-simultaneous", "cgd275ce3f", "Simultaneous linear equations"),
          cg("new-ms-s1-ar-graphs", "cge01dfd07", "Graphs of practical situations")
        ]
      ),
      newNode(
        "new-ms-s2-algebraic-relationships",
        "faf5e47f4a",
        "MST-12-S2-01",
        12,
        "Algebra",
        "Algebraic relationships",
        [
          cg("new-ms-s2-ar-simultaneous", "cg32f234b7", "Simultaneous linear equations"),
          cg("new-ms-s2-ar-exponential", "cgffefd0c3", "Exponential relationships"),
          cg("new-ms-s2-ar-quadratic", "cg3d5eb2cf", "Quadratic relationships"),
          cg("new-ms-s2-ar-reciprocal", "cgddd67825", "Reciprocal relationships")
        ]
      ),
      newNode(
        "new-ms-s1-investment",
        "faf818a3d6",
        "MST-12-S1-02",
        12,
        "Financial mathematics",
        "Investment",
        [cg("new-ms-s1-investment", "cgd287c7f4", "Investment")]
      ),
      newNode(
        "new-ms-s1-depreciation-loans",
        "fa9ea10adb",
        "MST-12-S1-03",
        12,
        "Financial mathematics",
        "Depreciation and loans",
        [
          cg("new-ms-s1-dl-depreciation", "cg5a992bb8", "Depreciation"),
          cg("new-ms-s1-dl-loans", "cge2b7be47", "Loans"),
          cg("new-ms-s1-dl-credit-cards", "cg97ebb567", "Credit cards")
        ]
      ),
      newNode(
        "new-ms-s1-right-triangles",
        "fa9c5d0bea",
        "MST-12-S1-04",
        12,
        "Measurement",
        "Right-angled triangles",
        [cg("new-ms-s1-rt-triangles", "cgeb205889", "Right-angled triangles")]
      ),
      newNode("new-ms-s1-ratios-rates", "faf13dc7b0", "MST-12-S1-05", 12, "Measurement", "Ratios and rates", [
        cg("new-ms-s1-rr-ratios", "cg04e0d86a", "Ratios"),
        cg("new-ms-s1-rr-rates", "cg24cb2e7d", "Rates")
      ]),
      newNode(
        "new-ms-s1-bivariate",
        "faf283a852",
        "MST-12-S1-06",
        12,
        "Statistical analysis",
        "Bivariate data analysis",
        [
          cg("new-ms-s1-bd-datasets", "cg4230c027", "Bivariate datasets"),
          cg("new-ms-s1-bd-scatter", "cg0ed9c1e0", "Scatter plots and lines of best fit")
        ]
      ),
      newNode(
        "new-ms-s1-relative-probability",
        "fa473a4513",
        "MST-12-S1-07",
        12,
        "Statistical analysis",
        "Relative frequency and probability",
        [cg("new-ms-s1-rfp", "cgb1b1bc1f", "Relative frequency and probability")]
      ),
      newNode(
        "new-ms-s2-investment-loans",
        "fac80cab35",
        "MST-12-S2-02",
        12,
        "Financial mathematics",
        "Investment and loans",
        [
          cg("new-ms-s2-il-investment", "cgab762358", "Investment"),
          cg("new-ms-s2-il-depreciation", "cg60ed70e6", "Depreciation"),
          cg("new-ms-s2-il-loans", "cg95b04f0d", "Loans"),
          cg("new-ms-s2-il-credit-cards", "cg944eb8d6", "Credit cards")
        ]
      ),
      newNode("new-ms-s2-annuities", "faa14f8aa3", "MST-12-S2-03", 12, "Financial mathematics", "Annuities", [
        cg("new-ms-s2-annuities", "cg034bd170", "Annuities")
      ]),
      newNode("new-ms-s2-trigonometry", "fa6dd765ae", "MST-12-S2-04", 12, "Measurement", "Trigonometry", [
        cg("new-ms-s2-trigonometry", "cgbc1736f4", "Trigonometry")
      ]),
      newNode("new-ms-s2-ratios-rates", "fa96edbda5", "MST-12-S2-05", 12, "Measurement", "Ratios and rates", [
        cg("new-ms-s2-rr-ratios", "cg9a8f007a", "Ratios"),
        cg("new-ms-s2-rr-rates", "cg897b3edb", "Rates")
      ]),
      newNode("new-ms-s2-network-flow", "fafe0a915b", "MST-12-S2-06", 12, "Networks", "Network flow", [
        cg("new-ms-s2-network-flow", "cg01b4e566", "Network flow")
      ]),
      newNode(
        "new-ms-s2-critical-path",
        "fa9c92c4c6",
        "MST-12-S2-07",
        12,
        "Networks",
        "Critical path analysis",
        [cg("new-ms-s2-cpa", "cg7c627052", "Critical path analysis")]
      ),
      newNode(
        "new-ms-s2-bivariate",
        "fadb5e412c",
        "MST-12-S2-08",
        12,
        "Statistical analysis",
        "Bivariate data analysis",
        [
          cg("new-ms-s2-bd-datasets", "cg56f0323e", "Bivariate datasets"),
          cg(
            "new-ms-s2-bd-scatter",
            "ms_s6_y12_bivariate_datasets__copy_",
            "Scatter plots and lines of best fit"
          )
        ]
      ),
      newNode(
        "new-ms-s2-relative-probability",
        "fae778ced4",
        "MST-12-S2-09",
        12,
        "Statistical analysis",
        "Relative frequency and probability",
        [cg("new-ms-s2-rfp", "cgacb1074f", "Relative frequency and probability")]
      ),
      newNode(
        "new-ms-s2-normal",
        "fa92309f60",
        "MST-12-S2-10",
        12,
        "Statistical analysis",
        "The normal distribution",
        [
          cg("new-ms-s2-normal-datasets", "cg97e7f5b9", "Normally distributed datasets"),
          cg("new-ms-s2-normal-zscores", "cg725a18b2", "Calculating z-scores"),
          cg("new-ms-s2-normal-probability", "cg0dfc35c2", "Probability using z-scores")
        ]
      )
    ]
  );

  return course("standard", "Mathematics Standard", oldSyllabus, newSyllabus, [
    edge(
      "map-ms-a1-formulas",
      "old-ms-a1",
      "new-ms-formulas-equations",
      "renamed",
      "high",
      "Formulae and Equations is renamed Formulas and equations in 2024."
    ),
    edge(
      "map-ms-a2-linear",
      "old-ms-a2",
      "new-ms-linear-relationships",
      "equivalent",
      "high",
      "Direct match for linear modelling and direct variation."
    ),
    edge(
      "map-ms-m1-measurement",
      "old-ms-m1",
      "new-ms-applications-measurement",
      "equivalent",
      "high",
      "Direct Year 11 measurement match."
    ),
    edge(
      "map-ms-m2-time",
      "old-ms-m2",
      "new-ms-time-location",
      "renamed",
      "high",
      "Working with Time is broadened to Time and location."
    ),
    edge(
      "map-ms-f1-earning",
      "old-ms-f1",
      "new-ms-earning-money",
      "split",
      "high",
      "Money Matters splits into earning and managing money in 2024."
    ),
    edge(
      "map-ms-f1-managing",
      "old-ms-f1",
      "new-ms-managing-money",
      "split",
      "high",
      "Money Matters splits into earning and managing money in 2024."
    ),
    edge(
      "map-ms-s1-data",
      "old-ms-s1",
      "new-ms-data-analysis",
      "equivalent",
      "high",
      "Direct data analysis match."
    ),
    edge(
      "map-ms-s2-standard1-probability",
      "old-ms-s2",
      "new-ms-s1-relative-probability",
      "shifted",
      "medium",
      "Relative frequency and probability moves into Year 12 Standard 1."
    ),
    edge(
      "map-ms-s2-standard2-probability",
      "old-ms-s2",
      "new-ms-s2-relative-probability",
      "shifted",
      "medium",
      "Relative frequency and probability moves into Year 12 Standard 2."
    ),
    edge(
      "map-ms-a3-s1-algebraic",
      "old-ms-a3",
      "new-ms-s1-algebraic-relationships",
      "renamed",
      "high",
      "Standard 1 Types of Relationships becomes Algebraic relationships."
    ),
    edge(
      "map-ms-m3-right-triangles",
      "old-ms-m3",
      "new-ms-s1-right-triangles",
      "equivalent",
      "high",
      "Direct match for right-angled triangles."
    ),
    edge(
      "map-ms-m4-rates",
      "old-ms-m4",
      "new-ms-s1-ratios-rates",
      "renamed",
      "high",
      "Standard 1 Rates is now grouped with ratios and rates."
    ),
    edge(
      "map-ms-m5-scale",
      "old-ms-m5",
      "new-ms-s1-ratios-rates",
      "reduced",
      "medium",
      "Scale drawing questions should be reviewed against 2024 ratios and rates because there is no like-for-like focus area."
    ),
    edge(
      "map-ms-f2-investment",
      "old-ms-f2",
      "new-ms-s1-investment",
      "equivalent",
      "high",
      "Direct Standard 1 investment match."
    ),
    edge(
      "map-ms-f3-depreciation-loans",
      "old-ms-f3",
      "new-ms-s1-depreciation-loans",
      "equivalent",
      "high",
      "Direct Standard 1 depreciation and loans match."
    ),
    edge(
      "map-ms-s3-bivariate",
      "old-ms-s3",
      "new-ms-s1-bivariate",
      "partial",
      "medium",
      "Further statistical analysis maps primarily to Standard 1 bivariate data analysis; probability questions should use the relative-frequency mapping."
    ),
    edge(
      "map-ms-s3-probability",
      "old-ms-s3",
      "new-ms-s1-relative-probability",
      "partial",
      "medium",
      "Use for Standard 1 further-statistics questions involving relative frequency or probability."
    ),
    edge(
      "map-ms-n1-networks",
      "old-ms-n1",
      "new-ms-networks-paths-trees",
      "shifted",
      "high",
      "Standard 1 networks and paths content is now introduced in Year 11 Networks, paths and trees."
    ),
    edge(
      "map-ms-a4-s2-algebraic",
      "old-ms-a4",
      "new-ms-s2-algebraic-relationships",
      "renamed",
      "high",
      "Standard 2 Types of Relationships becomes Algebraic relationships."
    ),
    edge(
      "map-ms-m6-trigonometry",
      "old-ms-m6",
      "new-ms-s2-trigonometry",
      "renamed",
      "high",
      "Non-right-angled Trigonometry is represented by the 2024 Standard 2 Trigonometry focus area."
    ),
    edge(
      "map-ms-m7-ratios-rates",
      "old-ms-m7",
      "new-ms-s2-ratios-rates",
      "equivalent",
      "high",
      "Direct Standard 2 ratios and rates match."
    ),
    edge(
      "map-ms-f4-investments-loans",
      "old-ms-f4",
      "new-ms-s2-investment-loans",
      "equivalent",
      "high",
      "Direct Standard 2 investment and loans match."
    ),
    edge(
      "map-ms-f5-annuities",
      "old-ms-f5",
      "new-ms-s2-annuities",
      "equivalent",
      "high",
      "Direct Standard 2 annuities match."
    ),
    edge(
      "map-ms-s4-bivariate",
      "old-ms-s4",
      "new-ms-s2-bivariate",
      "equivalent",
      "high",
      "Direct Standard 2 bivariate data analysis match."
    ),
    edge(
      "map-ms-s5-normal",
      "old-ms-s5",
      "new-ms-s2-normal",
      "equivalent",
      "high",
      "Direct Standard 2 normal distribution match."
    ),
    edge(
      "map-ms-n2-networks",
      "old-ms-n2",
      "new-ms-networks-paths-trees",
      "partial",
      "medium",
      "Use for foundational network-concept questions."
    ),
    edge(
      "map-ms-n2-network-flow",
      "old-ms-n2",
      "new-ms-s2-network-flow",
      "partial",
      "medium",
      "Use for network-flow questions under Standard 2."
    ),
    edge(
      "map-ms-n3-critical-path",
      "old-ms-n3",
      "new-ms-s2-critical-path",
      "equivalent",
      "high",
      "Direct Standard 2 critical path analysis match."
    )
  ]);
}

function course(id, title, oldSyllabus, newSyllabus, mappings) {
  return { id, title, oldSyllabus, newSyllabus, mappings };
}

function oldNode(id, code, year, areaOfStudy, title, contentGroups) {
  return { id, code, year, areaOfStudy, title, outcomes: [], contentGroups };
}

function newNode(id, sourceFocusAreaId, code, year, areaOfStudy, title, contentGroups) {
  const slugByPrefix = {
    "new-me1": "mathematics-extension-1-11-12-2024",
    "new-me2": "mathematics-extension-2-11-12-2024",
    "new-ms": "mathematics-standard-11-12-2024"
  };
  const slug = Object.entries(slugByPrefix).find(([prefix]) => id.startsWith(prefix))?.[1];
  return {
    id,
    sourceFocusAreaId,
    code,
    year,
    areaOfStudy,
    title,
    sourceUrl: `https://curriculum.nsw.edu.au/learning-areas/mathematics/${slug}/content/year-${year}/${sourceFocusAreaId}`,
    outcomes: [code],
    contentGroups
  };
}

function newSyllabusBase(id, title, slug, nodes) {
  return {
    id,
    title,
    overviewUrl: `https://curriculum.nsw.edu.au/learning-areas/mathematics/${slug}/overview`,
    contentUrl: `https://curriculum.nsw.edu.au/learning-areas/mathematics/${slug}/content`,
    nodes
  };
}

function group(id, code, title) {
  return { id, code, title };
}

function cg(id, sourceContentGroupId, title) {
  return { id, sourceContentGroupId, title };
}

function edge(id, oldNodeId, newNodeId, relationship, confidence, notes) {
  return {
    id,
    oldNodeId,
    newNodeId,
    relationship,
    confidence,
    oldContentGroupIds: [],
    newContentGroupIds: [],
    notes
  };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

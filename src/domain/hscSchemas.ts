import { z } from "zod";

export const QuestionStyleSchema = z.enum([
  "multiple-choice",
  "short-answer",
  "extended-response",
  "proof",
  "modelling"
]);
export type QuestionStyle = z.infer<typeof QuestionStyleSchema>;

export const AssetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["diagram", "graph", "table", "image"]),
  label: z.string().min(1),
  alt: z.string().min(1),
  path: z.string().min(1),
  sourceStatus: z.enum(["exam-derived", "demo", "pending"])
});

export const SyllabusNodeSchema = z.object({
  id: z.string().min(1),
  course: z.string().min(1),
  syllabusEra: z.string().min(1),
  code: z.string().min(1),
  topic: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  sourceUrl: z.string().url()
});

export const PaperSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  courseName: z.string().min(1),
  syllabusEra: z.string().min(1),
  examPackUrl: z.string().url(),
  paperUrl: z.string().url().optional(),
  markingGuideUrl: z.string().url().optional(),
  sourceStatus: z.enum(["source-linked", "partially-transcribed", "complete"])
});

export const SourceAssetSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["exam-paper", "marking-guide", "marking-feedback", "standards-material", "syllabus"]),
  label: z.string().min(1),
  url: z.string().url().optional(),
  status: z.enum(["linked", "pending", "not-applicable"])
});

export const SourcePackSchema = z.object({
  id: z.string().min(1),
  paperId: z.string().min(1).optional(),
  collectionId: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  courseName: z.string().min(1),
  title: z.string().min(1),
  packPageUrl: z.string().url(),
  syllabusEra: z.string().min(1),
  officialListStatus: z.enum(["listed", "expected", "retired"]),
  importStatus: z.enum(["not-started", "seeded", "in-progress", "verified"]),
  expectedQuestionCount: z.number().int().min(1).optional(),
  importedQuestionCount: z.number().int().min(0),
  assetStatus: z.enum(["none-identified", "pending-extraction", "partial", "complete"]),
  notes: z.string().min(1).optional(),
  assets: z.array(SourceAssetSchema).default([])
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  paperId: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  questionNumber: z.string().min(1),
  title: z.string().min(1),
  marks: z.number().int().min(1),
  style: QuestionStyleSchema,
  topic: z.string().min(1),
  subtopic: z.string().min(1),
  syllabusNodeIds: z.array(z.string().min(1)).min(1),
  promptLatex: z.string().min(1),
  answerLatex: z.string().min(1),
  workingLatex: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  assets: z.array(AssetSchema).default([]),
  source: z.object({
    examPackUrl: z.string().url(),
    pageRef: z.string().min(1).optional(),
    markingGuideRef: z.string().min(1).optional(),
    transcriptionStatus: z.enum(["demo", "draft", "verified"])
  })
});

export const WorkedSolutionStepSchema = z.object({
  title: z.string().min(1),
  bodyLatex: z.string().min(1)
});

export const WorkedSolutionSchema = z.object({
  questionId: z.string().min(1),
  promptVersion: z.string().min(1),
  model: z.string().min(1),
  generatedAt: z.string().datetime(),
  sourceQuestionHash: z.string().min(1),
  reviewStatus: z.enum(["generated", "reviewed", "needs-review", "rejected"]),
  needsReview: z.boolean(),
  reviewNote: z.string(),
  latencyMs: z.number().int().min(0),
  summaryLatex: z.string().min(1),
  approachLatex: z.string().min(1),
  steps: z.array(WorkedSolutionStepSchema).min(2),
  finalAnswerLatex: z.string().min(1),
  commonMistakesLatex: z.array(z.string().min(1)).default([]),
  checkLatex: z.string().min(1).optional()
});

export const WorkedSolutionsDatabaseSchema = z.object({
  meta: z.object({
    version: z.string().min(1),
    generatedAt: z.string().min(1),
    defaultModel: z.string().min(1),
    promptVersion: z.string().min(1),
    notes: z.string().min(1)
  }),
  workedSolutions: z.array(WorkedSolutionSchema)
});

export const SyllabusConversionContentGroupSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1).optional(),
  sourceContentGroupId: z.string().min(1).optional(),
  title: z.string().min(1)
});

export const SyllabusConversionNodeSchema = z.object({
  id: z.string().min(1),
  appNodeId: z.string().min(1).optional(),
  sourceFocusAreaId: z.string().min(1).optional(),
  code: z.string().min(1),
  year: z.number().int().min(11).max(12),
  areaOfStudy: z.string().min(1),
  title: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  outcomes: z.array(z.string().min(1)).default([]),
  contentGroups: z.array(SyllabusConversionContentGroupSchema).min(1)
});

export const SyllabusConversionMappingSchema = z.object({
  id: z.string().min(1),
  oldNodeId: z.string().min(1),
  newNodeId: z.string().min(1),
  relationship: z.enum([
    "equivalent",
    "renamed",
    "split",
    "merged",
    "shifted",
    "partial",
    "reduced",
    "newly-emphasised"
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  oldContentGroupIds: z.array(z.string().min(1)).default([]),
  newContentGroupIds: z.array(z.string().min(1)).default([]),
  notes: z.string().min(1)
});

export const SyllabusConversionSchema = z
  .object({
    schemaVersion: z.literal(1),
    updatedAt: z.string().min(1),
    purpose: z.string().min(1),
    sourceSummary: z.string().min(1),
    oldSyllabus: z.object({
      id: z.literal("advanced-2017"),
      title: z.string().min(1),
      sourceUrl: z.string().url(),
      sourceDocxUrl: z.string().url(),
      implementation: z.object({
        replacedBy: z.literal("advanced-2024"),
        replacementNotes: z.string().min(1)
      }),
      nodes: z.array(SyllabusConversionNodeSchema).min(1)
    }),
    newSyllabus: z.object({
      id: z.literal("advanced-2024"),
      title: z.string().min(1),
      overviewUrl: z.string().url(),
      contentUrl: z.string().url(),
      nodes: z.array(SyllabusConversionNodeSchema).min(1)
    }),
    mappings: z.array(SyllabusConversionMappingSchema).min(1),
    questionCategorisationModel: z.object({
      recommendedPrimaryKey: z.string().min(1),
      recommendedSecondaryKey: z.string().min(1),
      reviewStates: z.array(z.string().min(1)).min(1),
      guidance: z.array(z.string().min(1)).min(1)
    })
  })
  .superRefine((conversion, context) => {
    const oldNodeIds = new Set(conversion.oldSyllabus.nodes.map((node) => node.id));
    const newNodeIds = new Set(conversion.newSyllabus.nodes.map((node) => node.id));
    const contentGroupIds = new Set(
      [...conversion.oldSyllabus.nodes, ...conversion.newSyllabus.nodes].flatMap((node) =>
        node.contentGroups.map((group) => group.id)
      )
    );

    conversion.mappings.forEach((mapping, mappingIndex) => {
      if (!oldNodeIds.has(mapping.oldNodeId)) {
        context.addIssue({
          code: "custom",
          message: `Mapping ${mapping.id} references missing old node ${mapping.oldNodeId}`,
          path: ["mappings", mappingIndex, "oldNodeId"]
        });
      }

      if (!newNodeIds.has(mapping.newNodeId)) {
        context.addIssue({
          code: "custom",
          message: `Mapping ${mapping.id} references missing new node ${mapping.newNodeId}`,
          path: ["mappings", mappingIndex, "newNodeId"]
        });
      }

      mapping.oldContentGroupIds.forEach((groupId, groupIndex) => {
        if (!contentGroupIds.has(groupId)) {
          context.addIssue({
            code: "custom",
            message: `Mapping ${mapping.id} references missing old content group ${groupId}`,
            path: ["mappings", mappingIndex, "oldContentGroupIds", groupIndex]
          });
        }
      });

      mapping.newContentGroupIds.forEach((groupId, groupIndex) => {
        if (!contentGroupIds.has(groupId)) {
          context.addIssue({
            code: "custom",
            message: `Mapping ${mapping.id} references missing new content group ${groupId}`,
            path: ["mappings", mappingIndex, "newContentGroupIds", groupIndex]
          });
        }
      });
    });
  });

export const HscDatabaseSchema = z
  .object({
    meta: z.object({
      version: z.string().min(1),
      title: z.string().min(1),
      updatedAt: z.string().min(1),
      sourceSummary: z.string().min(1)
    }),
    sourceCollections: z.array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        url: z.string().url(),
        publisher: z.string().min(1),
        scope: z.string().min(1)
      })
    ),
    sourcePacks: z.array(SourcePackSchema).min(1),
    syllabus: z.array(SyllabusNodeSchema).min(1),
    papers: z.array(PaperSchema).min(1),
    questions: z.array(QuestionSchema).min(1)
  })
  .superRefine((database, context) => {
    const paperIds = new Set(database.papers.map((paper) => paper.id));
    const syllabusIds = new Set(database.syllabus.map((node) => node.id));
    const collectionIds = new Set(database.sourceCollections.map((collection) => collection.id));

    database.sourcePacks.forEach((pack, packIndex) => {
      if (!collectionIds.has(pack.collectionId)) {
        context.addIssue({
          code: "custom",
          message: `Source pack ${pack.id} references missing collection ${pack.collectionId}`,
          path: ["sourcePacks", packIndex, "collectionId"]
        });
      }

      if (pack.paperId && !paperIds.has(pack.paperId)) {
        context.addIssue({
          code: "custom",
          message: `Source pack ${pack.id} references missing paper ${pack.paperId}`,
          path: ["sourcePacks", packIndex, "paperId"]
        });
      }
    });

    database.questions.forEach((question, questionIndex) => {
      if (!paperIds.has(question.paperId)) {
        context.addIssue({
          code: "custom",
          message: `Question ${question.id} references missing paper ${question.paperId}`,
          path: ["questions", questionIndex, "paperId"]
        });
      }

      question.syllabusNodeIds.forEach((nodeId, nodeIndex) => {
        if (!syllabusIds.has(nodeId)) {
          context.addIssue({
            code: "custom",
            message: `Question ${question.id} references missing syllabus node ${nodeId}`,
            path: ["questions", questionIndex, "syllabusNodeIds", nodeIndex]
          });
        }
      });
    });
  });

export type HscDatabase = z.infer<typeof HscDatabaseSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type SyllabusNode = z.infer<typeof SyllabusNodeSchema>;
export type Paper = z.infer<typeof PaperSchema>;
export type SourcePack = z.infer<typeof SourcePackSchema>;
export type WorkedSolution = z.infer<typeof WorkedSolutionSchema>;
export type WorkedSolutionsDatabase = z.infer<typeof WorkedSolutionsDatabaseSchema>;
export type SyllabusConversion = z.infer<typeof SyllabusConversionSchema>;
export type SyllabusConversionNode = z.infer<typeof SyllabusConversionNodeSchema>;
export type SyllabusConversionMapping = z.infer<typeof SyllabusConversionMappingSchema>;

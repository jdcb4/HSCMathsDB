import { makeBoundaries, range, type ExamIngestionProfile } from "./exam-ingestion-core";

type QuestionAsset = NonNullable<
  NonNullable<ExamIngestionProfile["questionOverrides"]>[number]["assets"]
>[number];

function examDerivedAsset(
  id: string,
  type: QuestionAsset["type"],
  label: string,
  alt: string
): QuestionAsset {
  return {
    id,
    type,
    label,
    alt,
    path: `/assets/diagrams/${id}.png`,
    sourceStatus: "exam-derived"
  };
}

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
    ),
    questionOverrides: {
      3: {
        promptLatex: [
          "3 Consider the network diagram.",
          "Which vertex has degree 4?",
          "A. \\(A\\)",
          "B. \\(B\\)",
          "C. \\(C\\)",
          "D. \\(D\\)"
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q03-network-degree",
            type: "diagram",
            label: "Network diagram",
            alt: "Network with vertices A, B, C, D, E and F, used to identify the vertex with degree 4.",
            path: "/assets/diagrams/std1-2025-q03-network-degree.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      5: {
        promptLatex: [
          "5 A baker makes and sells cakes. The straight-line graphs represent cost \\(C\\) and revenue \\(R\\) in dollars, and \\(n\\) is the number of cakes.",
          "What profit will the baker make by selling 6 cakes?",
          "A. \\(\\$10\\)",
          "B. \\(\\$20\\)",
          "C. \\(\\$40\\)",
          "D. \\(\\$60\\)"
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q05-cake-cost-revenue-graph",
            type: "graph",
            label: "Cake cost and revenue graph",
            alt: "Straight-line graphs of revenue R equals 10n and cost C equals 20 plus 5n against number of cakes.",
            path: "/assets/diagrams/std1-2025-q05-cake-cost-revenue-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      6: {
        promptLatex: [
          "6 The network shows the distances, in kilometres, along a series of roads that connect towns.",
          "What is the value of the largest weighted edge included in the minimum spanning tree for this network?",
          "A. 7",
          "B. 8",
          "C. 9",
          "D. 10"
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q06-weighted-road-network",
            type: "diagram",
            label: "Weighted road network",
            alt: "Weighted network of towns with edge distances 4, 5, 5, 6, 7, 7, 8, 9 and 10 kilometres.",
            path: "/assets/diagrams/std1-2025-q06-weighted-road-network.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      7: {
        promptLatex: [
          "7 A biased die is made from this net. The die is rolled once.",
          "What is the probability of rolling a 2?",
          "A. \\(\\frac16\\)",
          "B. \\(\\frac14\\)",
          "C. \\(\\frac13\\)",
          "D. \\(\\frac12\\)"
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q07-biased-die-net",
            type: "diagram",
            label: "Biased die net",
            alt: "Net of a biased die with repeated numbered faces used to determine the probability of rolling 2.",
            path: "/assets/diagrams/std1-2025-q07-biased-die-net.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      14: {
        promptLatex: [
          "Question 14\n(5 marks) The time, in minutes, it takes to travel by road between six towns is recorded and shown in the network diagram below.",
          "(a) In this network the shortest path corresponds to the minimum travel time. What is the minimum travel time between towns \\(A\\) and \\(F\\), and what is the corresponding path?",
          "New roads are built to connect a town \\(G\\) to towns \\(A\\) and \\(D\\). The table gives the times it takes to travel by the new roads.",
          "(b) Add the new roads and times to the network diagram below.",
          "(c) Explain whether the path in part (a) is still the shortest path from \\(A\\) to \\(F\\) after the new roads are added."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Minimum travel time \\(=15+20+10+5+8=58\\) minutes. Path: \\(A\\)-\\(B\\)-\\(C\\)-\\(D\\)-\\(E\\)-\\(F\\).",
          "(b) The completed diagram connects \\(A\\) to \\(G\\) with time 8 minutes and \\(G\\) to \\(D\\) with time 22 minutes.",
          "(c) The path in part (a) is not the shortest path any more, as \\(A\\)-\\(G\\)-\\(D\\)-\\(E\\)-\\(F\\) takes 43 minutes."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q14-town-network-new-roads",
            type: "diagram",
            label: "Town network and new-road table",
            alt: "Town network with towns A to F and travel times, plus a table and blank network for adding new roads through town G.",
            path: "/assets/diagrams/std1-2025-q14-town-network-new-roads.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      15: {
        promptLatex: [
          "Question 15\n(8 marks) A researcher is using the statistical investigation process to investigate a possible relationship between average number of minutes per day a person spends watching television, and the average number of minutes per day the person spends exercising.",
          "(a) State the statistical question being posed.",
          "Participants were asked to record the number of minutes they spent watching television each day and the number of minutes they spent exercising each day. The averages for each participant were recorded and graphed, and a line of best fit was included.",
          "(b) From the graph, identify the dependent variable.",
          "(c) Describe the bivariate dataset in terms of its form and direction.",
          "(d) The points \\((0,70)\\) and \\((60,10)\\) lie on the line of best fit. By first plotting these points on the graph, find the gradient and the \\(y\\)-intercept of the line of best fit.",
          "(e) Explain why it is NOT appropriate to extrapolate the line of best fit to predict the average number of minutes of exercise per day for someone who watches an average of 2 hours of television per day."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Is there a relationship between average number of minutes per day watching television and average number of minutes per day exercising?",
          "(b) Average minutes per day exercising.",
          "(c) Form: linear. Direction: negative.",
          "(d) The gradient is \\(m=\\frac{10-70}{60-0}=-\\frac{60}{60}=-1\\). The \\(y\\)-intercept is 70.",
          "(e) The number of minutes per day exercising will be negative."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q15-tv-exercise-scatterplot",
            type: "graph",
            label: "Television and exercise scatterplot",
            alt: "Scatterplot of average minutes watching television against average minutes exercising, with a negative line of best fit.",
            path: "/assets/diagrams/std1-2025-q15-tv-exercise-scatterplot.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      19: {
        promptLatex: [
          "Question 19\n(4 marks) At the end of the 2024-2025 financial year, Alex's taxable income was \\(\\$148\\ 600\\).",
          "(a) The table shows the income tax rate for Australian residents for the 2024-2025 financial year. Using the table, calculate Alex's tax payable.",
          "(b) The Medicare levy is 2% of taxable income. Calculate the Medicare levy payable by Alex."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Tax payable \\(=31\\ 288+0.37(148\\ 600-135\\ 000)=\\$36\\ 320\\).",
          "(b) \\(2\\%\\times148\\ 600=\\$2972\\)."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q19-income-tax-table",
            type: "table",
            label: "Income tax rates table",
            alt: "Table of Australian resident income tax rates for taxable income ranges from zero dollars to over 190 thousand dollars.",
            path: "/assets/diagrams/std1-2025-q19-income-tax-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      20: {
        promptLatex: [
          "Question 20\n(7 marks) A map of a park containing a duck pond is shown.",
          "A fence is built passing through the points \\(A\\), \\(B\\) and \\(C\\) around the duck pond.",
          "(a) Using the scale provided on the map, calculate the length of the fence \\(AB\\).",
          "(b) The length of \\(AB\\) is equal to the length of \\(BC\\). Use Pythagoras' theorem to calculate the length of \\(AC\\) in metres. Give your answer correct to 3 significant figures.",
          "(c) What is the true bearing of point \\(A\\) from point \\(C\\)?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(15\\times5=75\\text{ m}\\), or \\(7.5\\times10=75\\text{ m}\\).",
          "(b) Length of \\(AC=\\sqrt{75^2+75^2}=106.066\\ldots\\), so \\(AC=106\\text{ m}\\), correct to 3 significant figures.",
          "(c) \\(\\tan\\theta=\\frac{75}{75}\\), so \\(\\theta=45^\\circ\\). The true bearing is \\(180^\\circ+(90^\\circ-45^\\circ)=225^\\circ\\)."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q20-park-map",
            type: "diagram",
            label: "Park map with fence points",
            alt: "Grid map of a park with points A, B and C around a duck pond, a north arrow, and a 10 metre scale.",
            path: "/assets/diagrams/std1-2025-q20-park-map.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      22: {
        promptLatex: [
          "Question 22\n(4 marks) An isosceles triangle is drawn inside a circle as shown. The base of the triangle is 4.8 cm long, the length of other sides is 4 cm and the height is \\(h\\) cm.",
          "(a) Calculate the height, \\(h\\), of triangle \\(ABC\\).",
          "(b) The area of triangle \\(ABC\\) is \\(7.68\\text{ cm}^2\\). The radius of the circle is 2.5 cm. Express the area of triangle \\(ABC\\) as a percentage of the area of the circle, correct to 1 decimal place."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(h^2=4^2-2.4^2=10.24\\), so \\(h=\\sqrt{10.24}=3.2\\text{ cm}\\).",
          "(b) Area of circle \\(=\\pi(2.5)^2=19.635\\ldots\\). Therefore \\(\\frac{7.68}{19.635\\ldots}\\times100\\%=39.1\\%\\)."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q22-circle-triangle",
            type: "diagram",
            label: "Triangle inside circle",
            alt: "Isosceles triangle ABC inside a circle, with equal sides 4 centimetres, base 4.8 centimetres, and height h.",
            path: "/assets/diagrams/std1-2025-q22-circle-triangle.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      26: {
        promptLatex: [
          "Question 26\n(4 marks) A scale of 1:50 is used to draw a rectangular area on a 2 mm grid as shown. The actual rectangular area is to be tiled.",
          "The tiles cost \\(\\$150\\) per square metre and the tiler orders 15% extra tiles to allow for cutting and breakage. The tiler charges \\(\\$90\\) per hour and will take 20 hours to complete the tiling.",
          "Calculate the total cost of the tiles and tiling. Give your answer to the nearest dollar."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "The drawing measures 10.4 cm by 9.6 cm. Using the scale, the actual dimensions are \\(10.4\\times50=520\\text{ cm}=5.2\\text{ m}\\) and \\(9.6\\times50=480\\text{ cm}=4.8\\text{ m}\\).",
          "Area \\(=5.2\\times4.8=24.96\\text{ m}^2\\). Total tile area required \\(=24.96+15\\%\\times24.96=28.704\\text{ m}^2\\).",
          "Tile cost \\(=150\\times28.704=\\$4305.60\\). Tiler cost \\(=90\\times20=\\$1800\\). Total cost \\(=\\$6105.60\\), so \\(\\$6106\\) to the nearest dollar."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q26-tiling-grid",
            type: "diagram",
            label: "Scale rectangular tiling grid",
            alt: "Rectangle drawn on a 2 millimetre grid using a 1 to 50 scale for a tiling cost calculation.",
            path: "/assets/diagrams/std1-2025-q26-tiling-grid.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      27: {
        promptLatex: [
          "Question 27\n(4 marks) The graph shows the salvage value of a car over 5 years.",
          "The salvage values are based on the declining-balance method.",
          "By what amount will the car's value depreciate during the 10th year?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(\\$44\\ 000=\\$55\\ 000(1-r)\\), so \\(1-r=\\frac{44\\ 000}{55\\ 000}=0.8\\) and \\(r=0.2=20\\%\\).",
          "Value after 9 years \\(=55\\ 000(1-0.2)^9=\\$7381.98\\). Value of depreciation during the 10th year \\(=7381.98\\times0.2=\\$1476.40\\)."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q27-car-salvage-graph",
            type: "graph",
            label: "Car salvage value graph",
            alt: "Graph showing a car value declining from 55 thousand dollars at year 0 to 44 thousand dollars at year 1 over a 5 year time axis.",
            path: "/assets/diagrams/std1-2025-q27-car-salvage-graph.png",
            sourceStatus: "exam-derived"
          }
        ]
      },
      28: {
        promptLatex: [
          "Question 28\n(4 marks) The table provides information about a \\(\\$2\\) coin and a \\(\\$5\\) note.",
          "(a) Calculate the mass of a \\(\\$2\\) coin in grams, correct to 1 decimal place.",
          "(b) Suppose the \\(\\$2\\) coin is to be replaced with a note that has the same mass as a \\(\\$5\\) note. What is the mass of \\(\\$1000\\) in \\(\\$2\\) notes in grams? Give your answer correct to the nearest gram."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) 500 \\(\\$2\\) coins have a mass of 3.3 kg, so the mass of one \\(\\$2\\) coin is \\(\\frac{3.3}{500}=0.0066\\text{ kg}=6.6\\text{ g}\\).",
          "(b) 200 notes have a mass of 157 g, so one note has mass \\(\\frac{157}{200}=0.785\\text{ g}\\). The mass of 500 notes is \\(0.785\\times500=392.5\\text{ g}\\), which is 393 g to the nearest gram."
        ].join("\n"),
        assets: [
          {
            id: "std1-2025-q28-coin-note-table",
            type: "table",
            label: "Coin and note mass table",
            alt: "Table comparing the number and total mass of 2 dollar coins and 5 dollar notes needed to make 1000 dollars.",
            path: "/assets/diagrams/std1-2025-q28-coin-note-table.png",
            sourceStatus: "exam-derived"
          }
        ]
      }
    }
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
    ),
    questionOverrides: {
      1: {
        promptLatex: [
          "1 Consider the network diagram.",
          "Which vertex has degree 4?",
          "A. \\(A\\)",
          "B. \\(B\\)",
          "C. \\(C\\)",
          "D. \\(D\\)"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q01-network-degree",
            "diagram",
            "Network diagram",
            "Network with vertices A, B, C, D, E and F, used to identify the vertex with degree 4."
          )
        ]
      },
      2: {
        promptLatex: [
          "2 Which graph could represent \\(y=4^x\\)?",
          "A. Graph A",
          "B. Graph B",
          "C. Graph C",
          "D. Graph D"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q02-exponential-graph-options",
            "graph",
            "Graph options for y equals 4 to the x",
            "Four graph options labelled A to D, including an increasing exponential curve, decreasing curve, decreasing line, and increasing line."
          )
        ]
      },
      3: {
        promptLatex: [
          "3 The network shows the distances, in kilometres, along a series of roads that connect towns.",
          "What is the value of the largest weighted edge included in the minimum spanning tree for this network?",
          "A. 7",
          "B. 8",
          "C. 9",
          "D. 10"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q03-weighted-road-network",
            "diagram",
            "Weighted road network",
            "Weighted network of towns with edge distances 4, 5, 5, 6, 7, 7, 8, 9 and 10 kilometres."
          )
        ]
      },
      8: {
        promptLatex: [
          "8 A spinner made up of 4 colours is spun 100 times. The frequency histogram shows the results.",
          "Which of these spinners is most likely to give the results shown?",
          "A. Spinner A",
          "B. Spinner B",
          "C. Spinner C",
          "D. Spinner D"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q08-spinner-histogram-options",
            "graph",
            "Spinner histogram and options",
            "Frequency histogram for red, white, green and yellow outcomes with four spinner options labelled A to D."
          )
        ]
      },
      17: {
        promptLatex: [
          "Question 17\n(3 marks) The scatter plot shows a bivariate dataset, where \\(x\\) is the independent variable and \\(y\\) is the dependent variable.",
          "The points \\((0,14)\\) and \\((5,4)\\) lie on the line of best fit.",
          "Plot the points \\((0,14)\\) and \\((5,4)\\) on the graph and hence find the equation of the line of best fit."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "The gradient is \\(m=\\frac{4-14}{5-0}=\\frac{-10}{5}=-2\\).",
          "Using \\(y=mx+c\\), with \\(m=-2\\) and \\(c=14\\), the equation is \\(y=-2x+14\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q17-scatterplot-line-grid",
            "graph",
            "Bivariate scatter plot",
            "Scatter plot of a bivariate dataset with x from 0 to 6 and y from 0 to 18, used to plot a line of best fit."
          )
        ]
      },
      18: {
        promptLatex: [
          "Question 18\n(2 marks) A table of future value interest factors for an annuity of \\($1\\) is shown.",
          "The prize in a lottery is an annuity of \\($5000\\) a year for 10 years, invested at 4.5% per annum compounding annually.",
          "What will be the value of the prize at the end of 10 years?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "Amount \\(=\\$5000\\times12.288=\\$61\\ 440\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q18-annuity-factor-table",
            "table",
            "Future value interest factor table",
            "Table of future value interest factors for an annuity of one dollar, with rates 1.5%, 3%, 4.5% and 6%."
          )
        ]
      },
      19: {
        promptLatex: [
          "Question 19\n(5 marks) The activities and corresponding durations in days for a project are shown in the network diagram.",
          "(a) Complete the table showing the immediate prerequisites for each activity. Indicate with an \\(\\times\\) any activities without any immediate prerequisites.",
          "(b) Find the critical path for this project AND state the minimum duration for the project.",
          "(c) The duration of activity \\(A\\) is increased by 2. Does this affect the critical path for the project? Give a reason for your answer."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) The immediate prerequisite for \\(B\\) is \\(\\times\\); for \\(E\\) it is \\(C,D\\); and for \\(F\\) it is \\(E\\).",
          "(b) The critical path is \\(B\\)-\\(D\\)-\\(E\\)-\\(F\\)-\\(H\\). Minimum duration \\(=4+5+5+7+5=26\\) days.",
          "(c) No, as the float time for activity \\(A\\) is 3 days."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q19-project-network-prerequisites",
            "diagram",
            "Project network and prerequisite table",
            "Project activity network with durations A to H, plus a table for immediate prerequisites for activities B, E and F."
          )
        ]
      },
      20: {
        promptLatex: [
          "Question 20\n(3 marks) The graph of a quadratic function represented by the equation \\(h=t^2-8t+12\\) is shown.",
          "(a) Find the values of \\(t\\) and \\(h\\) at the turning point of the graph.",
          "(b) The graph shows \\(h=12\\) when \\(t=0\\). What is the other value of \\(t\\) for which \\(h=12\\)?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(t=\\frac{2+6}{2}=4\\), and \\(h=4^2-8\\times4+12=-4\\).",
          "(b) Using the axis of symmetry, \\(t=4+4=8\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q20-quadratic-graph",
            "graph",
            "Quadratic graph",
            "Graph of h equals t squared minus 8t plus 12 with intercepts at t equals 2 and t equals 6 and h-intercept 12."
          )
        ]
      },
      22: {
        promptLatex: [
          "Question 22\n(5 marks) A network of pipes with one cut is shown. The number on each edge gives the capacity of that pipe in L/min.",
          "(a) What is the capacity of the cut shown?",
          "(b) The diagram shows a possible flow for this network of pipes.",
          "(i) What is the value of \\(x\\)? Give a reason for your answer.",
          "(ii) Which of the pipes in the flow are at full capacity?",
          "(iii) The maximum flow for this network is 50 L/min. Which path of pipes could have an increase in flow of 2 L/min to achieve the maximum flow?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Capacity \\(=26+24+12=62\\text{ L/min}\\).",
          "(b)(i) Outflow of \\(C=5+13+12=30\\). Inflow must equal outflow, so \\(x=30\\).",
          "(b)(ii) \\(DE\\), \\(CF\\), \\(DG\\), and \\(FG\\).",
          "(b)(iii) \\(A\\)-\\(C\\)-\\(E\\)-\\(G\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q22-pipe-network-cut",
            "diagram",
            "Pipe network with cut",
            "Pipe network with capacities in litres per minute and a dashed cut through edges BD, EG and CF."
          ),
          examDerivedAsset(
            "std2-2025-q22-pipe-flow-network",
            "diagram",
            "Pipe flow network",
            "Pipe network showing a possible flow with values including x, 18, 23, 5, 13, 12, 11, 15, 22, 1 and 8."
          )
        ]
      },
      23: {
        promptLatex: [
          "Question 23\n(2 marks) Company A and Company B both issue an annual dividend per share as shown in the table.",
          "Based on the dividend yield, which company would be better to invest in?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "Company A yield \\(=\\frac{4.92}{25.43}\\times100\\approx19\\%\\).",
          "Company B yield \\(=\\frac{0.45}{2.13}\\times100\\approx21\\%\\).",
          "Company B would be better to invest in."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q23-dividend-table",
            "table",
            "Dividend yield table",
            "Table showing Company A current share price 25 dollars 43 cents and annual dividend 4 dollars 92 cents, and Company B share price 2 dollars 13 cents and dividend 45 cents."
          )
        ]
      },
      26: {
        promptLatex: [
          "Question 26\n(6 marks) A toy has a curved surface on the top which has been shaded as shown. The toy has a uniform cross-section and a rectangular base.",
          "(a) Use two applications of the trapezoidal rule to find an approximate area of the cross-section of the toy.",
          "(b) The total surface area of the plastic toy is \\(1300\\text{ cm}^2\\). What is the approximate area of the curved surface?",
          "(c) The measurements shown on the diagram are given to the nearest millimetre. What is the percentage error of the measurement of 10.2 cm? Give your answer correct to 3 significant figures."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(A\\approx\\frac{5.1}{2}(6+3.8)+\\frac{5.1}{2}(3.8+0)\\approx34.68\\text{ cm}^2\\).",
          "(b) \\(1300=(2\\times34.68)+(10.2\\times40)+(6\\times40)+\\text{curved surface}\\). Therefore the curved surface area is \\(1300-717.36=582.64\\text{ cm}^2\\).",
          "(c) Absolute error \\(=\\frac12\\times0.1\\text{ cm}=0.05\\text{ cm}\\). Percentage error \\(=\\frac{0.05}{10.2}\\times100\\%=0.4901\\ldots\\%=0.490\\%\\), to 3 significant figures."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q26-toy-curved-surface",
            "diagram",
            "Toy with curved surface",
            "Diagram of a toy with shaded curved top surface, uniform cross-section and dimensions 10.2 cm, 40.0 cm, 6.0 cm and 3.8 cm."
          )
        ]
      },
      28: {
        promptLatex: [
          "Question 28\n(3 marks) The heights of students in a class were recorded.",
          "The results for this class are displayed in the cumulative frequency graph shown.",
          "The shortest student in this class is 130 cm and the tallest student is 180 cm.",
          "Construct a box-plot for this class in the space below."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "From the graph the five-number summary is: minimum 130, \\(Q_1=135\\), median 140, \\(Q_3=160\\), maximum 180."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q28-cumulative-frequency-boxplot",
            "graph",
            "Cumulative frequency graph and box-plot axis",
            "Cumulative frequency graph of student heights and a blank box-plot axis from 130 cm to 180 cm."
          )
        ]
      },
      31: {
        promptLatex: [
          "Question 31\n(3 marks) The table shows the income tax rate for Australian residents for the 2024-2025 financial year.",
          "At the end of the 2024-2025 financial year, Alex's tax payable was \\(\\$47\\ 420\\), excluding the Medicare levy.",
          "What was Alex's taxable income?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(\\$47\\ 420=\\$31\\ 288+0.37(\\text{taxable income}-\\$135\\ 000)\\).",
          "\\(\\$16\\ 132=0.37(\\text{taxable income}-\\$135\\ 000)\\), so \\(\\$43\\ 600=\\text{taxable income}-\\$135\\ 000\\).",
          "Taxable income \\(=\\$43\\ 600+\\$135\\ 000=\\$178\\ 600\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q31-income-tax-table",
            "table",
            "Income tax rates table",
            "Table of Australian resident income tax rates for taxable income ranges from zero dollars to over 190 thousand dollars."
          )
        ]
      },
      32: {
        promptLatex: [
          "Question 32\n(3 marks) Solid spheres are placed inside a square-based pyramid as shown.",
          "The base of the pyramid has side lengths of 14 cm. The height of the pyramid is \\(h\\) cm. The radius of each sphere is 1.5 cm.",
          "The amount of empty space remaining inside the pyramid after 30 spheres have been placed inside the pyramid is \\(634\\text{ cm}^3\\).",
          "What is the height, \\(h\\), of the pyramid? Give your answer correct to the nearest centimetre."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "Volume of 30 spheres \\(=\\frac43\\pi(1.5)^3\\times30=424.115\\ldots\\).",
          "Volume of pyramid \\(=424.115\\ldots+634=1058.115\\ldots\\).",
          "\\(1058.115\\ldots=\\frac13(14\\times14)h\\), so \\(h=\\frac{1058.115\\ldots\\times3}{14\\times14}\\approx16.2\\text{ cm}\\).",
          "Therefore \\(h=16\\text{ cm}\\), to the nearest centimetre."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q32-pyramid-spheres",
            "diagram",
            "Square-based pyramid with spheres",
            "Square-based pyramid with four visible spheres, base dimensions 14 cm by 14 cm, and height h cm."
          )
        ]
      },
      34: {
        promptLatex: [
          "Question 34\n(3 marks) The table shows future value interest factors for an annuity of \\($1\\).",
          "Lin invests a lump sum of \\(\\$21\\ 000\\) for 7 years at an interest rate of 6% per annum, compounding monthly.",
          "Yemi wants to achieve the same future value as Lin by using an annuity. Yemi plans to deposit a fixed amount into an investment account at the end of each month for 7 years. The investment account pays 6% per annum, compounding monthly.",
          "Using the table provided, determine how much Yemi needs to deposit each month."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(n=7\\times12=84\\) periods and \\(r=\\frac{6\\%}{12}\\).",
          "Lin's future value is \\(21\\ 000\\left(1+\\frac{6\\%}{12}\\right)^{84}=\\$31\\ 927.76\\).",
          "Monthly deposit \\(=\\$31\\ 927.76\\div104.07393=\\$306.78\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q34-future-value-table",
            "table",
            "Future value interest factor table",
            "Table of future value interest factors for an annuity of one dollar, with periods 7, 28, 56 and 84 and rates from 0.005 to 0.06."
          )
        ]
      },
      35: {
        promptLatex: [
          "Question 35\n(3 marks) The triangle \\(PTA\\) is shown. The length of \\(PA\\) is 75 m and the length of \\(PT\\) is 51 m.",
          "The angle of depression from \\(T\\) to \\(A\\) is \\(36^\\circ\\), and the angle \\(PTA\\) is obtuse.",
          "Find the length of \\(TA\\). Give your answer correct to 2 decimal places."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(\\angle PTA=\\theta\\). Using the sine rule, \\(\\frac{\\sin\\theta}{75}=\\frac{\\sin36^\\circ}{51}\\), so \\(\\theta=59.81\\ldots^\\circ\\).",
          "Since \\(\\angle PTA\\) is obtuse, \\(\\angle PTA=180^\\circ-60^\\circ=120^\\circ\\).",
          "\\(\\angle TPA=180^\\circ-120^\\circ-36^\\circ=24^\\circ\\).",
          "\\(\\frac{TA}{\\sin24^\\circ}=\\frac{51}{\\sin36^\\circ}\\), so \\(TA=\\frac{51\\sin24^\\circ}{\\sin36^\\circ}\\approx35.29\\text{ m}\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q35-triangle-pta",
            "diagram",
            "Triangle PTA",
            "Triangle PTA with PA equal to 75 metres, PT equal to 51 metres, a vertical height from T, and not-to-scale label."
          )
        ]
      },
      36: {
        promptLatex: [
          "Question 36\n(4 marks) The graph shows the salvage value of a car over 5 years.",
          "The salvage values are based on the declining-balance method.",
          "By what amount will the car's value depreciate during the 10th year?"
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "\\(\\$44\\ 000=\\$55\\ 000(1-r)\\), so \\(1-r=\\frac{44\\ 000}{55\\ 000}=0.8\\) and \\(r=0.2=20\\%\\).",
          "Value after 9 years \\(=55\\ 000(1-0.2)^9=\\$7381.98\\).",
          "Value of depreciation during the 10th year \\(=7381.98\\times0.2=\\$1476.40\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q36-car-salvage-graph",
            "graph",
            "Car salvage value graph",
            "Graph showing a car value declining from 55 thousand dollars at year 0 to about 18 thousand dollars at year 5."
          )
        ]
      },
      37: {
        promptLatex: [
          "Question 37\n(4 marks) The diagram shows a park consisting of two equilateral triangles. The shaded triangle is a grassed section. All measurements on the diagram are in metres.",
          "How long will it take to mow the grassed section if it takes 5 minutes to mow \\(20\\text{ m}^2\\)? Give your answer to the nearest minute."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "Using the cosine rule with included angle \\(60^\\circ\\), \\(c^2=9^2+3^2-2\\times9\\times3\\cos60^\\circ\\), so \\(c\\approx7.937\\).",
          "Area of the grassed section \\(=\\frac12\\times7.937\\times7.937\\times\\sin60^\\circ=27.2798\\ldots\\text{ m}^2\\).",
          "Time \\(=\\frac{5}{20}\\times27.2798\\ldots=6.81\\ldots\\) minutes, which is approximately 7 minutes."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q37-park-triangles",
            "diagram",
            "Park with equilateral triangles",
            "Diagram of two equilateral triangles with a shaded inner grassed triangle and side lengths 3 and 9 metres."
          )
        ]
      },
      38: {
        promptLatex: [
          "Question 38\n(3 marks) A car's fuel efficiency is 30 miles per US gallon.",
          "Use the conversion information shown.",
          "Calculate the car's fuel efficiency in litres per 100 km, correct to 1 decimal place."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "1 US gallon \\(=3.8\\text{ L}\\) and 30 miles \\(=30\\times1.6=48\\text{ km}\\).",
          "Fuel efficiency \\(=\\frac{3.8\\text{ L}}{48\\text{ km}}\\times100=7.916\\ldots\\text{ L}/100\\text{ km}\\), so \\(7.9\\text{ L}/100\\text{ km}\\), correct to 1 decimal place."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q38-conversion-table",
            "table",
            "Fuel efficiency conversion information",
            "Boxed conversion information stating one US gallon equals 3.8 litres and one mile equals 1.6 kilometres, both correct to 2 significant figures."
          )
        ]
      },
      39: {
        promptLatex: [
          "Question 39\n(3 marks) After a dose of a medication, the amount of the medication remaining in a person can be modelled by the equation \\(y=ka^x\\), where \\(x\\) is the number of hours after taking the dose, and \\(y\\) is the amount remaining in milligrams (mg).",
          "The graph shows the amount of the medication remaining in a person after \\(x\\) hours. Two points are also shown on the graph.",
          "Using the information provided, find the amount of medication that remains in a person when \\(x=4\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "At \\(x=0\\), \\(y=15\\), so \\(k=15\\).",
          "When \\(x=2\\), \\(y=9\\). Hence \\(9=15a^2\\), so \\(a^2=\\frac{9}{15}=0.6\\) and \\(a=0.7746\\ldots\\).",
          "When \\(x=4\\), \\(y=15(0.7746\\ldots)^4=5.4\\text{ mg}\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "std2-2025-q39-medication-graph",
            "graph",
            "Medication remaining graph",
            "Exponential decay graph of medication remaining in a person, with points at 15 mg when x equals 0 and 9 mg when x equals 2."
          )
        ]
      }
    }
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
    ),
    questionOverrides: {
      1: {
        promptLatex: [
          "1 What is the solution to \\(|2x+3|<5\\)?",
          "A. \\(-4<x<1\\)",
          "B. \\(x<-4\\) or \\(x>1\\)",
          "C. \\(-1<x<4\\)",
          "D. \\(x<-1\\) or \\(x>4\\)"
        ].join("\n")
      },
      2: {
        promptLatex: [
          "2 The projection of \\(\\mathbf{u}\\) onto \\(\\mathbf{v}\\) is given by \\(\\left(\\frac{\\mathbf{u}\\cdot\\mathbf{v}}{|\\mathbf{v}|^2}\\right)\\mathbf{v}\\).",
          "What is the projection of \\(\\mathbf{u}=\\mathbf{i}+2\\mathbf{j}\\) onto \\(\\mathbf{v}=2\\mathbf{i}-3\\mathbf{j}\\)?",
          "A. \\(-\\frac45(\\mathbf{i}+2\\mathbf{j})\\)",
          "B. \\(-\\frac4{13}(2\\mathbf{i}-3\\mathbf{j})\\)",
          "C. \\(-\\frac4{\\sqrt5}(\\mathbf{i}+2\\mathbf{j})\\)",
          "D. \\(-\\frac4{\\sqrt{13}}(2\\mathbf{i}-3\\mathbf{j})\\)"
        ].join("\n")
      },
      3: {
        promptLatex: [
          "3 Consider the integral \\(\\int_{-5/2}^{5/2}\\left(\\frac{1}{25-x^2}\\right)\\,dx\\).",
          "The substitution \\(x=5\\sin\\theta\\) is applied.",
          "Which of the following is obtained?",
          "A. \\(\\frac15\\int_{-\\pi/6}^{\\pi/6}\\cosec\\theta\\,d\\theta\\)",
          "B. \\(\\frac15\\int_{-\\pi/6}^{\\pi/6}\\sec\\theta\\,d\\theta\\)",
          "C. \\(\\frac1{25}\\int_{-\\pi/6}^{\\pi/6}\\cosec^2\\theta\\,d\\theta\\)",
          "D. \\(\\frac1{25}\\int_{-\\pi/6}^{\\pi/6}\\sec^2\\theta\\,d\\theta\\)"
        ].join("\n")
      },
      4: {
        promptLatex: [
          "4 A Bernoulli random variable \\(X\\) has probability distribution \\(P(x)=\\frac{x+1}{3}\\) for \\(x=0,1\\).",
          "What are the mean and variance of \\(X\\)?",
          "A. \\(E(X)=\\frac13,\\ \\operatorname{Var}(X)=\\frac29\\)",
          "B. \\(E(X)=\\frac13,\\ \\operatorname{Var}(X)=\\frac23\\)",
          "C. \\(E(X)=\\frac23,\\ \\operatorname{Var}(X)=\\frac29\\)",
          "D. \\(E(X)=\\frac23,\\ \\operatorname{Var}(X)=\\frac23\\)"
        ].join("\n")
      },
      5: {
        promptLatex: [
          "5 How many distinct solutions are there to the equation \\(\\cos5x+\\sin x=0\\) for \\(0\\leq x\\leq2\\pi\\)?",
          "A. 5",
          "B. 6",
          "C. 9",
          "D. 10"
        ].join("\n")
      },
      6: {
        promptLatex: [
          "6 Given that \\(a\\) is a non-zero constant, which of the following integrals is equal to zero?",
          "A. \\(\\int_{-a}^{a}x\\cos^{-1}(x)\\,dx\\)",
          "B. \\(\\int_{-a}^{a}x^2\\cos^{-1}(x)\\,dx\\)",
          "C. \\(\\int_{-a}^{a}x\\tan^{-1}(x)\\,dx\\)",
          "D. \\(\\int_{-a}^{a}x^2\\tan^{-1}(x)\\,dx\\)"
        ].join("\n")
      },
      7: {
        promptLatex: [
          "7 A slope field is shown.",
          "Which of the following could be the differential equation represented by the slope field?",
          "A. \\(\\frac{dy}{dx}=x^2\\)",
          "B. \\(\\frac{dy}{dx}=x^2+C,\\ C\\neq0\\)",
          "C. \\(\\frac{dy}{dx}=x^3\\)",
          "D. \\(\\frac{dy}{dx}=x^3+C,\\ C\\neq0\\)"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext1-2025-q07-slope-field",
            "graph",
            "Slope field",
            "Slope field with non-negative slopes that flatten near the y-axis and steepen as absolute x increases."
          )
        ]
      },
      8: {
        promptLatex: [
          "8 Points \\(A\\) and \\(B\\) have non-zero, non-parallel position vectors \\(\\mathbf{a}\\) and \\(\\mathbf{b}\\) respectively.",
          "Point \\(C\\) has position vector \\(\\mathbf{c}=3\\mathbf{a}-2\\mathbf{b}\\).",
          "The points \\(A\\), \\(B\\) and \\(C\\) lie on the same line. Which of the following must be true?",
          "A. Point \\(A\\) always lies between Points \\(B\\) and \\(C\\)",
          "B. Point \\(B\\) always lies between Points \\(A\\) and \\(C\\)",
          "C. Point \\(C\\) always lies between Points \\(A\\) and \\(B\\)",
          "D. The order of the points cannot be determined."
        ].join("\n")
      },
      9: {
        promptLatex: [
          "9 The vectors \\(\\mathbf{a}\\), \\(\\mathbf{b}\\) and \\(\\mathbf{c}\\) have magnitudes 3, 5 and 7 respectively.",
          "Given that \\(\\mathbf{a}+\\mathbf{b}+\\mathbf{c}=\\mathbf{0}\\), what is the size of angle \\(\\theta\\) between \\(\\mathbf{a}\\) and \\(\\mathbf{b}\\)?",
          "A. \\(\\frac{\\pi}{6}\\)",
          "B. \\(\\frac{\\pi}{3}\\)",
          "C. \\(\\frac{2\\pi}{3}\\)",
          "D. \\(\\frac{5\\pi}{6}\\)"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext1-2025-q09-vector-angle-diagram",
            "diagram",
            "Vector angle diagram",
            "Diagram of three vectors a, b and c meeting at a point, with angle theta between vectors a and b, marked not to scale."
          )
        ]
      },
      10: {
        promptLatex: [
          "10 For the function \\(f(x)\\), it is known that \\(f(3)=1\\), \\(f'(3)=2\\) and \\(f''(3)=4\\).",
          "Let \\(g(x)=f^{-1}(x)\\).",
          "What is the value of \\(g''(1)\\)?",
          "A. \\(\\frac14\\)",
          "B. \\(-\\frac14\\)",
          "C. \\(-\\frac12\\)",
          "D. \\(-1\\)"
        ].join("\n")
      },
      11: {
        promptLatex: [
          "Question 11 (15 marks) Use the Question 11 Writing Booklet",
          "(a) Find the inverse function, \\(f^{-1}(x)\\), of the function \\(f(x)=1-\\frac{1}{x-2}\\).",
          "(b) Solve \\(\\sin2\\theta-\\sin\\theta=0\\) for \\(0\\leq\\theta\\leq\\pi\\).",
          "(c) Find \\(\\int\\sin3x\\cos x\\,dx\\).",
          "(d) Sketch the graph of \\(y=\\frac13\\cos^{-1}(2x)\\).",
          "(e) For what value of \\(m\\) is the vector \\(\\begin{pmatrix}1\\\\m\\end{pmatrix}\\) parallel to the vector \\(\\begin{pmatrix}2\\\\6\\end{pmatrix}\\)?",
          "(f) The roots of \\(2x^3+6x^2+x-1=0\\) are \\(\\alpha\\), \\(\\beta\\) and \\(\\gamma\\). What is the value of \\(\\frac{1}{\\alpha\\beta}+\\frac{1}{\\alpha\\gamma}+\\frac{1}{\\beta\\gamma}\\)?",
          "(g) Evaluate \\(\\int_{\\pi/6}^{\\pi/3}\\cos^2(3x)\\,dx\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(f^{-1}(x)=2-\\frac{1}{x-1}\\).",
          "(b) \\(\\sin\\theta(2\\cos\\theta-1)=0\\), so \\(\\theta=0,\\frac{\\pi}{3},\\pi\\).",
          "(c) \\(\\int\\sin3x\\cos x\\,dx=-\\frac18\\cos4x-\\frac14\\cos2x+C\\).",
          "(d) Correct graph with domain \\([-\\frac12,\\frac12]\\) and range \\([0,\\frac{\\pi}{3}]\\).",
          "(e) \\(m=3\\).",
          "(f) \\(\\frac{1}{\\alpha\\beta}+\\frac{1}{\\alpha\\gamma}+\\frac{1}{\\beta\\gamma}=\\frac{\\alpha+\\beta+\\gamma}{\\alpha\\beta\\gamma}=-6\\).",
          "(g) \\(\\int_{\\pi/6}^{\\pi/3}\\cos^2(3x)\\,dx=\\frac{\\pi}{12}\\)."
        ].join("\n")
      },
      12: {
        promptLatex: [
          "Question 12 (14 marks) Use the Question 12 Writing Booklet",
          "(a) The radius, \\(r\\) cm, and angle, \\(\\theta\\) radians, of a sector vary in such a way that its area remains a constant \\(10\\ \\mathrm{cm^2}\\). The angle \\(\\theta\\) is increasing at a constant rate of 2 radians per second. Find the rate at which the radius is changing when the radius is 4 cm.",
          "(b) Consider the region bounded by the hyperbola \\(y=\\frac1x\\), the \\(y\\)-axis and the lines \\(y=1\\) and \\(y=a\\) for \\(a>1\\). Find the volume of the solid of revolution formed when the region is rotated about the \\(y\\)-axis.",
          "(c) Prove by mathematical induction that \\(1\\times(1!)+2\\times(2!)+\\cdots+n\\times(n!)=(n+1)!-1\\) for integers \\(n\\geq1\\).",
          "(d) Find the solution of \\(\\frac{dy}{dx}=\\sqrt{(2-y)(2+y)}\\), given that \\(y=1\\) when \\(x=0\\).",
          "(e) (i) Express \\(\\sqrt3\\sin x-\\cos x\\) in the form \\(2\\sin(x-\\alpha)\\), where \\(0<\\alpha<\\frac{\\pi}{2}\\).",
          "(ii) Hence, or otherwise, solve \\(\\sqrt3\\sin x=\\cos x+1\\), where \\(0\\leq x\\leq2\\pi\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Since \\(\\frac12r^2\\theta=10\\), \\(\\frac{dr}{dt}=-\\frac{r^3}{20}\\). When \\(r=4\\), \\(\\frac{dr}{dt}=-\\frac{16}{5}\\ \\mathrm{cm\\ s^{-1}}\\).",
          "(b) \\(V=\\pi\\int_1^a\\frac{1}{y^2}\\,dy=\\pi\\left(1-\\frac1a\\right)\\).",
          "(c) The base case \\(n=1\\) is true. Assuming the result for \\(n=k\\), adding \\((k+1)(k+1)!\\) gives \\((k+2)!-1\\), so the result holds by induction.",
          "(d) \\(x=\\sin^{-1}\\left(\\frac{y}{2}\\right)-\\frac{\\pi}{6}\\), equivalently \\(y=2\\sin\\left(x+\\frac{\\pi}{6}\\right)\\).",
          "(e) (i) \\(\\sqrt3\\sin x-\\cos x=2\\sin\\left(x-\\frac{\\pi}{6}\\right)\\). (ii) \\(x=\\frac{\\pi}{3}\\) or \\(x=\\pi\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext1-2025-q12-sector-area",
            "diagram",
            "Sector with fixed area",
            "Circular sector labelled with radius r, angle theta, and area equal to 10 square centimetres."
          )
        ]
      },
      13: {
        promptLatex: [
          "Question 13 (16 marks) Use the Question 13 Writing Booklet",
          "(a) It is given that \\(\\frac{dy}{dx}=\\frac5y\\) and \\(y=-4\\) when \\(x=0\\). Find \\(y\\) as a function of \\(x\\).",
          "(b) Eight guests are to be seated at a round table. If two of these guests refuse to sit next to each other, how many seating arrangements are possible?",
          "(c) At time \\(t\\), a particle has position vector \\(\\mathbf{r}(t)=t\\mathbf{i}+\\frac{t^2}{9}\\mathbf{j}\\), velocity vector \\(\\mathbf{v}(t)\\) and acceleration vector \\(\\mathbf{a}(t)\\). Find the time when the angle between \\(\\mathbf{v}(t)\\) and \\(\\mathbf{a}(t)\\) is \\(\\frac{\\pi}{4}\\).",
          "(d) A bag contains counters, some of which are green. One hundred trials of an experiment are run. In each trial, one counter is selected from the bag at random and its colour noted. The counter is returned to the bag after each trial. Let \\(X\\) be the random variable representing the number of times that a green counter is selected. Given that \\(E(X)=20\\) and \\(P(X\\geq k)=0.0668\\), find the value of \\(k\\). You may use the standard normal approximation and the information on page 13.",
          "(e) (i) The Pascal's triangle relation can be expressed as \\(\\binom{n}{r}=\\binom{n-1}{r-1}+\\binom{n-1}{r}\\). Do NOT prove this. Show that \\(\\binom{m}{R}=\\binom{m+1}{R+1}-\\binom{m}{R+1}\\).",
          "(ii) Hence, or otherwise, prove that \\(\\binom{2000}{2000}+\\binom{2001}{2000}+\\binom{2002}{2000}+\\cdots+\\binom{2050}{2000}=\\binom{2051}{2001}\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(y=-\\sqrt{10x+16}\\).",
          "(b) Unrestricted arrangements: \\(7!\\). Arrangements with the two guests together: \\(6!\\times2\\). Hence the answer is \\(3600\\).",
          "(c) \\(\\mathbf{v}(t)=\\mathbf{i}+\\frac{2t}{9}\\mathbf{j}\\) and \\(\\mathbf{a}(t)=\\frac29\\mathbf{j}\\). Equating scalar-product expressions gives \\(t=\\frac92\\).",
          "(d) With \\(X\\sim\\operatorname{Bin}(100,0.2)\\), use \\(Z=\\frac{X-20}{4}\\). Since \\(P(X\\geq k)=0.0668\\), \\(k=26\\).",
          "(e) (i) Rearranging Pascal's relation with \\(r=R+1\\) and \\(n=m+1\\) gives the result. (ii) Applying the identity telescopes the sum to \\(\\binom{2051}{2001}\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext1-2025-q13-normal-table",
            "table",
            "Standard normal distribution table",
            "Table of values for P(Z less than or equal to z) for the standard normal distribution, with z values from 0.0 to 3.2."
          )
        ]
      },
      14: {
        promptLatex: [
          "Question 14 (15 marks) Use the Question 14 Writing Booklet",
          "(a) Prove that the product of any seven distinct factors of 60 must be a multiple of 60.",
          "(b) Points \\(A\\) and \\(B\\) lie vertically above the origin. Point \\(A\\) is higher than point \\(B\\) such that \\(\\frac{OA}{OB}=k\\), where \\(k>1\\). A particle is projected horizontally from point \\(A\\) with velocity \\(U\\ \\mathrm{m\\ s^{-1}}\\). After \\(T\\) seconds, another particle is projected horizontally from point \\(B\\) with velocity \\(V\\ \\mathrm{m\\ s^{-1}}\\). The two particles land on the ground in the same place. Show that the ratio \\(\\frac{V}{U}\\) depends only on \\(k\\).",
          "(c) The hands of an analogue clock are \\(OA\\) and \\(OB\\), where \\(A\\) is \\(\\left(\\sin\\frac{\\pi t}{360},\\cos\\frac{\\pi t}{360}\\right)\\), \\(B\\) is \\(\\left(2\\sin\\frac{\\pi t}{30},2\\cos\\frac{\\pi t}{30}\\right)\\), \\(O\\) is the origin, and \\(t\\geq0\\) is the number of minutes past midnight. Find the values of \\(t\\) when the hands are perpendicular for the first and second time after midnight. Give your answers to 3 decimal places.",
          "(d) The function \\(f(x)\\) is defined by \\(f(x)=\\cos^{-1}(\\sin x)\\) in the domain \\((0,\\pi)\\). Find \\(f'(x)\\) for those values of \\(x\\) where it is defined.",
          "(e) It is given that \\(\\tan\\alpha\\), \\(\\tan\\beta\\) and \\(\\tan\\gamma\\) are the three real roots of the polynomial equation \\(x^3+bx^2+cx-1+b+c=0\\), where \\(b\\) and \\(c\\) are real numbers and \\(c\\neq1\\). Find the smallest positive value of \\(\\alpha+\\beta+\\gamma\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Pair the factors into six buckets whose products are 60; choosing seven distinct factors forces two from one bucket, so the product is a multiple of 60.",
          "(b) Let \\(OB=h\\) and \\(OA=kh\\). If the first particle has flight time \\(t\\), then \\(t^2=k(t-T)^2\\), and \\(Ut=V(t-T)\\). Hence \\(\\frac{V}{U}=\\sqrt{k}\\).",
          "(c) The perpendicular condition reduces to \\(\\cos\\left(\\frac{11\\pi t}{360}\\right)=0\\). The first two times are \\(t\\approx16.364\\) and \\(t\\approx49.091\\) minutes.",
          "(d) \\(f'(x)=-1\\) for \\(0<x<\\frac{\\pi}{2}\\), \\(f'(x)=1\\) for \\(\\frac{\\pi}{2}<x<\\pi\\), and \\(f'(x)\\) is undefined at \\(x=\\frac{\\pi}{2}\\).",
          "(e) Using the tangent addition formula and the root relations gives \\(\\tan(\\alpha+\\beta+\\gamma)=-1\\). The smallest positive value is \\(\\frac{3\\pi}{4}\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext1-2025-q14-projectile-diagram",
            "diagram",
            "Two horizontal projectiles",
            "Coordinate diagram with points A and B on the y-axis, horizontal launch velocities U and V, and dashed projectile paths landing at the same point on the x-axis."
          )
        ]
      }
    }
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
      1: {
        promptLatex: [
          "1 Points \\(A\\) and \\(B\\) are \\((-3,1)\\) and \\((1,4)\\) respectively.",
          "Which of the following is a vector equation of the line \\(AB\\) with parameter \\(\\lambda\\)?",
          "A. \\(\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}1\\\\4\\end{pmatrix}+\\lambda\\begin{pmatrix}3\\\\4\\end{pmatrix}\\)",
          "B. \\(\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}3\\\\4\\end{pmatrix}+\\lambda\\begin{pmatrix}1\\\\4\\end{pmatrix}\\)",
          "C. \\(\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}4\\\\3\\end{pmatrix}+\\lambda\\begin{pmatrix}-3\\\\1\\end{pmatrix}\\)",
          "D. \\(\\begin{pmatrix}x\\\\y\\end{pmatrix}=\\begin{pmatrix}-3\\\\1\\end{pmatrix}+\\lambda\\begin{pmatrix}4\\\\3\\end{pmatrix}\\)"
        ].join("\n")
      },
      2: {
        promptLatex: [
          "2 Consider the statement: \\(\\exists x\\in\\mathbb{Z}\\), such that \\(x^2\\) is odd.",
          "Which of the following is the negation of the statement?",
          "A. \\(\\forall x\\in\\mathbb{Z}\\), \\(x^2\\) is odd",
          "B. \\(\\forall x\\in\\mathbb{Z}\\), \\(x^2\\) is even",
          "C. \\(x^2\\) is even \\(\\Rightarrow x\\in\\mathbb{Z}\\)",
          "D. \\(\\exists x\\in\\mathbb{Z}\\), such that \\(x^2\\) is even"
        ].join("\n")
      },
      3: {
        promptLatex: [
          "3 What are the square roots of \\(3-4i\\)?",
          "A. \\(1-2i\\) and \\(-1+2i\\)",
          "B. \\(1+2i\\) and \\(-1-2i\\)",
          "C. \\(2-i\\) and \\(-2+i\\)",
          "D. \\(-2-i\\) and \\(2+i\\)"
        ].join("\n")
      },
      4: {
        promptLatex: [
          "4 A particle in simple harmonic motion has speed \\(v\\ \\mathrm{m\\ s^{-1}}\\), given by \\(v^2=-x^2+2x+8\\), where \\(x\\) is the displacement from the origin in metres.",
          "What is the amplitude of the motion?",
          "A. 1 m",
          "B. 3 m",
          "C. 6 m",
          "D. 9 m"
        ].join("\n")
      },
      5: {
        promptLatex: [
          "5 Consider the statement: If \\(x^2-2x\\geq0\\), then \\(x\\leq0\\).",
          "Which of the following is the contrapositive of the statement?",
          "A. If \\(x>0\\), then \\(x^2-2x<0\\).",
          "B. If \\(x\\leq0\\), then \\(x^2-2x\\geq0\\).",
          "C. If \\(x^2-2x<0\\), then \\(x<0\\).",
          "D. If \\(x^2-2x\\leq0\\), then \\(x>0\\)."
        ].join("\n")
      },
      6: {
        promptLatex: [
          "6 The complex numbers \\(z\\) and \\(w\\) lie on the unit circle. The modulus of \\(z+w\\) is \\(\\frac32\\).",
          "What is the modulus of \\(z-w\\)?",
          "A. \\(\\frac18\\)",
          "B. \\(\\frac{\\sqrt7}{2}\\)",
          "C. \\(\\frac32\\)",
          "D. \\(\\frac74\\)"
        ].join("\n")
      },
      7: {
        promptLatex: [
          "7 The complex number \\(z\\) lies on the unit circle.",
          "What is the range of \\(\\operatorname{Arg}(z-2i)\\)?",
          "A. \\(\\frac{\\pi}{6}\\leq\\operatorname{Arg}(z-2i)\\leq\\frac{5\\pi}{6}\\)",
          "B. \\(\\frac{\\pi}{3}\\leq\\operatorname{Arg}(z-2i)\\leq\\frac{2\\pi}{3}\\)",
          "C. \\(-\\frac{5\\pi}{6}\\leq\\operatorname{Arg}(z-2i)\\leq-\\frac{\\pi}{6}\\)",
          "D. \\(-\\frac{2\\pi}{3}\\leq\\operatorname{Arg}(z-2i)\\leq-\\frac{\\pi}{3}\\)"
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext2-2025-q07-unit-circle-arg",
            "graph",
            "Unit circle on the complex plane",
            "Complex-plane graph showing the unit circle centred at the origin with x- and y-axes marked from -3 to 3."
          )
        ]
      },
      8: {
        promptLatex: [
          "8 The graph shows the velocity of a particle as a function of its displacement.",
          "Which of the following graphs best shows the acceleration of the particle as a function of its displacement?",
          "The four candidate acceleration graphs are shown in the asset."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext2-2025-q08-velocity-acceleration-graphs",
            "graph",
            "Velocity graph and acceleration graph options",
            "The given velocity-displacement graph and four candidate acceleration-displacement graphs labelled A to D."
          )
        ]
      },
      9: {
        promptLatex: [
          "9 The points \\(U\\), \\(V\\), \\(W\\) and \\(Z\\) represent the complex numbers \\(u\\), \\(v\\), \\(w\\) and \\(z\\) respectively.",
          "It is given that \\(v+z=u+w\\) and \\(u+kiz=w+kiv\\), where \\(k\\in\\mathbb{R}\\) and \\(k>1\\).",
          "Which quadrilateral best describes \\(UVWZ\\)?",
          "A. Parallelogram",
          "B. Rectangle",
          "C. Rhombus",
          "D. Square"
        ].join("\n")
      },
      10: {
        promptLatex: [
          "10 Which of the following gives the same curve as \\(\\begin{pmatrix}\\cos(t)\\\\-t\\\\\\sin(t)\\end{pmatrix}\\) for \\(t \\in \\mathbb{R}\\)?",
          "A. \\(\\begin{pmatrix}\\cos(2t)\\\\2t\\\\\\sin(2t)\\end{pmatrix}\\)",
          "B. \\(\\begin{pmatrix}\\cos\\left(t^2+\\frac{\\pi}{2}\\right)\\\\t^2+\\frac{\\pi}{2}\\\\\\sin\\left(t^2+\\frac{\\pi}{2}\\right)\\end{pmatrix}\\)",
          "C. \\(\\begin{pmatrix}\\cos(t^2)\\\\-t^2\\\\\\sin(t^2)\\end{pmatrix}\\)",
          "D. \\(\\begin{pmatrix}\\cos\\left(2t+\\frac{\\pi}{2}\\right)\\\\2t+\\frac{\\pi}{2}\\\\-\\sin\\left(2t+\\frac{\\pi}{2}\\right)\\end{pmatrix}\\)"
        ].join("\n")
      },
      11: {
        promptLatex: [
          "Question 11 (14 marks) Use the Question 11 Writing Booklet",
          "(a) The location of the complex number \\(z\\) is shown on the diagram on page 1 of the Question 11 Writing Booklet. On the diagram provided in the writing booklet, indicate the locations of \\(\\overline{z}\\) and \\(i\\overline{z}\\).",
          "(b) The complex numbers \\(w\\) and \\(z\\) are given by \\(w=2e^{i\\pi/6}\\) and \\(z=3e^{i\\pi/6}\\). Find the modulus and argument of \\(wz\\).",
          "(c) The complex number \\(z\\) is given by \\(x+iy\\). Find, in Cartesian form: (i) \\(z^2\\); (ii) \\(\\frac1z\\).",
          "(d) (i) Force \\(\\mathbf{F}_1\\) has magnitude 12 newtons in the direction of vector \\(2\\mathbf{i}-2\\mathbf{j}+\\mathbf{k}\\). Show that \\(\\mathbf{F}_1=8\\mathbf{i}-8\\mathbf{j}+4\\mathbf{k}\\).",
          "(ii) Force \\(\\mathbf{F}_1\\) from part (i) and a second force, \\(\\mathbf{F}_2=-6\\mathbf{i}+12\\mathbf{j}+4\\mathbf{k}\\), both act upon a particle. Show that the resultant force acting on the particle is given by \\(\\mathbf{F}_3=2\\mathbf{i}+4\\mathbf{j}+8\\mathbf{k}\\).",
          "(iii) Calculate \\(\\mathbf{F}_3\\cdot\\mathbf{d}\\), where \\(\\mathbf{F}_3\\) is the resultant force from part (ii) and \\(\\mathbf{d}=\\mathbf{i}+\\mathbf{j}+2\\mathbf{k}\\).",
          "(e) Prove by contradiction that \\(\\sqrt3+\\sqrt5>\\sqrt{11}\\).",
          "(f) Find \\(\\int\\frac{5}{7-x^2-6x}\\,dx\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(\\overline{z}\\) is reflected in the real axis, and \\(i\\overline{z}\\) is obtained by rotating \\(\\overline{z}\\) through \\(\\frac{\\pi}{2}\\).",
          "(b) \\(wz=6e^{i\\pi/3}\\), so the modulus is 6 and the argument is \\(\\frac{\\pi}{3}\\).",
          "(c) (i) \\(z^2=(x^2-y^2)+2xyi\\). (ii) \\(\\frac1z=\\frac{x}{x^2+y^2}-\\frac{y}{x^2+y^2}i\\).",
          "(d) (i) \\(|2\\mathbf{i}-2\\mathbf{j}+\\mathbf{k}|=3\\), so \\(\\mathbf{F}_1=4(2\\mathbf{i}-2\\mathbf{j}+\\mathbf{k})\\). (ii) \\(\\mathbf{F}_3=\\mathbf{F}_1+\\mathbf{F}_2=2\\mathbf{i}+4\\mathbf{j}+8\\mathbf{k}\\). (iii) \\(\\mathbf{F}_3\\cdot\\mathbf{d}=22\\).",
          "(e) Assuming \\(\\sqrt3+\\sqrt5\\leq\\sqrt{11}\\) leads after squaring to \\(60\\leq9\\), a contradiction.",
          "(f) \\(\\int\\frac{5}{7-x^2-6x}\\,dx=5\\sin^{-1}\\left(\\frac{x+3}{4}\\right)+C\\)."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext2-2025-q11-writing-booklet-complex-plane",
            "graph",
            "Writing booklet complex-plane diagram",
            "Complex-plane axes with the point z in the first quadrant, used for plotting the conjugate of z and i times the conjugate of z."
          )
        ]
      },
      12: {
        promptLatex: [
          "Question 12 (16 marks) Use the Question 12 Writing Booklet",
          "(a) Using integration by parts, evaluate \\(\\int_0^{\\pi/2}x\\sin x\\,dx\\).",
          "(b) Given the function \\(y=xe^{2x}\\), use mathematical induction to prove that \\(\\frac{d^ny}{dx^n}=\\left(2^nx+n2^{n-1}\\right)e^{2x}\\) for all positive integers \\(n\\), where \\(\\frac{d^ny}{dx^n}\\) is the \\(n\\)th derivative of \\(y\\) and \\(\\frac{d}{dx}\\left(\\frac{d^ny}{dx^n}\\right)=\\frac{d^{n+1}y}{dx^{n+1}}\\).",
          "(c) Sketch the region of the complex plane defined by \\(|z+5-i|>|z-3+3i|\\).",
          "(d) Find \\(\\int\\frac{x^2-2x+9}{(4-x)(x^2+1)}\\,dx\\).",
          "(e) A particle of mass \\(m\\) kg moves along a horizontal line with an initial velocity of \\(V_0\\ \\mathrm{m\\ s^{-1}}\\). The motion of the particle is resisted by a constant force of \\(mk\\) newtons and a variable force of \\(mv^2\\) newtons, where \\(k\\) is a positive constant and \\(v\\ \\mathrm{m\\ s^{-1}}\\) is the velocity of the particle at \\(t\\) seconds. Show that the distance travelled when the particle is brought to rest is \\(\\frac12\\ln\\left(\\frac{k+V_0^2}{k}\\right)\\) metres."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) \\(\\int_0^{\\pi/2}x\\sin x\\,dx=1\\).",
          "(b) The base case \\(n=1\\) is true. Differentiating the assumed \\(n=k\\) form gives \\(\\frac{d^{k+1}y}{dx^{k+1}}=(2^{k+1}x+(k+1)2^k)e^{2x}\\), completing induction.",
          "(c) The locus is the half-plane closer to \\(3-3i\\) than to \\(-5+i\\).",
          "(d) \\(-\\ln|4-x|+2\\tan^{-1}x+C\\).",
          "(e) From \\(v\\frac{dv}{dx}=-(k+v^2)\\), integrate from \\(v=V_0\\) to \\(v=0\\) to obtain \\(x=\\frac12\\ln\\left(\\frac{k+V_0^2}{k}\\right)\\)."
        ].join("\n")
      },
      13: {
        promptLatex: [
          "Question 13 (15 marks) Use the Question 13 Writing Booklet",
          "(a) It is given that \\(A=\\int_2^4\\frac{e^x}{x-1}\\,dx\\). Show that \\(\\int_{m-4}^{m-2}\\frac{e^{-x}}{x-m+1}\\,dx=kA\\), where \\(k\\) and \\(m\\) are constants.",
          "(b) Let \\(\\mathbf{c}=x\\mathbf{i}+y\\mathbf{j}+z\\mathbf{k}\\) be a unit vector that is perpendicular to both \\(\\mathbf{a}=2\\mathbf{i}+4\\mathbf{j}-3\\mathbf{k}\\) and \\(\\mathbf{b}=-4\\mathbf{i}-5\\mathbf{j}+3\\mathbf{k}\\). Find all possible vectors \\(\\mathbf{c}\\).",
          "(c) (i) For positive real numbers \\(a\\) and \\(b\\), prove that \\(\\frac{a+b}{2}\\geq\\sqrt{ab}\\).",
          "(ii) Hence, or otherwise, show that \\(\\frac{2n+1}{2n+2}<\\sqrt{\\frac{2n+1}{2n+3}}\\) for any integer \\(n\\geq0\\).",
          "(d) Evaluate \\(\\int_0^{\\pi/2}\\frac{u}{1+\\sin u+\\cos u}\\,du\\), by first using the substitution \\(u=\\frac{\\pi}{2}-x\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) With \\(u=m-x\\), the second integral becomes \\(-e^{-m}\\int_2^4\\frac{e^u}{u-1}\\,du\\), so \\(k=-e^{-m}\\).",
          "(b) Solving \\(\\mathbf{a}\\cdot\\mathbf{c}=0\\), \\(\\mathbf{b}\\cdot\\mathbf{c}=0\\) and \\(|\\mathbf{c}|=1\\) gives \\(\\mathbf{c}=\\pm\\left(\\frac13\\mathbf{i}-\\frac23\\mathbf{j}-\\frac23\\mathbf{k}\\right)\\).",
          "(c) (i) From \\((\\sqrt{a}-\\sqrt{b})^2\\geq0\\), \\(a+b\\geq2\\sqrt{ab}\\). (ii) Apply the result with \\(a=2n+1\\) and \\(b=2n+3\\).",
          "(d) Using the given substitution and then \\(t=\\tan\\frac{x}{2}\\) gives \\(\\int_0^{\\pi/2}\\frac{u}{1+\\sin u+\\cos u}\\,du=\\frac{\\pi}{4}\\ln2\\)."
        ].join("\n")
      },
      14: {
        promptLatex: [
          "Question 14 (15 marks) Use the Question 14 Writing Booklet",
          "(a) Let \\(I_n=\\int_{\\pi/4}^{\\pi/2}\\cot^{2n}\\theta\\,d\\theta\\) for integers \\(n\\geq0\\).",
          "(i) Show that \\(I_n=\\frac{1}{2n-1}-I_{n-1}\\) for \\(n>0\\), given that \\(\\frac{d}{d\\theta}\\cot\\theta=-\\cosec^2\\theta\\).",
          "(ii) Hence, or otherwise, calculate \\(I_2\\).",
          "(b) The acceleration of a particle is given by \\(\\ddot{x}=32x(x^2+3)\\), where \\(x\\) is the displacement of the particle from a fixed point \\(O\\) after \\(t\\) seconds, in metres. Initially the particle is at \\(O\\) and has a velocity of \\(12\\ \\mathrm{m\\ s^{-1}}\\) in the negative direction. (i) Show that the velocity of the particle is given by \\(v=-4(x^2+3)\\). (ii) Find the time taken for the particle to travel 3 metres from the origin.",
          "(c) Let \\(w\\) be a complex number such that \\(1+w+w^2+\\cdots+w^6=0\\). (i) Show that \\(w\\) is a 7th root of unity. The complex number \\(\\alpha=w+w^2+w^4\\) is a root of the equation \\(x^2+bx+c=0\\), where \\(b\\) and \\(c\\) are real and \\(\\alpha\\) is not real. (ii) Find the other root of \\(x^2+bx+c=0\\) in terms of positive powers of \\(w\\). (iii) Find the numerical value of \\(c\\).",
          "(d) Positive real numbers \\(a\\), \\(b\\), \\(c\\) and \\(d\\) are chosen such that \\(\\frac1a\\), \\(\\frac1b\\), \\(\\frac1c\\) and \\(\\frac1d\\) are consecutive terms in an arithmetic sequence with common difference \\(k\\), where \\(k\\in\\mathbb{R}\\) and \\(k>0\\). Show that \\(b+c<a+d\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) (i) Writing \\(\\cot^{2n}\\theta=\\cot^{2n-2}\\theta(\\cosec^2\\theta-1)\\) gives \\(I_n=\\frac{1}{2n-1}-I_{n-1}\\). (ii) \\(I_2=\\frac{\\pi}{4}-\\frac23\\).",
          "(b) (i) Integrating \\(v\\frac{dv}{dx}=32x(x^2+3)\\) and using \\(v(0)=-12\\) gives \\(v=-4(x^2+3)\\). (ii) The time is \\(\\frac{\\pi}{12\\sqrt3}\\) seconds.",
          "(c) (i) Multiplying the finite series by \\(1-w\\) gives \\(w^7=1\\). (ii) The other root is \\(w^3+w^5+w^6\\). (iii) \\(c=2\\).",
          "(d) Using \\(b=\\frac{a}{1+ak}\\), \\(c=\\frac{a}{1+2ak}\\), and \\(d=\\frac{a}{1+3ak}\\), compare \\(a+d\\) with \\(b+c\\) to obtain \\(b+c<a+d\\)."
        ].join("\n")
      },
      15: {
        promptLatex: [
          "Question 15 (15 marks) Use the Question 15 Writing Booklet",
          "(a) The adjacent sides of a parallelogram are represented by the vectors \\(\\mathbf{a}=4\\mathbf{i}+3\\mathbf{j}-\\mathbf{k}\\) and \\(\\mathbf{b}=2\\mathbf{i}-\\mathbf{j}+3\\mathbf{k}\\). Show that the area of the parallelogram is \\(6\\sqrt{10}\\) square units.",
          "(b) A particle moves in simple harmonic motion about the origin with amplitude \\(A\\), and it completes two cycles per second. When it is \\(\\frac14\\) metres from the origin, its speed is half its maximum speed. Find the maximum positive acceleration of the particle during its motion.",
          "(c) (i) Show that \\(\\frac{1+\\cos\\theta+i\\sin\\theta}{1-\\cos\\theta-i\\sin\\theta}=i\\cot\\frac{\\theta}{2}\\).",
          "(ii) Use De Moivre's theorem to show that the sixth roots of \\(-1\\) are given by \\(\\cos\\frac{(2k+1)\\pi}{6}+i\\sin\\frac{(2k+1)\\pi}{6}\\) for \\(k=0,1,2,3,4,5\\).",
          "(iii) Hence, or otherwise, show the solutions to \\(\\left(\\frac{z-6}{z+1}\\right)^6=-1\\) are \\(z=i\\cot\\frac{\\pi}{12}, i\\cot\\frac{3\\pi}{12}, i\\cot\\frac{5\\pi}{12}, i\\cot\\frac{7\\pi}{12}, i\\cot\\frac{9\\pi}{12}\\), and \\(i\\cot\\frac{11\\pi}{12}\\)."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) Using base \\(|\\mathbf{b}|=\\sqrt{14}\\) and perpendicular height \\(\\sqrt{\\frac{180}{7}}\\), the area is \\(6\\sqrt{10}\\).",
          "(b) The period is \\(\\frac12\\), so angular speed is \\(4\\pi\\). The amplitude is \\(\\frac{1}{2\\sqrt3}\\), giving maximum positive acceleration \\(\\frac{8\\pi^2}{\\sqrt3}\\ \\mathrm{m\\ s^{-2}}\\).",
          "(c) (i) Rationalising the denominator and using double-angle identities gives \\(i\\cot\\frac{\\theta}{2}\\). (ii) The sixth roots follow from \\(6\\theta=(2k+1)\\pi\\). (iii) Put \\(\\frac{z-6}{z+1}\\) equal to each sixth root and use part (i)."
        ].join("\n")
      },
      16: {
        promptLatex: [
          "Question 16 (15 marks) Use the Question 16 Writing Booklet",
          "(a) Consider the equation \\(z^n\\cos(n\\theta)+z^{n-1}\\cos((n-1)\\theta)+z^{n-2}\\cos((n-2)\\theta)+\\cdots+z\\cos\\theta=1\\), where \\(z\\in\\mathbb{C}\\), \\(\\theta\\in\\mathbb{R}\\), and \\(n\\) is a positive integer. Using a proof by contradiction and the triangle inequality, or otherwise, prove that all the solutions to the equation lie outside the circle \\(|z|=\\frac12\\) on the complex plane.",
          "(b) A particle of mass 1 kg is projected from the origin with a speed of \\(50\\ \\mathrm{m\\ s^{-1}}\\), at an angle of \\(\\theta\\) below the horizontal into a resistive medium. The position of the particle \\(t\\) seconds after projection is \\((x,y)\\), and the velocity of the particle at that time is \\(\\mathbf{v}=\\begin{pmatrix}\\dot{x}\\\\\\dot{y}\\end{pmatrix}\\). The resistive force, \\(\\mathbf{R}\\), is proportional to the velocity of the particle, so that \\(\\mathbf{R}=-k\\mathbf{v}\\), where \\(k\\) is a positive constant. Taking the acceleration due to gravity to be \\(10\\ \\mathrm{m\\ s^{-2}}\\), and the upwards vertical direction to be positive, the acceleration of the particle at time \\(t\\) is given by \\(\\mathbf{a}=\\begin{pmatrix}-k\\dot{x}\\\\-k\\dot{y}-10\\end{pmatrix}\\). Do NOT prove this. Derive the Cartesian equation of the motion of the particle, given \\(\\sin\\theta=\\frac35\\).",
          "(c) Consider the point \\(B\\) with three-dimensional position vector \\(\\mathbf{b}\\) and the line \\(C:\\mathbf{a}+\\lambda\\mathbf{d}\\), where \\(\\mathbf{a}\\) and \\(\\mathbf{d}\\) are three-dimensional vectors, \\(|\\mathbf{d}|=1\\) and \\(\\lambda\\) is a parameter. Let \\(f(\\lambda)\\) be the distance between a point on the line \\(C\\) and the point \\(B\\). (i) Find \\(\\lambda_0\\), the value of \\(\\lambda\\) that minimises \\(f\\), in terms of \\(\\mathbf{a}\\), \\(\\mathbf{b}\\) and \\(\\mathbf{d}\\). (ii) Let \\(P\\) be the point with position vector \\(\\mathbf{a}+\\lambda_0\\mathbf{d}\\). Show that \\(PB\\) is perpendicular to the direction of the line \\(C\\). (iii) Hence, or otherwise, find the shortest distance between the line \\(C\\) and the sphere of radius 1 unit, centred at the origin \\(O\\), in terms of \\(\\mathbf{d}\\) and \\(\\mathbf{a}\\). You may assume that if \\(B\\) is the point on the sphere closest to \\(C\\), then \\(O\\), \\(B\\) and \\(P\\) are a straight line."
        ].join("\n"),
        answerLatex: [
          "Official marking guide excerpt (source-reviewed):",
          "(a) If \\(|w|\\leq\\frac12\\), then the triangle inequality gives \\(1\\leq |w|^n+|w|^{n-1}+\\cdots+|w|<1\\), a contradiction. Hence all solutions lie outside \\(|z|=\\frac12\\).",
          "(b) Horizontal motion gives \\(x=\\frac{40}{k}(1-e^{-kt})\\). Vertical motion and \\(\\sin\\theta=\\frac35\\) give \\(y=\\frac{10(3k-1)}{k^2}(e^{-kt}-1)-\\frac{10t}{k}\\). Eliminating \\(t\\) gives \\(y=\\frac{10(1-3k)x}{40k}+\\frac{10}{k^2}\\ln\\left(\\frac{40}{40-kx}\\right)\\).",
          "(c) (i) \\(\\lambda_0=(\\mathbf{b}-\\mathbf{a})\\cdot\\mathbf{d}\\). (ii) \\(\\overrightarrow{PB}\\cdot\\mathbf{d}=0\\). (iii) The shortest distance is \\(\\sqrt{|\\mathbf{a}|^2-(\\mathbf{a}\\cdot\\mathbf{d})^2}-1\\), or 0 if the line intersects the sphere."
        ].join("\n"),
        assets: [
          examDerivedAsset(
            "ext2-2025-q16-projectile-diagram",
            "diagram",
            "Projectile below horizontal",
            "Coordinate diagram showing a particle projected from the origin at angle theta below the positive x-axis with speed 50 metres per second."
          )
        ]
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

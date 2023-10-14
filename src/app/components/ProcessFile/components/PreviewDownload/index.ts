import { ProcessingOutput, Questionaire } from "../Processing";
import { List } from "./TopDownPDFGenerator";
import { TopDownPDFGenerator } from "./TopDownPDFGenerator";

export { PreviewDownload } from "./PreviewDownload";
export { createPDF };
export {
  type TopDownPDFConfig,
  type MarginsInInches,
  type RectangleSpecsInInches,
  type FontConfig,
  type List,
  type UnorderedList,
  type OrderedList,
  TopDownPDFGenerator,
} from "./TopDownPDFGenerator";

function createPDF(processOutput: ProcessingOutput): TopDownPDFGenerator {
  const pdfGen = new TopDownPDFGenerator({
    format: "letter",
    orientation: "portrait",
    margins: "normal",
  });

  pdfGen.setFontConfig({ fontSizeInPt: 16, fontEmphasis: "bold" });
  pdfGen.appendText("LEarner ASsistance APplication", "center");
  pdfGen.setFontConfig({ fontSizeInPt: 12, fontEmphasis: "bolditalic" });
  switch (processOutput.typeOfService) {
    case "CREATEQUESTIONAIRE":
      pdfGen.appendText("Questionaire", "center");
      break;
    case "SUMMARIZE":
      pdfGen.appendText("Summary", "center");
      break;
  }

  if (
    processOutput.typeOfService === "CREATEQUESTIONAIRE" &&
    typeof processOutput.output === "object"
  ) {
    return processQuestionaireForPDF(pdfGen, processOutput.output);
  } else if (
    processOutput.typeOfService === "SUMMARIZE" &&
    typeof processOutput.output === "string"
  ) {
    return processSummaryForPDF(pdfGen, processOutput.output);
  }

  return pdfGen;
}

function processQuestionaireForPDF(
  pdfGen: TopDownPDFGenerator,
  questionaire: Questionaire,
): TopDownPDFGenerator {
  const questionaireAsList: List = {
    indexCharacter: "num",
    type: "ordered",
    items: [],
  };

  const answerAsList: List = {
    indexCharacter: "num",
    type: "ordered",
    items: [],
  };
  for (const item of questionaire) {
    if (item.typeOfAnswer === "SINGLE" || item.typeOfAnswer === "MULTIPLE") {
      questionaireAsList.items.push(item.question);
      questionaireAsList.items.push({
        indexCharacter: "alphabet",
        type: "ordered",
        items: item.choices,
      });
    } else if (
      item.typeOfAnswer === "BOOLEAN" ||
      item.typeOfAnswer === "ESSAY"
    ) {
      questionaireAsList.items.push(item.question);
    }

    if (item.typeOfAnswer !== "ESSAY") {
      if (item.typeOfAnswer === "BOOLEAN") {
        answerAsList.items.push(
          item.answers.map((answer) => (answer ? "True" : "False")).toString(),
        );
      } else {
        answerAsList.items.push(
          item.answers
            .map((answer) => String.fromCharCode("A".charCodeAt(0) + answer))
            .toString(),
        );
      }
    }
  }

  pdfGen.setFontConfig({ fontSizeInPt: 12, fontEmphasis: "normal" });
  pdfGen.appendList(questionaireAsList);

  if (questionaire[0].typeOfAnswer !== "ESSAY") {
    pdfGen.addPageAndFocusThatPage();
    pdfGen.setFontConfig({ fontEmphasis: "bold" });
    pdfGen.appendText("ANSWERS");
    pdfGen.setFontConfig({ fontEmphasis: "normal" });
    pdfGen.appendList(answerAsList);
  }
  return pdfGen;
}

function processSummaryForPDF(
  pdfGen: TopDownPDFGenerator,
  summary: string,
): TopDownPDFGenerator {
  pdfGen.setFontConfig({ fontSizeInPt: 12, fontEmphasis: "normal" });
  if (summary.includes("*")) {
    pdfGen.appendList({
      type: "unordered",
      indexCharacter: "*",
      items: summary.split("*").filter((item) => item),
    });
  } else {
    pdfGen.appendText(summary);
  }

  return pdfGen;
}

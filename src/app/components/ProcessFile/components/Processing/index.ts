"use client";

import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsAPI from "pdfjs-dist/types/src/display/api";
import { ServiceConfig } from "../ChooseService";
import {
  CreateQuestionaireConfig,
  SummarizeConfig,
} from "../ChooseService/ChooseService";

export { Processing, type ProcessingOutput } from "./Processing";
export { processFile, type Questionaire };

interface QuestionaireItem {
  questionIndex: number;
  question: string;
  choices: string[];
  readonly typeOfAnswer: CreateQuestionaireConfig["typeOfAnswer"];
  answers: number[]; // indicates answers using indices from the choices array
}

type Questionaire = QuestionaireItem[];

// TODO : Add error handling in the functions (eg. failed reading, network error, aborting when it takes too long)

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.worker.js";

async function processFile(
  file: File,
  serviceConfig: ServiceConfig,
  abortSignal: AbortSignal,
): Promise<Questionaire | string | undefined> {
  const segmentedContent = await getSegmentedContentFromFile(file);

  if (serviceConfig.typeOfService == "CREATEQUESTIONAIRE") {
    const questionaire = await processContentForCreateQuestionaire(
      segmentedContent,
      serviceConfig.config as CreateQuestionaireConfig,
      abortSignal,
    );

    return questionaire;
  } else if (serviceConfig.typeOfService == "SUMMARIZE") {
    const summary = await processContentForSummary(
      segmentedContent,
      serviceConfig.config as SummarizeConfig,
      abortSignal,
    );

    return summary;
  } else {
    console.error(
      `The feature "${serviceConfig.typeOfService}" is not yet implemented`,
    );
  }
}
async function getSegmentedContentFromFile(file: File): Promise<string[]> {
  /**
   * This function should handle how the contents of file should be segmented
   * for prompting to chatgpt.
   *
   * Right now (as of july 27,2023), the segmentation is based of the text
   * per page.
   *
   * TODO: create a effective preprocessing and segmentation algorithm for prompting
   */

  return getTextFromFilePerPage(file);
}

async function getTextFromFilePerPage(file: File): Promise<string[]> {
  // TODO: Extended this function to accomodate different files
  const fileExtension = file.name.split(".").pop();
  let textContentFromFile: string[];
  switch (fileExtension) {
    case "pdf":
      textContentFromFile = await getTextFromPDFFilePerPage(file);
      break;

    default:
      textContentFromFile = [];
  }
  return textContentFromFile;
}

async function getTextFromPDFFilePerPage(file: File): Promise<string[]> {
  const arrayBufferFile = await file.arrayBuffer();
  const pdfFile = await pdfjsLib.getDocument(arrayBufferFile).promise;
  const textPerPage: string[] = [];

  for (let i = 1; i <= pdfFile.numPages; i++) {
    const page = await pdfFile.getPage(i);
    const pageTextContent = await page.getTextContent();

    if (pageTextContent.items.length > 0) {
      textPerPage.push(
        pageTextContent.items
          // eslint-disable-next-line no-control-regex
          .map(
            (value) =>
              (value as pdfjsAPI.TextItem).str.replace(/[^\x00-\x7F]/g, "") ??
              " ",
          )
          .join(""),
      );
    } else {
      //TODO: Create a OCR handler for pages that are "images"
      console.error(`Page ${i} is an Image. Currently, it cannot handle it`);
    }
  }

  return textPerPage;
}

async function processContentForCreateQuestionaire(
  segmentedContent: string[],
  config: CreateQuestionaireConfig,
  abortSignal: AbortSignal,
): Promise<Questionaire | undefined> {
  //* Creation of the Prompt and calling the API
  const numChoices = 4;
  const payloads: string[] = [];

  const firstPayload = `Take note of the following text. The text is long so I'll tell you what to do with text after the "=*END OF TEXT*=" phase. Simply reply with "RECEIVED" after you receive each part of the text. I'll send you the first part of the text\n=*START OF TEXT*=\n${segmentedContent[0]}`;
  payloads.push(firstPayload);

  for (let i = 1; i < segmentedContent.length - 1; i++) {
    payloads.push(segmentedContent[i]);
  }

  let actionForSegmentedContent: string;

  switch (config.typeOfAnswer) {
    case "SINGLE":
      actionForSegmentedContent = `Based on the text I gave you, create ${config.numOfQuestions} questions with ${numChoices} multiple choices. Append the answers after all of the questions and choices are enumerated. Put "ANSWERS:" as an indicator for the answers. If the questions refer to the scenarios discussed in the text, give context to the question. Exclude examples from the text in the questions.`;
      break;

    case "MULTIPLE":
      actionForSegmentedContent = `Based on the text I gave you, create ${config.numOfQuestions} multiple-answer questions with ${numChoices} multiple choices. Make sure that each question has at least 2 answers. Append the answers after all of the questions and choices are enumerated. Put "ANSWERS:" as an indicator for the answers. If the questions refer to the scenarios discussed in the text, give context to the question. Exclude examples from the text in the questions.`;
      break;

    case "BOOLEAN":
      actionForSegmentedContent = `Based on the text I gave you, create ${config.numOfQuestions} questions with true or false choices. Append the answers after all of the questions and choices are enumerated. Put "ANSWERS:" as an indicator for the answers. If the questions refer to the scenarios discussed in the text, give context to the question. Exclude examples from the text in the questions.`;
      break;

    case "ESSAY":
      actionForSegmentedContent = `Based on the text I gave you, create ${config.numOfQuestions} questions.`;
      break;
    default:
      actionForSegmentedContent = `Based on the text I gave you, create ${config.numOfQuestions} questions.`;
  }

  const lastPayload = `${
    segmentedContent[segmentedContent.length - 1]
  }\n=*END OF TEXT*=\n${actionForSegmentedContent}`;
  payloads.push(lastPayload);

  for (let i = 0; i < payloads.length - 1; i++) {
    // setting a max token to limit the gpt output for acknowledgement
    await gptAPIPostRequestHandler(payloads[i], abortSignal, 5);
  }
  const responseGPT = await gptAPIPostRequestHandler(
    payloads[payloads.length - 1],
    abortSignal,
  );

  //* Processing of Response to match the required output
  const questionaireWithAnswers: Questionaire = [];

  let questionairePortion = "";
  let answerPortion = "";

  if (config.typeOfAnswer !== "ESSAY") {
    [questionairePortion, answerPortion] = responseGPT.split("ANSWERS:", 2);
  } else {
    questionairePortion = responseGPT;
  }

  const splittedQuestionairePortion = questionairePortion.split("\n");
  let questionIndex = 0;
  let choicesCapturingIndex = 0;
  let isCapturingChoices = false;
  for (let i = 0; i < splittedQuestionairePortion.length; i++) {
    const line = splittedQuestionairePortion[i];
    if (line.match(/^\d+\./g)) {
      // get the question and store it
      questionaireWithAnswers.push({
        questionIndex: questionIndex,
        question: line.replace(/^\d+\./g, "").trim(),
        choices: [],
        typeOfAnswer: config.typeOfAnswer,
        answers: [],
      } satisfies QuestionaireItem);

      if (
        config.typeOfAnswer !== "ESSAY" &&
        config.typeOfAnswer !== "BOOLEAN"
      ) {
        isCapturingChoices = true;
      }
    } else if (isCapturingChoices) {
      if (line === "") {
        continue;
      }
      const choice = line
        .trim()
        .replace(/^[A-Za-z]\)/g, "")
        .trim();
      questionaireWithAnswers[questionIndex].choices.push(choice);
      if (++choicesCapturingIndex >= numChoices) {
        isCapturingChoices = false;
        choicesCapturingIndex = 0;
        questionIndex++;
      }
    }
  }

  if (config.typeOfAnswer !== "ESSAY") {
    const splittedAnswerPortion = answerPortion
      .split(/[0-9]\./g)
      .map((element) => element.trim())
      .filter((element) => element);
    for (let i = 0; i < splittedAnswerPortion.length; i++) {
      if (config.typeOfAnswer === "BOOLEAN") {
        const answer = splittedAnswerPortion[i].toLowerCase();
        questionaireWithAnswers[i].answers.push(Number(answer === "true"));
      } else {
        const splittedAnswers = splittedAnswerPortion[i]
          .split("\n")
          .map((element) => element.trim());
        for (let k = 0; k < splittedAnswers.length; k++) {
          const letterAnswer = splittedAnswers[k].match(/^[A-Za-z](?=[).])/gm);
          if (letterAnswer) {
            questionaireWithAnswers[i].answers.push(
              letterAnswer[0].toLowerCase().charCodeAt(0) - "a".charCodeAt(0),
            );
          }
        }
      }
    }
  }
  return questionaireWithAnswers;
}

async function processContentForSummary(
  segmentedContent: string[],
  config: SummarizeConfig,
  abortSignal: AbortSignal,
): Promise<string | undefined> {
  //* Creation of the Prompt and calling the API
  const payloads: string[] = [];

  const firstPayload = `Take note of the following text. The text is long so I'll tell you what to do with text after the "=*END OF TEXT*=" phase. Simply reply with "RECEIVED" after you receive each part of the text. I'll send you the first part of the text\n=*START OF TEXT*=\n${segmentedContent[0]}`;
  payloads.push(firstPayload);

  for (let i = 1; i < segmentedContent.length - 1; i++) {
    payloads.push(segmentedContent[i]);
  }

  let actionForSegmentedContent: string;

  switch (config.typeOfSummary) {
    case "BULLET":
      actionForSegmentedContent = `Based on the text I gave you, create a bulleted summary such that it will not exceed ${config.maxNumOfWords} words. Don't put "summary" at the start of the text.  Use "*" as bullet points.`;
      break;

    case "PARAGRAPH":
      actionForSegmentedContent = `Based on the text that I gave, create a summary such that it will not exceed ${config.maxNumOfWords}. Don't put "summary" at the start of the text.`;
      break;

    default:
      actionForSegmentedContent = `Based on the text that I gave, create a summary such that it will not exceed ${config.maxNumOfWords}. Don't put "summary" at the start of the text.`;
  }

  const lastPayload = `${
    segmentedContent[segmentedContent.length - 1]
  }\n=*END OF TEXT*=\n${actionForSegmentedContent}`;
  payloads.push(lastPayload);

  for (let i = 0; i < payloads.length; i++) {
    // setting a max token to limit the gpt output for acknowledgement
    await gptAPIPostRequestHandler(payloads[i], abortSignal, 5);
  }
  return await gptAPIPostRequestHandler(
    payloads[payloads.length - 1],
    abortSignal,
  );
}

async function gptAPIPostRequestHandler(
  prompt: string,
  abortSignal: AbortSignal,
  maxTokens?: number,
): Promise<string> {
  //* Note: The Promise is immediatey executed at the instance of creation.

  const openaiAPIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY_DEV;
  const apiEndpoint = "https://api.openai.com/v1/chat/completions";
  const gpt_model = "gpt-3.5-turbo-0613";

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiAPIKey}`,
    },
    body: JSON.stringify({
      model: gpt_model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
    signal: abortSignal,
  });
  const responseJSON = await response.json();
  // console.log(responseJSON);

  return responseJSON.choices[0].message.content as string;
}

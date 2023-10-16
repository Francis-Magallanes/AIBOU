"use client";

import {
  Box,
  Button,
  Center,
  HStack,
  VStack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react";
import { DocumentUpload } from "./components/DocumentUpload";
import { ChooseService, ServiceConfig } from "./components/ChooseService";
import { Processing, ProcessingOutput } from "./components/Processing";
import { PreviewDownload } from "./components/PreviewDownload";
import { FC, useState, useReducer, useEffect } from "react";

export { ProcessFile };

const ProcessFileState = {
  UPLOAD: 0,
  CHOOSE_SERVICE: 1,
  PROCESSING: 2,
  PREVIEW_DOWNLOAD: 3,
} as const;

type ProcessFileState =
  (typeof ProcessFileState)[keyof typeof ProcessFileState];

type ProcessFileActionTypes = "Next" | "Previous" | "GoToState";

interface ProcessFileAction {
  type: ProcessFileActionTypes;
  payload?: ProcessFileState;
}

const steps: Array<{ title: string; description: string }> = [
  { title: "Step 1", description: "Upload File" },
  { title: "Step 2", description: "Choose Service" },
  { title: "Step 3", description: "Wait to Finish Processing" },
  { title: "Step 4", description: "Preview and Download Results" },
];

const availableFileTypes: Array<string> = [".pdf"];

// const tempProcessOutput: ProcessingOutput = {
// 	typeOfService: "CREATEQUESTIONAIRE",
// 	output: [
// 		{
// 			questionIndex: 0,
// 			question:
// 				"What is the main difference between packet forwarding mechanisms used by routers and stateful inspection firewalls?",
// 			choices: [
// 				"Routers forward packets based on destination matching in the routing table.",
// 				"Firewalls establish session entries and only allow subsequent packets matching the entry.",
// 				"Routers establish session entries for packets to be forwarded.",
// 				"Firewalls forward packets solely based on the destination address.",
// 			],
// 			typeOfAnswer: "MULTIPLE",
// 			answers: [0, 1],
// 		},
// 		{
// 			questionIndex: 1,
// 			question:
// 				"How does a link switchover impact packet forwarding in routers and stateful inspection firewalls?",
// 			choices: [
// 				"Routers continue to forward subsequent packets without interruption.",
// 				"Firewalls may interrupt services if subsequent packets cannot match the session entry.",
// 				"Both routers and firewalls experience interruption in forwarding packets.",
// 				"Neither routers nor firewalls are affected by link switchover.",
// 			],
// 			typeOfAnswer: "MULTIPLE",
// 			answers: [0, 1],
// 		},
// 		{
// 			questionIndex: 2,
// 			question:
// 				"What is a requirement for implementing hot standby of firewalls in terms of status information?",
// 			choices: [
// 				"Firewalls must have consistent VRRP status to ensure smooth operation.",
// 				"Firewalls must maintain consistent status information regarding packet forwarding mechanisms.",
// 				"VRRP is not necessary for implementing hot standby of firewalls.",
// 				"Firewalls should prioritize consistent session entry matching after a link switchover.",
// 			],
// 			typeOfAnswer: "MULTIPLE",
// 			answers: [0],
// 		},
// 	],
// };

// const tempProcessOutput: ProcessingOutput = {
// 	typeOfService: "SUMMARIZE",
// 	output: `* The cause of the problem is different packet forwarding mechanisms.
// * Routers search the routing table based on packet destination and forward only if there's a match.
// * Stateful inspection firewalls permit the first packet and establish a session entry for subsequent packets.
// * Link switchover can interrupt services if subsequent packets don't match the session entry.
// * Hot standby of firewalls requires consistent VRRP status and status information.`,
// };

const ProcessFile: FC = () => {
  const [file, setFile] = useState<File>();

  const {
    activeStep: currentStepIndex,
    setActiveStep: setCurrentStepIndex,
    goToNext,
    goToPrevious,
  } = useSteps({
    index: 0,
    count: steps.length,
  });

  const processFileReducer = (
    state: ProcessFileState,
    action: ProcessFileAction,
  ): ProcessFileState => {
    let newState: ProcessFileState = ProcessFileState.UPLOAD;
    switch (action.type) {
      case "Next":
        if (state === ProcessFileState.UPLOAD && file != undefined) {
          newState = ProcessFileState.CHOOSE_SERVICE;
        } else if (state === ProcessFileState.CHOOSE_SERVICE) {
          newState = ProcessFileState.PROCESSING;
        } else if (state === ProcessFileState.PROCESSING) {
          newState = ProcessFileState.PREVIEW_DOWNLOAD;
        } else if (state === ProcessFileState.PREVIEW_DOWNLOAD) {
          newState = ProcessFileState.UPLOAD;
        }
        break;

      case "Previous":
        if (state === ProcessFileState.CHOOSE_SERVICE) {
          newState = ProcessFileState.UPLOAD;
        }
        // You can't go back once the state is PROCESSING and PREVIEW_DOWNLOAD
        break;

      case "GoToState":
        newState = action.payload ?? ProcessFileState.UPLOAD;
        break;

      default:
        newState = state;
    }

    return newState ?? state;
  };

  const [currentProcessFileState, dispatchProcessFileState] = useReducer(
    processFileReducer,
    ProcessFileState.UPLOAD,
  );

  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    typeOfService: "CREATEQUESTIONAIRE",
    config: undefined,
  });

  const [processOutput, setProcessOutput] = useState<ProcessingOutput>();

  const previousButtonClick = () => {
    if (currentProcessFileState === ProcessFileState.CHOOSE_SERVICE) {
      setFile(undefined);
    }

    dispatchProcessFileState({ type: "Previous" });
    goToPrevious();
  };

  const nextButtonClick = () => {
    if (currentProcessFileState === ProcessFileState.PREVIEW_DOWNLOAD) {
      setCurrentStepIndex(0);
      setFile(undefined);
    } else {
      goToNext();
    }
    dispatchProcessFileState({ type: "Next" });
  };

  useEffect(() => {
    if (
      currentProcessFileState === ProcessFileState.PROCESSING &&
      processOutput
    ) {
      dispatchProcessFileState({ type: "Next" });
      goToNext();
    }
  }, [processOutput]);

  return (
    <>
      <VStack gap="0">
        <HStack
          padding="3rem"
          justify="center"
          gap="5rem"
        >
          <Stepper
            index={currentStepIndex}
            orientation="vertical"
            height="400px"
            gap="0"
          >
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>

                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>

          <Center>
            {currentProcessFileState === ProcessFileState.UPLOAD && (
              <DocumentUpload
                validFileTypes={availableFileTypes}
                setFile={setFile}
              />
            )}

            {currentProcessFileState === ProcessFileState.CHOOSE_SERVICE && (
              <ChooseService
                fileName={file?.name ?? "File Not Found"}
                setOutputServiceConfig={setServiceConfig}
              />
            )}

            {currentProcessFileState === ProcessFileState.PROCESSING && (
              <Processing
                file={file}
                serviceConfig={serviceConfig}
                setProcessingOutput={setProcessOutput}
              />
            )}

            {currentProcessFileState === ProcessFileState.PREVIEW_DOWNLOAD && (
              <PreviewDownload processingOutput={processOutput} />
            )}
          </Center>
        </HStack>

        <HStack gap="1rem">
          <Button
            colorScheme="blue"
            size="md"
            onClick={previousButtonClick}
            hidden={
              currentProcessFileState === ProcessFileState.UPLOAD ||
              currentProcessFileState === ProcessFileState.PROCESSING ||
              currentProcessFileState === ProcessFileState.PREVIEW_DOWNLOAD
            }
          >
            Previous
          </Button>
          <Button
            colorScheme="blue"
            size="md"
            onClick={nextButtonClick}
            hidden={
              (currentProcessFileState === ProcessFileState.UPLOAD &&
                file == undefined) ||
              currentProcessFileState === ProcessFileState.PROCESSING
            }
          >
            {currentProcessFileState === ProcessFileState.UPLOAD ||
            currentProcessFileState === ProcessFileState.CHOOSE_SERVICE
              ? "Next"
              : "Process Another File"}
          </Button>
        </HStack>
      </VStack>
    </>
  );
};
